'use server';
import { flattenError } from 'zod';

import { addDays } from 'date-fns';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  addStoryCommentSchema,
  createStorySchema,
  updateStorySchema,
  type AddStoryCommentInput,
  type CreateStoryInput,
  type UpdateStoryInput,
} from '@/lib/validations/stories';
import type { ApiResponse } from '@/types/modalities';
import type { StoriesPageData, StoryCommentView, StoryView } from '@/types/stories';
import { runAction } from '@/lib/server-action-wrapper';

const storySelect = {
  id: true,
  authorId: true,
  storyType: true,
  title: true,
  summary: true,
  context: true,
  challenge: true,
  whatHappened: true,
  outcome: true,
  lessonsLearned: true,
  retrospectiveWhatWorked: true,
  retrospectiveWhatToChange: true,
  retrospectiveAdvice: true,
  publishedAt: true,
  editDeadline: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: {
      id: true,
      name: true,
      displayName: true,
      profilePhoto: true,
    },
  },
  comments: {
    orderBy: { createdAt: 'asc' as const },
    select: {
      id: true,
      authorId: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          name: true,
          displayName: true,
        },
      },
    },
  },
} as const;

function normalizeComment(
  comment: {
    id: string;
    authorId: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    author: { name: string; displayName: string | null };
  },
): StoryCommentView {
  return {
    id: comment.id,
    authorId: comment.authorId,
    authorName: comment.author.displayName || comment.author.name || 'Anonymous',
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}

function normalizeStory(
  story: {
    id: string;
    authorId: string;
    storyType: 'SUCCESS' | 'FAILURE';
    title: string;
    summary: string;
    context: string;
    challenge: string;
    whatHappened: string;
    outcome: string;
    lessonsLearned: string;
    retrospectiveWhatWorked: string | null;
    retrospectiveWhatToChange: string | null;
    retrospectiveAdvice: string | null;
    publishedAt: Date;
    editDeadline: Date;
    createdAt: Date;
    updatedAt: Date;
    author: { id: string; name: string; displayName: string | null; profilePhoto: string | null };
    comments: Array<{
      id: string;
      authorId: string;
      content: string;
      createdAt: Date;
      updatedAt: Date;
      author: { name: string; displayName: string | null };
    }>;
  },
  currentUserId: string | null,
): StoryView {
  const isOwner = currentUserId === story.authorId;
  const canEdit = isOwner && story.editDeadline.getTime() >= Date.now();

  return {
    id: story.id,
    authorId: story.authorId,
    authorName: story.author.displayName || story.author.name || 'Anonymous',
    authorProfilePhoto: story.author.profilePhoto,
    storyType: story.storyType,
    title: story.title,
    summary: story.summary,
    context: story.context,
    challenge: story.challenge,
    whatHappened: story.whatHappened,
    outcome: story.outcome,
    lessonsLearned: story.lessonsLearned,
    retrospectiveWhatWorked: story.retrospectiveWhatWorked,
    retrospectiveWhatToChange: story.retrospectiveWhatToChange,
    retrospectiveAdvice: story.retrospectiveAdvice,
    publishedAt: story.publishedAt.toISOString(),
    editDeadline: story.editDeadline.toISOString(),
    createdAt: story.createdAt.toISOString(),
    updatedAt: story.updatedAt.toISOString(),
    isOwner,
    canEdit,
    comments: story.comments.map(normalizeComment),
  };
}

export async function getStoriesPageData(): Promise<StoriesPageData> {
  const auth = await getCurrentUser();
  const currentUserId = auth.success && auth.data ? auth.data.id : null;
  const currentUserName = auth.success && auth.data ? auth.data.displayName || auth.data.name : null;

	const stories = await prisma.story.findMany({
	orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
	select: storySelect,
	take: 100,
	});

  return {
    stories: stories.map((story) => normalizeStory(story, currentUserId)),
    currentUserId,
    currentUserName,
  };
}

export async function createStoryAction(input: CreateStoryInput): Promise<ApiResponse<StoryView>> {
  return runAction('createStoryAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = createStorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const now = new Date();
  const story = await prisma.story.create({
    data: {
      authorId: auth.data.id,
      storyType: parsed.data.storyType,
      title: parsed.data.title,
      summary: parsed.data.summary,
      context: parsed.data.context,
      challenge: parsed.data.challenge,
      whatHappened: parsed.data.whatHappened,
      outcome: parsed.data.outcome,
      lessonsLearned: parsed.data.lessonsLearned,
      retrospectiveWhatWorked: parsed.data.retrospectiveWhatWorked,
      retrospectiveWhatToChange: parsed.data.retrospectiveWhatToChange,
      retrospectiveAdvice: parsed.data.retrospectiveAdvice,
      publishedAt: now,
      editDeadline: addDays(now, 30),
    },
    select: storySelect,
  });

  revalidatePath('/stories');
  return { success: true, data: normalizeStory(story, auth.data.id) };
  });
}

export async function updateStoryAction(
  storyId: string,
  input: UpdateStoryInput,
): Promise<ApiResponse<StoryView>> {
  return runAction('updateStoryAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = updateStorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const existing = await prisma.story.findUnique({
    where: { id: storyId },
    select: {
      authorId: true,
      editDeadline: true,
    },
  });

  if (!existing || existing.authorId !== auth.data.id) {
    return { success: false, error: 'Not found' };
  }

  if (existing.editDeadline.getTime() < Date.now()) {
    return { success: false, error: 'Stories can only be edited within 30 days of publishing.' };
  }

  const story = await prisma.story.update({
    where: { id: storyId },
    data: parsed.data,
    select: storySelect,
  });

  revalidatePath('/stories');
  return { success: true, data: normalizeStory(story, auth.data.id) };
  });
}

export async function addStoryCommentAction(
  input: AddStoryCommentInput,
): Promise<ApiResponse<{ storyId: string; comment: StoryCommentView }>> {
  return runAction('addStoryCommentAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) {
    return { success: false, error: 'Unauthorized' };
  }

  const parsed = addStoryCommentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const story = await prisma.story.findUnique({
    where: { id: parsed.data.storyId },
    select: { id: true, authorId: true },
  });

  if (!story) {
    return { success: false, error: 'Story not found' };
  }

  if (story.authorId !== auth.data.id) {
    return { success: false, error: 'Only the original submitter can add follow-up comments.' };
  }

  const comment = await prisma.storyComment.create({
    data: {
      storyId: parsed.data.storyId,
      authorId: auth.data.id,
      content: parsed.data.content,
    },
    select: {
      id: true,
      authorId: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          name: true,
          displayName: true,
        },
      },
    },
  });

  revalidatePath('/stories');
  return {
    success: true,
    data: {
      storyId: parsed.data.storyId,
      comment: normalizeComment(comment),
    },
  };
  });
}
