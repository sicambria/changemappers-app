'use server';

import { logActionError } from '@/lib/action-logger';
import prisma, { FeedAnnotationSource } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentUserData } from '@/lib/get-current-user';
import { canViewFeedPost } from '@/lib/feed-visibility';
import {
  getFeedRdgOptions,
  getFeedTagOptions,
  replaceFeedPostAnnotations,
  validateFeedRdgSlugs,
  validateFeedTagKeys,
} from '@/lib/feed-annotation-persistence';
import type { FeedRdgOption, FeedTagOption } from '@/lib/feed-reactions';

import type { ApiResponse } from '@/types/common';

async function loadVisiblePost(postId: string, userId: string | null) {
  const post = await prisma.feedPost.findUnique({
    where: { id: postId, deletedAt: null },
    select: { id: true, slug: true, authorId: true, visibility: true },
  });
  if (!post || !canViewFeedPost(post, userId)) return null;
  return post;
}

export async function getFeedAnnotationOptionsAction(): Promise<ApiResponse<{ rdgs: FeedRdgOption[]; tags: FeedTagOption[] }>> {
  try {
    return {
      success: true,
      data: {
        rdgs: getFeedRdgOptions(),
        tags: await getFeedTagOptions(),
      },
    };
  } catch (error) {
    logActionError('getFeedAnnotationOptionsAction', error);
    return { success: false, error: 'Failed to get annotation options' };
  }
}

export async function saveFeedPostAuthorAnnotationsAction(
  postId: string,
  rdgSlugs: string[],
  tagKeys: string[],
): Promise<ApiResponse<void>> {
  try {
    const userResult = await getCurrentUserData();
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' };
    }
    const userId = userResult.data.user.id;
    const post = await loadVisiblePost(postId, userId);
    if (!post) return { success: false, error: 'Post not found' };
    if (post.authorId !== userId) {
      return { success: false, error: 'Only the post author can set author annotations' };
    }

    await replaceFeedPostAnnotations(prisma, {
      postId,
      userId,
      source: FeedAnnotationSource.AUTHOR,
      rdgSlugs,
      tagKeys,
    });

    revalidateTag(`post:${post.slug}`, 'default');
    revalidatePath('/feed');
    return { success: true, data: undefined };
  } catch (error) {
    logActionError('saveFeedPostAuthorAnnotationsAction', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to save annotations' };
  }
}

export async function saveFeedPostViewerAnnotationsAction(
  postId: string,
  rdgSlugs: string[],
  tagKeys: string[],
): Promise<ApiResponse<void>> {
  try {
    const userResult = await getCurrentUserData();
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' };
    }
    const userId = userResult.data.user.id;
    const post = await loadVisiblePost(postId, userId);
    if (!post) return { success: false, error: 'Post not found' };
    if (post.authorId === userId) {
      return { success: false, error: 'Post authors must use author annotations' };
    }

    validateFeedRdgSlugs(rdgSlugs);
    await validateFeedTagKeys(tagKeys);

    const [authorRdgCount, authorTagCount] = await Promise.all([
      prisma.feedPostRdgAnnotation.count({ where: { postId, source: FeedAnnotationSource.AUTHOR } }),
      prisma.feedPostTagAnnotation.count({ where: { postId, source: FeedAnnotationSource.AUTHOR } }),
    ]);

    if (rdgSlugs.length > 0 && authorRdgCount > 0) {
      return { success: false, error: 'The author already set RDGs for this post' };
    }
    if (tagKeys.length > 0 && authorTagCount > 0) {
      return { success: false, error: 'The author already set tags for this post' };
    }

    await replaceFeedPostAnnotations(prisma, {
      postId,
      userId,
      source: FeedAnnotationSource.VIEWER,
      rdgSlugs,
      tagKeys,
    });

    revalidateTag(`post:${post.slug}`, 'default');
    revalidatePath('/feed');
    return { success: true, data: undefined };
  } catch (error) {
    logActionError('saveFeedPostViewerAnnotationsAction', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to save annotations' };
  }
}
