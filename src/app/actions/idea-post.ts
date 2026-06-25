'use server';

import { logActionError } from '@/lib/action-logger';
import { localizeActionMessage } from '@/lib/action-result-i18n';
import { prisma, IdeaPostStatus } from '@/lib/prisma';
import type { Prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/app/actions/auth';
import { revalidatePath } from 'next/cache';
import { rateLimitAsync } from '@/lib/rate-limit';
import {
  submitIdeaPostSchema,
  addIdeaCommentSchema,
  getIdeaPostsSchema,
  adminUpdateIdeaPostStatusSchema,
  type SubmitIdeaPostInput,
  type GetIdeaPostsInput,
} from '@/lib/validations/idea-post';

type SessionUser = { id: string; isAdmin?: boolean; profileType?: string };

async function getRegisteredUser(): Promise<SessionUser | null> {
  const auth = await getCurrentUser();
  const user = auth.success ? auth.data?.user : null;
  if (!user?.id || user.profileType === 'GUEST') return null;
  return user;
}

async function getAdminUser(): Promise<SessionUser | null> {
  const user = await getRegisteredUser();
  return user?.isAdmin ? user : null;
}

async function rateLimited(bucket: string, max: number): Promise<boolean> {
  const rl = await rateLimitAsync(bucket, max, 60 * 60 * 1000);
  return !rl.success;
}

function buildIdeaWhere(filters: GetIdeaPostsInput): Prisma.IdeaPostWhereInput {
  const where: Prisma.IdeaPostWhereInput = {};
  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.rdgTags?.length) where.rdgTags = { hasSome: filters.rdgTags };
  if (filters.tags?.length) where.tags = { hasSome: filters.tags };
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return where;
}

export async function getIdeaPosts(input: GetIdeaPostsInput) {
  try {
    const user = await getRegisteredUser();
    if (!user) return { success: false as const, error: await localizeActionMessage('common.unauthorized') };

    const filters = getIdeaPostsSchema.parse(input);
    const where = buildIdeaWhere(filters);
    const skip = (filters.page - 1) * filters.pageSize;
    const orderBy: Prisma.IdeaPostOrderByWithRelationInput =
      filters.sort === 'newest' ? { createdAt: 'desc' } : { voteCount: 'desc' };

    const [rows, total] = await Promise.all([
      prisma.ideaPost.findMany({
        where,
        orderBy: [orderBy, { createdAt: 'desc' }],
        skip,
        take: filters.pageSize,
        include: {
          createdBy: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
          votes: { where: { userId: user.id }, select: { id: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.ideaPost.count({ where }),
    ]);

    const data = rows.map(({ votes, _count, ...post }) => ({
      ...post,
      hasVoted: votes.length > 0,
      commentCount: _count.comments,
    }));

    return { success: true as const, data, total, page: filters.page, pageSize: filters.pageSize, hasMore: skip + rows.length < total };
  } catch (error) {
    logActionError('getIdeaPosts error', error);
    return { success: false as const, error: await localizeActionMessage('ideas.fetchFailed') };
  }
}

async function resolveOwnedFeedbackId(feedbackId: string | undefined, userId: string): Promise<string | undefined> {
  if (!feedbackId) return undefined;
  const owned = await prisma.feedback.findFirst({ where: { id: feedbackId, userId }, select: { id: true } });
  return owned?.id;
}

export async function submitIdeaPost(input: SubmitIdeaPostInput) {
  try {
    const user = await getRegisteredUser();
    if (!user) return { success: false as const, error: await localizeActionMessage('common.unauthorized') };
    if (await rateLimited(`idea_submit_${user.id}`, 10)) {
      return { success: false as const, error: await localizeActionMessage('ideas.tooManySubmissions') };
    }

    const validated = submitIdeaPostSchema.parse(input);
    const feedbackId = await resolveOwnedFeedbackId(validated.feedbackId, user.id);

    const post = await prisma.ideaPost.create({
      data: {
        title: validated.title,
        description: validated.description,
        type: validated.type,
        tags: validated.tags,
        rdgTags: validated.rdgTags,
        feedbackId,
        createdById: user.id,
      },
    });

    revalidatePath('/roadmap');
    return { success: true as const, id: post.id };
  } catch (error) {
    logActionError('submitIdeaPost error', error);
    return { success: false as const, error: await localizeActionMessage('ideas.submitFailed') };
  }
}

export async function toggleIdeaVote(ideaPostId: string) {
  try {
    const user = await getRegisteredUser();
    if (!user) return { success: false as const, error: await localizeActionMessage('common.unauthorized') };

    const existing = await prisma.ideaVote.findUnique({
      where: { ideaPostId_userId: { ideaPostId, userId: user.id } },
      select: { id: true },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.ideaVote.delete({ where: { id: existing.id } }),
        prisma.ideaPost.update({ where: { id: ideaPostId }, data: { voteCount: { decrement: 1 } } }),
      ]);
      return { success: true as const, voted: false };
    }

    await prisma.$transaction([
      prisma.ideaVote.create({ data: { ideaPostId, userId: user.id } }),
      prisma.ideaPost.update({ where: { id: ideaPostId }, data: { voteCount: { increment: 1 } } }),
    ]);
    return { success: true as const, voted: true };
  } catch (error) {
    logActionError('toggleIdeaVote error', error);
    return { success: false as const, error: await localizeActionMessage('ideas.voteFailed') };
  }
}

export async function addIdeaComment(input: { ideaPostId: string; content: string }) {
  try {
    const user = await getRegisteredUser();
    if (!user) return { success: false as const, error: await localizeActionMessage('common.unauthorized') };
    if (await rateLimited(`idea_comment_${user.id}`, 30)) {
      return { success: false as const, error: await localizeActionMessage('ideas.tooManySubmissions') };
    }

    const validated = addIdeaCommentSchema.parse(input);
    const comment = await prisma.ideaComment.create({
      data: { ideaPostId: validated.ideaPostId, userId: user.id, content: validated.content },
      include: { user: { select: { id: true, name: true, displayName: true, profilePhoto: true } } },
    });

    revalidatePath('/roadmap');
    return { success: true as const, data: comment };
  } catch (error) {
    logActionError('addIdeaComment error', error);
    return { success: false as const, error: await localizeActionMessage('ideas.commentFailed') };
  }
}

export async function getIdeaComments(ideaPostId: string) {
  try {
    const user = await getRegisteredUser();
    if (!user) return { success: false as const, error: await localizeActionMessage('common.unauthorized') };

    const comments = await prisma.ideaComment.findMany({
      where: { ideaPostId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, name: true, displayName: true, profilePhoto: true } } },
    });
    return { success: true as const, data: comments };
  } catch (error) {
    logActionError('getIdeaComments error', error);
    return { success: false as const, error: await localizeActionMessage('ideas.fetchFailed') };
  }
}

export async function deleteIdeaComment(commentId: string) {
  try {
    const user = await getRegisteredUser();
    if (!user) return { success: false as const, error: await localizeActionMessage('common.unauthorized') };

    const comment = await prisma.ideaComment.findUnique({ where: { id: commentId }, select: { userId: true } });
    if (!comment) return { success: false as const, error: await localizeActionMessage('ideas.commentNotFound') };
    if (comment.userId !== user.id && !user.isAdmin) {
      return { success: false as const, error: await localizeActionMessage('common.unauthorized') };
    }

    await prisma.ideaComment.delete({ where: { id: commentId } });
    revalidatePath('/roadmap');
    return { success: true as const };
  } catch (error) {
    logActionError('deleteIdeaComment error', error);
    return { success: false as const, error: await localizeActionMessage('ideas.commentDeleteFailed') };
  }
}

export async function adminGetIdeaPosts(page = 1, pageSize = 20, filters?: GetIdeaPostsInput) {
  try {
    const admin = await getAdminUser();
    if (!admin) throw new Error(await localizeActionMessage('common.unauthorized'));

    const where = buildIdeaWhere(getIdeaPostsSchema.parse({ ...filters, page, pageSize }));
    const skip = (page - 1) * pageSize;

    const [data, totalCount] = await Promise.all([
      prisma.ideaPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          createdBy: { select: { name: true, email: true } },
          _count: { select: { votes: true, comments: true } },
        },
      }),
      prisma.ideaPost.count({ where }),
    ]);

    return { success: true as const, data, totalCount, totalPages: Math.ceil(totalCount / pageSize) };
  } catch (error) {
    logActionError('adminGetIdeaPosts error', error);
    return { success: false as const, error: await localizeActionMessage('ideas.fetchFailed') };
  }
}

export async function adminUpdateIdeaPostStatus(id: string, status: IdeaPostStatus) {
  try {
    const admin = await getAdminUser();
    if (!admin) throw new Error(await localizeActionMessage('common.unauthorized'));

    const validated = adminUpdateIdeaPostStatusSchema.parse({ id, status });
    await prisma.ideaPost.update({ where: { id: validated.id }, data: { status: validated.status } });

    revalidatePath('/roadmap');
    revalidatePath('/admin');
    return { success: true as const };
  } catch (error) {
    logActionError('adminUpdateIdeaPostStatus error', error);
    return { success: false as const, error: await localizeActionMessage('ideas.statusUpdateFailed') };
  }
}
