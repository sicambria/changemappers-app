'use server';
import { flattenError } from 'zod';

import { revalidateTag } from 'next/cache';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  createSchedulingPollSchema,
  submitVoteSchema,
  confirmTimeSchema,
  unconfirmTimeSchema,
  editPollSchema,
  type CreateSchedulingPollInput,
  type SubmitVoteInput,
  type ConfirmTimeInput,
  type UnconfirmTimeInput,
  type EditPollInput,
} from '@/lib/validations/scheduling';
import type { ApiResponse } from '@/types/modalities';
import { runAction } from '@/lib/server-action-wrapper';

const CACHE_TAG_SCHEDULING_POLLS = 'scheduling-polls';
const POLL_COOKIE_PREFIX = 'poll_';
const POLL_COOKIE_EXPIRY_DAYS = 30;
const ARCHIVE_AFTER_DAYS = 15;

export async function createSchedulingPollAction(
  input: CreateSchedulingPollInput,
): Promise<ApiResponse<{ id: string; participantToken: string; organizerToken: string }>> {
  return runAction('createSchedulingPollAction', async () => {
  const auth = await getCurrentUser();
  const creatorId = auth.success && auth.data ? auth.data.id : null;

  const parsed = createSchedulingPollSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const participantToken = nanoid(16);
  const organizerToken = nanoid(20);

  const poll = await prisma.schedulingPoll.create({
    data: {
      participantToken,
      organizerToken,
      title: parsed.data.title,
      description: parsed.data.description,
      organizerName: parsed.data.organizerName,
      location: parsed.data.location,
      timezone: parsed.data.timezone,
      creatorId,
      timeOptions: {
        create: parsed.data.timeOptions.map((opt, index) => ({
          startTime: opt.startTime,
          endTime: opt.endTime,
          sortOrder: index,
        })),
      },
    },
    select: {
      id: true,
      participantToken: true,
      organizerToken: true,
    },
  });

  revalidateTag(CACHE_TAG_SCHEDULING_POLLS, 'default');
  return { success: true, data: poll };
  });
}

export async function getPollByParticipantTokenAction(token: string): Promise<
  ApiResponse<{
    id: string;
    title: string;
    description: string | null;
    organizerName: string;
    location: string | null;
    timezone: string;
    confirmedTimeOptionId: string | null;
    confirmedAt: Date | null;
    timeOptions: Array<{
      id: string;
      startTime: Date;
      endTime: Date | null;
      sortOrder: number;
    }>;
    responses: Array<{
      id: string;
      participantName: string;
      votes: Array<{
        timeOptionId: string;
        vote: string;
      }>;
    }>;
    hasUserVoted: boolean;
    userResponseId: string | null;
  }>
> {
  return runAction('getPollByParticipantTokenAction', async () => {
  const poll = await prisma.schedulingPoll.findUnique({
    where: { participantToken: token },
    select: {
      id: true,
      title: true,
      description: true,
      organizerName: true,
      location: true,
      timezone: true,
      confirmedTimeOptionId: true,
      confirmedAt: true,
      timeOptions: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          sortOrder: true,
        },
      },
      responses: {
        select: {
          id: true,
          participantName: true,
          participantToken: true,
          votes: {
            select: {
              timeOptionId: true,
              vote: true,
            },
          },
        },
      },
    },
  });

  if (!poll) {
    return { success: false, error: 'Poll not found' };
  }

  const cookieStore = await cookies();
  const userTokenCookie = cookieStore.get(`${POLL_COOKIE_PREFIX}${poll.id}_token`);
  const userToken = userTokenCookie?.value;

  const userResponse = userToken
    ? poll.responses.find((r) => r.participantToken === userToken)
    : null;

  const publicResponses = poll.responses.map((r) => ({
    id: r.id,
    participantName: r.participantName,
    votes: r.votes,
  }));

  return {
    success: true,
    data: {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      organizerName: poll.organizerName,
      location: poll.location,
      timezone: poll.timezone,
      confirmedTimeOptionId: poll.confirmedTimeOptionId,
      confirmedAt: poll.confirmedAt,
      timeOptions: poll.timeOptions,
      responses: publicResponses,
      hasUserVoted: !!userResponse,
      userResponseId: userResponse?.id ?? null,
    },
  };
  });
}

export async function getPollByOrganizerTokenAction(token: string): Promise<
  ApiResponse<{
    id: string;
    title: string;
    description: string | null;
    organizerName: string;
    location: string | null;
    timezone: string;
    confirmedTimeOptionId: string | null;
    confirmedAt: Date | null;
    timeOptions: Array<{
      id: string;
      startTime: Date;
      endTime: Date | null;
      sortOrder: number;
      _count: { votes: number };
    }>;
    responses: Array<{
      id: string;
      participantName: string;
      votes: Array<{
        timeOptionId: string;
        vote: string;
      }>;
    }>;
    totalInvited: number;
  }>
> {
  return runAction('getPollByOrganizerTokenAction', async () => {
  const poll = await prisma.schedulingPoll.findUnique({
    where: { organizerToken: token },
    select: {
      id: true,
      title: true,
      description: true,
      organizerName: true,
      location: true,
      timezone: true,
      confirmedTimeOptionId: true,
      confirmedAt: true,
      timeOptions: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          sortOrder: true,
          _count: { select: { votes: true } },
        },
      },
      responses: {
        select: {
          id: true,
          participantName: true,
          votes: {
            select: {
              timeOptionId: true,
              vote: true,
            },
          },
        },
      },
    },
  });

  if (!poll) {
    return { success: false, error: 'Poll not found' };
  }

  return {
    success: true,
    data: {
      id: poll.id,
      title: poll.title,
      description: poll.description,
      organizerName: poll.organizerName,
      location: poll.location,
      timezone: poll.timezone,
      confirmedTimeOptionId: poll.confirmedTimeOptionId,
      confirmedAt: poll.confirmedAt,
      timeOptions: poll.timeOptions,
      responses: poll.responses,
      totalInvited: poll.responses.length,
    },
  };
  });
}

export async function submitVoteAction(input: SubmitVoteInput): Promise<
  ApiResponse<{
    id: string;
    participantToken: string;
  }>
> {
  return runAction('submitVoteAction', async () => {
  const parsed = submitVoteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const poll = await prisma.schedulingPoll.findUnique({
    where: { id: parsed.data.pollId },
    select: { id: true, confirmedTimeOptionId: true },
  });

  if (!poll) {
    return { success: false, error: 'Poll not found' };
  }

  if (poll.confirmedTimeOptionId) {
    return { success: false, error: 'Poll already confirmed' };
  }

  const [existingResponse, auth] = await Promise.all([
    prisma.schedulingResponse.findUnique({
      where: { participantToken: parsed.data.participantToken },
      select: { id: true },
    }),
    getCurrentUser(),
  ]);
  const participantUserId = auth.success && auth.data ? auth.data.id : null;

  let response: { id: string; participantToken: string };

  if (existingResponse) {
    await prisma.schedulingVote.deleteMany({
      where: { responseId: existingResponse.id },
    });

    await prisma.schedulingResponse.update({
      where: { id: existingResponse.id },
      data: { participantName: parsed.data.participantName, userId: participantUserId },
    });

    await prisma.schedulingVote.createMany({
      data: parsed.data.votes.map((v) => ({
        responseId: existingResponse.id,
        timeOptionId: v.timeOptionId,
        vote: v.vote,
      })),
    });

    response = { id: existingResponse.id, participantToken: parsed.data.participantToken };
  } else {
    const newToken = nanoid(16);

    const newResponse = await prisma.schedulingResponse.create({
      data: {
        pollId: parsed.data.pollId,
        participantName: parsed.data.participantName,
        participantToken: newToken,
        userId: participantUserId,
        votes: {
          create: parsed.data.votes.map((v) => ({
            timeOptionId: v.timeOptionId,
            vote: v.vote,
          })),
        },
      },
      select: { id: true, participantToken: true },
    });

    response = newResponse;
  }

  const cookieStore = await cookies();
  cookieStore.set(`${POLL_COOKIE_PREFIX}${parsed.data.pollId}_token`, response.participantToken, {
    maxAge: POLL_COOKIE_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
    httpOnly: true,
    // AUDIT-20260613-007: match the project cookie convention (secure in production).
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  revalidateTag(CACHE_TAG_SCHEDULING_POLLS, 'default');
  return { success: true, data: response };
  });
}

export async function confirmTimeAction(
  input: ConfirmTimeInput,
): Promise<ApiResponse<{ confirmedAt: Date }>> {
  return runAction('confirmTimeAction', async () => {
  const parsed = confirmTimeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  // AUDIT-20260613-001: scope by the secret organizerToken, not just pollId.
  // A generic "Poll not found" avoids an oracle distinguishing wrong-id from wrong-token.
  const poll = await prisma.schedulingPoll.findFirst({
    where: { id: parsed.data.pollId, organizerToken: parsed.data.organizerToken },
    select: {
      id: true,
      timeOptions: { where: { id: parsed.data.timeOptionId }, select: { id: true } },
    },
  });

  if (!poll) {
    return { success: false, error: 'Poll not found' };
  }

  if (poll.timeOptions.length === 0) {
    return { success: false, error: 'Time option not found in this poll' };
  }

  const now = new Date();
  await prisma.schedulingPoll.update({
    where: { id: parsed.data.pollId },
    data: {
      confirmedTimeOptionId: parsed.data.timeOptionId,
      confirmedAt: now,
    },
  });

  revalidateTag(CACHE_TAG_SCHEDULING_POLLS, 'default');
  return { success: true, data: { confirmedAt: now } };
  });
}

export async function unconfirmTimeAction(input: UnconfirmTimeInput): Promise<ApiResponse<void>> {
  return runAction('unconfirmTimeAction', async () => {
  const parsed = unconfirmTimeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  // AUDIT-20260613-001: updateMany scoped by organizerToken; count === 0 means the
  // caller does not hold the organizer capability for this poll.
  const result = await prisma.schedulingPoll.updateMany({
    where: { id: parsed.data.pollId, organizerToken: parsed.data.organizerToken },
    data: {
      confirmedTimeOptionId: null,
      confirmedAt: null,
    },
  });

  if (result.count === 0) {
    return { success: false, error: 'Poll not found' };
  }

  revalidateTag(CACHE_TAG_SCHEDULING_POLLS, 'default');
  return { success: true, data: undefined };
  });
}

export async function editPollAction(input: EditPollInput): Promise<ApiResponse<void>> {
  return runAction('editPollAction', async () => {
  const parsed = editPollSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  // AUDIT-20260613-001: verify the organizer capability before any mutation. The
  // subsequent writes are keyed by pollId, which is non-secret on its own.
  const owned = await prisma.schedulingPoll.findFirst({
    where: { id: parsed.data.pollId, organizerToken: parsed.data.organizerToken },
    select: { id: true },
  });

  if (!owned) {
    return { success: false, error: 'Poll not found' };
  }

  if (parsed.data.removeTimeOptionIds?.length) {
    const optionsWithVotes = await prisma.schedulingVote.findFirst({
      where: { timeOptionId: { in: parsed.data.removeTimeOptionIds } },
      select: { timeOptionId: true },
    });

    if (optionsWithVotes) {
      return { success: false, error: 'Cannot remove time options that have votes' };
    }

    // Scope the delete to this poll so an organizer cannot remove another poll's options.
    await prisma.schedulingTimeOption.deleteMany({
      where: { id: { in: parsed.data.removeTimeOptionIds }, pollId: parsed.data.pollId },
    });
  }

  const updateData: {
    title?: string;
    description?: string | null;
    location?: string | null;
  } = {};

  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.location !== undefined) updateData.location = parsed.data.location;

  if (Object.keys(updateData).length > 0) {
    await prisma.schedulingPoll.update({
      where: { id: parsed.data.pollId },
      data: updateData,
    });
  }

  if (parsed.data.addTimeOptions?.length) {
    const existingCount = await prisma.schedulingTimeOption.count({
      where: { pollId: parsed.data.pollId },
    });

    if (existingCount + parsed.data.addTimeOptions.length > 8) {
      return { success: false, error: 'Maximum 8 time options allowed' };
    }

    await prisma.schedulingTimeOption.createMany({
      data: parsed.data.addTimeOptions.map((opt, index) => ({
        pollId: parsed.data.pollId,
        startTime: opt.startTime,
        endTime: opt.endTime,
        sortOrder: existingCount + index,
      })),
    });
  }

  revalidateTag(CACHE_TAG_SCHEDULING_POLLS, 'default');
  return { success: true, data: undefined };
  });
}

export async function getUserPollsAction(): Promise<
  ApiResponse<
    Array<{
      id: string;
      title: string;
      organizerName: string;
      confirmedAt: Date | null;
      createdAt: Date;
      participantToken: string;
      organizerToken: string;
      _count: { responses: number };
    }>
  >
> {
  return runAction('getUserPollsAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) {
    return { success: false, error: 'Unauthorized' };
  }

  // Archive expired polls
  const now = new Date();
  const archiveThreshold = new Date(now.getTime() - ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000);
  
  const pollsToArchive = await prisma.schedulingPoll.findMany({
    where: {
      creatorId: auth.data.id,
      isArchived: false,
      OR: [
        {
          confirmedAt: { lt: archiveThreshold },
        },
        {
          confirmedAt: null,
          timeOptions: {
            some: {
              startTime: { lt: archiveThreshold },
            },
          },
        },
      ],
    },
    select: { id: true },
    take: 100,
  });

  if (pollsToArchive.length > 0) {
    await prisma.schedulingPoll.updateMany({
      where: { id: { in: pollsToArchive.map((p) => p.id) } },
      data: { isArchived: true },
    });
  }

  const polls = await prisma.schedulingPoll.findMany({
    where: {
      creatorId: auth.data.id,
      isArchived: false,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      title: true,
      organizerName: true,
      confirmedAt: true,
      createdAt: true,
      participantToken: true,
      organizerToken: true,
      _count: { select: { responses: true } },
    },
  });

  return { success: true, data: polls };
  });
}

export async function getConfirmedTimeDetailsAction(pollId: string): Promise<
  ApiResponse<{
    title: string;
    confirmedAt: Date | null;
    location: string | null;
    timezone: string;
    confirmedTimeOption: {
      startTime: Date;
      endTime: Date | null;
    } | null;
  }>
> {
  return runAction('getConfirmedTimeDetailsAction', async () => {
  const poll = await prisma.schedulingPoll.findUnique({
    where: { id: pollId },
    select: {
      title: true,
      confirmedAt: true,
      location: true,
      timezone: true,
      confirmedTimeOption: {
        select: { startTime: true, endTime: true },
      },
    },
  });

  if (!poll) {
    return { success: false, error: 'Poll not found' };
  }

  return {
    success: true,
    data: {
      title: poll.title,
      confirmedAt: poll.confirmedAt,
      location: poll.location,
      timezone: poll.timezone,
      confirmedTimeOption: poll.confirmedTimeOption,
    },
  };
  });
}
