'use server';

import { logActionError } from '@/lib/action-logger';
import prisma, { AuditAction, FeedReactionType } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import { getCurrentUserData } from '@/lib/get-current-user';
import { createAuditLog } from '@/lib/audit';
import { canViewFeedPost } from '@/lib/feed-visibility';
import {
  FEED_REACTION_LABELS,
  FEED_REACTION_TYPES,
  type FeedReactionGroup,
  type FeedReactionType as ClientFeedReactionType,
} from '@/lib/feed-reactions';

import type { ApiResponse } from '@/types/common';

function parseReactionType(type: string): FeedReactionType {
  if (!FEED_REACTION_TYPES.includes(type as ClientFeedReactionType)) {
    throw new Error('Invalid reaction type');
  }
  return type as FeedReactionType;
}

export async function toggleFeedPostReactionAction(
  postId: string,
  type: string,
): Promise<ApiResponse<{ active: boolean; type: ClientFeedReactionType }>> {
  try {
    const userResult = await getCurrentUserData();
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' };
    }
    const userId = userResult.data.user.id;
    const reactionType = parseReactionType(type);

    const post = await prisma.feedPost.findUnique({
      where: { id: postId, deletedAt: null },
      select: { id: true, slug: true, authorId: true, visibility: true },
    });

    if (!post || !canViewFeedPost(post, userId)) {
      return { success: false, error: 'Post not found' };
    }

    const existing = await prisma.feedPostReaction.findUnique({
      where: { postId_userId_type: { postId, userId, type: reactionType } },
      select: { id: true },
    });

    if (existing) {
      await prisma.feedPostReaction.delete({ where: { id: existing.id } });
      await createAuditLog({
        action: AuditAction.DELETE,
        entityType: 'FeedPostReaction',
        entityId: existing.id,
        userId,
      });
      revalidateTag(`post:${post.slug}`, 'default');
      return { success: true, data: { active: false, type: reactionType as ClientFeedReactionType } };
    }

    const reaction = await prisma.feedPostReaction.create({
      data: { postId, userId, type: reactionType },
      select: { id: true },
    });
    await createAuditLog({
      action: AuditAction.CREATE,
      entityType: 'FeedPostReaction',
      entityId: reaction.id,
      userId,
    });
    revalidateTag(`post:${post.slug}`, 'default');
    return { success: true, data: { active: true, type: reactionType as ClientFeedReactionType } };
  } catch (error) {
    logActionError('toggleFeedPostReactionAction', error);
    return { success: false, error: 'Failed to toggle reaction' };
  }
}

export async function toggleFeedCommentReactionAction(
  commentId: string,
  type: string,
): Promise<ApiResponse<{ active: boolean; type: ClientFeedReactionType }>> {
  try {
    const userResult = await getCurrentUserData();
    if (!userResult.success || !userResult.data) {
      return { success: false, error: 'Unauthorized' };
    }
    const userId = userResult.data.user.id;
    const reactionType = parseReactionType(type);

    const comment = await prisma.feedComment.findUnique({
      where: { id: commentId, deletedAt: null },
      select: {
        id: true,
        postId: true,
        post: { select: { id: true, authorId: true, visibility: true, slug: true, deletedAt: true } },
      },
    });

    if (!comment || comment.post.deletedAt || !canViewFeedPost(comment.post, userId)) {
      return { success: false, error: 'Comment not found' };
    }

    const existing = await prisma.feedCommentReaction.findUnique({
      where: { commentId_userId_type: { commentId, userId, type: reactionType } },
      select: { id: true },
    });

    if (existing) {
      await prisma.feedCommentReaction.delete({ where: { id: existing.id } });
      await createAuditLog({
        action: AuditAction.DELETE,
        entityType: 'FeedCommentReaction',
        entityId: existing.id,
        userId,
      });
      revalidateTag(`post:${comment.post.slug}`, 'default');
      return { success: true, data: { active: false, type: reactionType as ClientFeedReactionType } };
    }

    const reaction = await prisma.feedCommentReaction.create({
      data: { commentId, userId, type: reactionType },
      select: { id: true },
    });
    await createAuditLog({
      action: AuditAction.CREATE,
      entityType: 'FeedCommentReaction',
      entityId: reaction.id,
      userId,
    });
    revalidateTag(`post:${comment.post.slug}`, 'default');
    return { success: true, data: { active: true, type: reactionType as ClientFeedReactionType } };
  } catch (error) {
    logActionError('toggleFeedCommentReactionAction', error);
    return { success: false, error: 'Failed to toggle reaction' };
  }
}

export async function getFeedPostReactionDetailsAction(
  postId: string,
  limitPerType = 50,
): Promise<ApiResponse<{ groups: FeedReactionGroup[]; currentUserTypes: ClientFeedReactionType[] }>> {
  try {
    const userResult = await getCurrentUserData();
    const userId = userResult.success ? userResult.data?.user.id : null;

    const post = await prisma.feedPost.findUnique({
      where: { id: postId, deletedAt: null },
      select: { id: true, authorId: true, visibility: true },
    });

    if (!post || !canViewFeedPost(post, userId)) {
      return { success: false, error: 'Post not found' };
    }

    const reactions = await prisma.feedPostReaction.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      select: {
        type: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            profilePhoto: true,
          },
        },
      },
    });

    const groups = FEED_REACTION_TYPES.map((reactionType) => {
      const rows = reactions.filter((reaction) => reaction.type === reactionType);
      return {
        type: reactionType,
        label: FEED_REACTION_LABELS[reactionType],
        count: rows.length,
        users: rows.slice(0, limitPerType).map((reaction) => reaction.user),
      };
    });

    return {
      success: true,
      data: {
        groups,
        currentUserTypes: userId
          ? reactions.filter((reaction) => reaction.userId === userId).map((reaction) => reaction.type as ClientFeedReactionType)
          : [],
      },
    };
  } catch (error) {
    logActionError('getFeedPostReactionDetailsAction', error);
    return { success: false, error: 'Failed to get reactions' };
  }
}
