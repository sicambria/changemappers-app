'use server';

import { logActionError } from '@/lib/action-logger';
import { isDynamicServerUsageError } from '@/lib/server-action-errors';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import prisma from '@/lib/prisma';
import { revalidateTag, revalidatePath } from 'next/cache';
import { getCurrentUserData } from '@/lib/get-current-user';
import { createAuditLog } from '@/lib/audit';
import { rateLimitAsync } from '@/lib/rate-limit';
import { AuditAction, FeedAnnotationSource, PostSource, PostVisibility, ModerationStatus, type Prisma } from '@/lib/prisma';
import { generateSlug } from '@/lib/slug';
import { withAvatarUrl } from '@/lib/entity-image';
import { replaceFeedPostAnnotations } from '@/lib/feed-annotation-persistence';
import type { ApiResponse } from '@/types/common';

const ALLOWED_POST_TAGS = [
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
  'ul', 'ol', 'li',
  'a', 'blockquote', 'pre', 'code',
  'span', 'div',
];

const ALLOWED_POST_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
  a: ['href', 'title', 'target', 'rel'],
  span: ['class', 'data-id', 'data-label', 'data-type'],
  div: ['class', 'data-video-embed', 'data-platform'],
  '*': ['class'],
};

function mergeSafeRel(value: string | undefined): string {
  const rel = new Set((value || '').split(/\s+/).filter(Boolean));
  rel.add('noopener');
  rel.add('noreferrer');
  return Array.from(rel).join(' ');
}

function sanitizePostContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_POST_TAGS,
    allowedAttributes: ALLOWED_POST_ATTRIBUTES,
    transformTags: {
      a: (tagName, attribs) => {
        if (!attribs.target) {
          return { tagName, attribs };
        }

        return {
          tagName,
          attribs: {
            ...attribs,
            rel: mergeSafeRel(attribs.rel),
          },
        };
      },
    },
    allowedSchemes: ['https', 'mailto'],
  });
}

export type FeedPost = Prisma.FeedPostGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        name: true;
        displayName: true;
        profilePhoto: true;
        verificationLevel: true;
      };
    };
    community: {
      select: { id: true; name: true };
    };
    _count: {
      select: { postReactions: true; comments: true };
    };
    postReactions: true;
  };
}>;

const createPostSchema = z.object({
  content: z.string().min(1, 'Post content is required').max(50000),
  plainText: z.string().max(50000).optional(),
  attachments: z.array(z.object({
    type: z.enum(['image', 'video']),
    url: z.url(),
    alt: z.string().optional(),
  })).optional(),
  youtubeLinks: z.array(z.string()).optional(),
  sourceType: z.enum(PostSource).default(PostSource.USER),
  communityId: z.string().optional(),
  visibility: z.enum(PostVisibility).default(PostVisibility.PUBLIC),
  rdgSlugs: z.array(z.string()).default([]),
  tagKeys: z.array(z.string()).default([]),
});

const updatePostSchema = createPostSchema.extend({
  postId: z.string(),
});

const getFeedSchema = z.object({
  sourceType: z.enum(PostSource).optional(),
  visibility: z.enum(PostVisibility).optional(),
  communityId: z.string().optional(),
  authorId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
});

const DEFAULT_GET_FEED_PARAMS: z.infer<typeof getFeedSchema> = { limit: 20 };

export async function createPostAction(
  data: z.infer<typeof createPostSchema>
): Promise<ApiResponse<{ postId: string; slug: string }>> {
  try {
    const userResult = await getCurrentUserData();
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' };
    }
    const userId = userResult.data.user.id;

    const rl = await rateLimitAsync(`post_${userId}`, 10, 60000);
    if (!rl.success) {
      return { success: false, error: 'Too many posts — please slow down.' };
    }

    const validated = createPostSchema.parse(data);

    const slug = generateSlug();
    const sanitizedContent = sanitizePostContent(validated.content);
    const plainText = validated.plainText || stripHtml(sanitizedContent);

    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.feedPost.create({
        data: {
          content: sanitizedContent,
          plainText,
          attachments: validated.attachments ?? undefined,
          youtubeLinks: validated.youtubeLinks ?? [],
          sourceType: validated.sourceType,
          authorId: userId,
          communityId: validated.communityId,
          visibility: validated.visibility,
          slug,
          status: ModerationStatus.APPROVED,
        },
      });

      await replaceFeedPostAnnotations(tx, {
        postId: created.id,
        userId,
        source: FeedAnnotationSource.AUTHOR,
        rdgSlugs: validated.rdgSlugs,
        tagKeys: validated.tagKeys,
      });

      return created;
    });

    await createAuditLog({
      action: AuditAction.CREATE,
      entityType: 'FeedPost',
      entityId: post.id,
      userId,
    });

    revalidateTag('feed', 'default');
    revalidatePath('/feed');

    return { success: true, data: { postId: post.id, slug: post.slug } };
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }
    logActionError('createPostAction', error);
    return { success: false, error: 'Failed to create post' };
  }
}

export async function updatePostAction(
  data: z.infer<typeof updatePostSchema>
): Promise<ApiResponse<{ postId: string; slug: string }>> {
  try {
    const userResult = await getCurrentUserData();
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' };
    }
    const userId = userResult.data.user.id;

    const validated = updatePostSchema.parse(data);

    const existingPost = await prisma.feedPost.findUnique({
      where: { id: validated.postId },
      select: { authorId: true, slug: true },
    });

    if (!existingPost) {
      return { success: false, error: 'Post not found' };
    }

    if (existingPost.authorId !== userId) {
      return { success: false, error: 'Not authorized to edit this post' };
    }

    const sanitizedContent = sanitizePostContent(validated.content);
    const plainText = validated.plainText || stripHtml(sanitizedContent);

    const post = await prisma.$transaction(async (tx) => {
      const updated = await tx.feedPost.update({
        where: { id: validated.postId },
        data: {
          content: sanitizedContent,
          plainText,
          attachments: validated.attachments ?? undefined,
          youtubeLinks: validated.youtubeLinks ?? [],
          visibility: validated.visibility,
          updatedAt: new Date(),
        },
      });

      await replaceFeedPostAnnotations(tx, {
        postId: updated.id,
        userId,
        source: FeedAnnotationSource.AUTHOR,
        rdgSlugs: validated.rdgSlugs,
        tagKeys: validated.tagKeys,
      });

      return updated;
    });

    await createAuditLog({
      action: AuditAction.UPDATE,
      entityType: 'FeedPost',
      entityId: post.id,
      userId,
    });

    revalidateTag('feed', 'default');
    revalidateTag(`post:${post.slug}`, 'default');
    revalidatePath('/feed');

    return { success: true, data: { postId: post.id, slug: post.slug } };
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }
    logActionError('updatePostAction', error);
    return { success: false, error: 'Failed to update post' };
  }
}

export async function deletePostAction(
  postId: string
): Promise<ApiResponse<void>> {
  try {
    const userResult = await getCurrentUserData();
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' };
    }
    const userId = userResult.data.user.id;

    const post = await prisma.feedPost.findUnique({
      where: { id: postId },
      select: { authorId: true, slug: true },
    });

    if (!post) {
      return { success: false, error: 'Post not found' };
    }

    if (post.authorId !== userId) {
      return { success: false, error: 'Not authorized to delete this post' };
    }

    await prisma.feedPost.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      action: AuditAction.DELETE,
      entityType: 'FeedPost',
      entityId: postId,
      userId,
    });

    revalidateTag('feed', 'default');
    revalidatePath('/feed');

    return { success: true, data: undefined };
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }
    logActionError('deletePostAction', error);
    return { success: false, error: 'Failed to delete post' };
  }
}

function coerceToArray<T>(value: T | T[] | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (value !== undefined) return [value];
  return [];
}

export async function getFeedAction(
params: z.infer<typeof getFeedSchema> = DEFAULT_GET_FEED_PARAMS
) {
try {
const userResult = await getCurrentUserData();
const userId = userResult.success ? userResult.data?.user.id : null;

    const validated = getFeedSchema.parse(params);

    const privacyFilter: Prisma.FeedPostWhereInput = userId ? {
      OR: [
        { visibility: PostVisibility.PUBLIC },
        { visibility: PostVisibility.REGISTERED },
        { visibility: PostVisibility.INTERNAL, authorId: userId },
      ]
    } : {
      visibility: PostVisibility.PUBLIC
    };

    const where: Prisma.FeedPostWhereInput = {
      deletedAt: null,
      status: ModerationStatus.APPROVED,
      ...privacyFilter,
    };

    if (validated.sourceType) {
      where.sourceType = validated.sourceType;
    }
    if (validated.communityId) {
      where.communityId = validated.communityId;
    }
    if (validated.authorId) {
      where.authorId = validated.authorId;
    }

    if (validated.visibility) {
      where.AND = [
        ...coerceToArray(where.AND),
        { visibility: validated.visibility },
      ];
    }

    if (validated.cursor) {
      where.createdAt = { lt: new Date(validated.cursor) };
    }

const posts = await prisma.feedPost.findMany({
where,
// Secondary sort on id keeps ordering deterministic when two posts share an
// exact createdAt, so paging cannot reorder the boundary.
orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
take: validated.limit + 1,
select: {
id: true,
slug: true,
content: true,
createdAt: true,
updatedAt: true,
commentsCount: true,
visibility: true,
sourceType: true,
youtubeLinks: true,
author: {
select: {
id: true,
name: true,
displayName: true,
profilePhoto: true,
verificationLevel: true,
},
},
community: {
select: { id: true, name: true },
},
_count: {
select: { postReactions: true, comments: true },
},
postReactions: userId
? { where: { userId }, select: { type: true } }
: false,
rdgAnnotations: { select: { rdgSlug: true, source: true, userId: true } },
tagAnnotations: { select: { tagKey: true, tagLabel: true, tagCategory: true, source: true, userId: true } },
},
});

    let nextCursor: string | null = null;
    if (posts.length > validated.limit) {
      // Drop the look-ahead row, then take the cursor from the last *displayed*
      // post so the next page (createdAt < cursor) resumes immediately after it.
      // Cursoring from the popped row would exclude it from both pages (skip).
      posts.pop();
      const lastDisplayed = posts.at(-1);
      nextCursor = lastDisplayed?.createdAt.toISOString() ?? null;
    }

    return {
      success: true,
      data: {
        // C1 (2026-06-18 audit): never ship base64 author avatars in the feed
        // list — substitute the lazily-fetched entity-image URL per row.
        posts: posts.map((p) => (p.author ? { ...p, author: withAvatarUrl(p.author) } : p)),
        nextCursor,
      },
    };
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }
    logActionError('getFeedAction', error);
    return { success: false, error: 'Failed to get feed' };
  }
}

export async function getPostBySlugAction(
  slug: string
): Promise<ApiResponse<unknown>> {
  try {
    const userResult = await getCurrentUserData();
    const userId = userResult.success ? userResult.data?.user.id : null;

    const post = await prisma.feedPost.findUnique({
      where: { slug, deletedAt: null },
      select: {
        id: true,
        slug: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        commentsCount: true,
        visibility: true,
        authorId: true,
        author: {
          select: {
            id: true,
            name: true,
            displayName: true,
            profilePhoto: true,
            verificationLevel: true,
            bio: true,
          },
        },
        community: {
          select: { id: true, name: true },
        },
        _count: {
          select: { postReactions: true, comments: true },
        },
        postReactions: userId
          ? { where: { userId }, select: { type: true } }
          : false,
        rdgAnnotations: { select: { rdgSlug: true, source: true, userId: true } },
        tagAnnotations: { select: { tagKey: true, tagLabel: true, tagCategory: true, source: true, userId: true } },
      },
    });

    if (!post) {
      return { success: false, error: 'Post not found' };
    }

    if (post.visibility === PostVisibility.PUBLIC) {
      return { success: true, data: post };
    }

    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (post.visibility === PostVisibility.REGISTERED) {
      return { success: true, data: post };
    }

    if (post.visibility === PostVisibility.INTERNAL && post.authorId === userId) {
      return { success: true, data: post };
    }

    return { success: false, error: 'Unauthorized' };
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }
    logActionError('getPostBySlugAction', error);
    return { success: false, error: 'Failed to get post' };
  }
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replaceAll(/<[^>]+>/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim();
}
