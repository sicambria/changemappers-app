'use server';

import { logActionError } from '@/lib/action-logger';
import { isDynamicServerUsageError } from '@/lib/server-action-errors';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import prisma, { AuditAction } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import { getCurrentUserData } from '@/lib/get-current-user';
import { createAuditLog } from '@/lib/audit';
import { canViewFeedPost } from '@/lib/feed-visibility';

const ALLOWED_COMMENT_TAGS = [
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'code',
  'a', 'ul', 'ol', 'li', 'blockquote',
];

function sanitizeCommentContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_COMMENT_TAGS,
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto'],
  });
}

import type { ApiResponse } from '@/types/common';

const createCommentSchema = z.object({
  postId: z.string(),
  content: z.string().min(1, 'Comment content is required').max(5000),
  plainText: z.string().max(5000).optional(),
  parentId: z.string().optional(),
});

const updateCommentSchema = z.object({
  commentId: z.string(),
  content: z.string().min(1).max(5000),
  plainText: z.string().max(5000).optional(),
});

const getCommentsSchema = z.object({
  postId: z.string(),
  parentId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().min(1).max(50).default(20),
});

export async function createCommentAction(
  data: z.infer<typeof createCommentSchema>
): Promise<ApiResponse<{ commentId: string }>> {
  try {
    const userResult = await getCurrentUserData();
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' };
    }
    const userId = userResult.data.user.id;

    const validated = createCommentSchema.parse(data);

    const post = await prisma.feedPost.findUnique({
      where: { id: validated.postId, deletedAt: null },
      select: { id: true, authorId: true, visibility: true },
    });

    if (!post || !canViewFeedPost(post, userId)) {
      return { success: false, error: 'Post not found' };
    }

    if (validated.parentId) {
      const parentComment = await prisma.feedComment.findUnique({
        where: { id: validated.parentId },
        select: { id: true, postId: true },
      });

      if (!parentComment || parentComment.postId !== validated.postId) {
        return { success: false, error: 'Invalid parent comment' };
      }
    }

    const sanitizedContent = sanitizeCommentContent(validated.content);
    const plainText = validated.plainText || stripHtml(sanitizedContent);

    const comment = await prisma.feedComment.create({
      data: {
        postId: validated.postId,
        content: sanitizedContent,
        plainText,
        authorId: userId,
        parentId: validated.parentId,
      },
    });

    await prisma.feedPost.update({
      where: { id: validated.postId },
      data: { commentsCount: { increment: 1 } },
    });

    await createAuditLog({
      action: AuditAction.CREATE,
      entityType: 'FeedComment',
      entityId: comment.id,
      userId,
    });

    revalidateTag(`post:${validated.postId}`, 'default');

    return { success: true, data: { commentId: comment.id } };
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }
    logActionError('createCommentAction', error);
    return { success: false, error: 'Failed to create comment' };
  }
}

export async function updateCommentAction(
  data: z.infer<typeof updateCommentSchema>
): Promise<ApiResponse<{ commentId: string }>> {
  try {
    const userResult = await getCurrentUserData();
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' };
    }
    const userId = userResult.data.user.id;

    const validated = updateCommentSchema.parse(data);

    const comment = await prisma.feedComment.findUnique({
      where: { id: validated.commentId },
      select: { authorId: true, postId: true },
    });

    if (!comment) {
      return { success: false, error: 'Comment not found' };
    }

    if (comment.authorId !== userId) {
      return { success: false, error: 'Not authorized' };
    }

    const sanitizedContent = sanitizeCommentContent(validated.content);
    const plainText = validated.plainText || stripHtml(sanitizedContent);

    const updatedComment = await prisma.feedComment.update({
      where: { id: validated.commentId },
      data: {
        content: sanitizedContent,
        plainText,
        updatedAt: new Date(),
      },
    });

    await createAuditLog({
      action: AuditAction.UPDATE,
      entityType: 'FeedComment',
      entityId: updatedComment.id,
      userId,
    });

    revalidateTag(`post:${comment.postId}`, 'default');

    return { success: true, data: { commentId: updatedComment.id } };
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }
    logActionError('updateCommentAction', error);
    return { success: false, error: 'Failed to update comment' };
  }
}

export async function deleteCommentAction(
  commentId: string
): Promise<ApiResponse<void>> {
  try {
    const userResult = await getCurrentUserData();
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' };
    }
    const userId = userResult.data.user.id;

    const comment = await prisma.feedComment.findUnique({
      where: { id: commentId },
      select: { authorId: true, postId: true },
    });

    if (!comment) {
      return { success: false, error: 'Comment not found' };
    }

    if (comment.authorId !== userId) {
      return { success: false, error: 'Not authorized' };
    }

    await prisma.feedComment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });

    await prisma.feedPost.update({
      where: { id: comment.postId },
      data: { commentsCount: { decrement: 1 } },
    });

    await createAuditLog({
      action: AuditAction.DELETE,
      entityType: 'FeedComment',
      entityId: commentId,
      userId,
    });

    revalidateTag(`post:${comment.postId}`, 'default');

    return { success: true, data: undefined };
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }
    logActionError('deleteCommentAction', error);
    return { success: false, error: 'Failed to delete comment' };
  }
}

export async function getCommentsAction(
  params: z.infer<typeof getCommentsSchema>
): Promise<ApiResponse<{
  comments: unknown[];
  nextCursor: string | null;
}>> {
  try {
    const userResult = await getCurrentUserData();
    const userId = userResult.success ? userResult.data?.user.id : null;

    const validated = getCommentsSchema.parse(params);

    const post = await prisma.feedPost.findUnique({
      where: { id: validated.postId, deletedAt: null },
      select: { id: true, authorId: true, visibility: true },
    });

    if (!post || !canViewFeedPost(post, userId)) {
      return { success: false, error: 'Post not found' };
    }

    const where: Record<string, unknown> = {
      postId: validated.postId,
      deletedAt: null,
    };

    if (validated.parentId) {
      where.parentId = validated.parentId;
    } else {
      where.parentId = null;
    }

    if (validated.cursor) {
      // Ascending order: the next page is the rows *after* the last displayed
      // comment, so filter strictly greater-than the cursor.
      where.createdAt = { gt: new Date(validated.cursor) };
    }

    const comments = await prisma.feedComment.findMany({
      where,
      // Secondary sort on id keeps ordering deterministic when two comments
      // share an exact createdAt, so paging cannot reorder the boundary.
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: validated.limit + 1,
      select: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            displayName: true,
            profilePhoto: true,
            verificationLevel: true,
          },
        },
        _count: {
          select: { replies: true, commentReactions: true },
        },
        commentReactions: userId
          ? { where: { userId }, select: { type: true } }
          : false,
      },
    });

    let nextCursor: string | null = null;
    if (comments.length > validated.limit) {
      // Drop the look-ahead row, then derive the cursor from the last *displayed*
      // comment so the next page resumes immediately after it (no gap, no overlap).
      comments.pop();
      const lastDisplayed = comments.at(-1);
      nextCursor = lastDisplayed?.createdAt.toISOString() ?? null;
    }

    return {
      success: true,
      data: {
        comments,
        nextCursor,
      },
    };
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }
    logActionError('getCommentsAction', error);
    return { success: false, error: 'Failed to get comments' };
  }
}

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replaceAll(/<[^>]+>/g, ' ')
    .replaceAll(/\s+/g, ' ')
    .trim();
}
