'use server';
import { flattenError } from 'zod';
import { revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  createTrainingOfferSchema,
  createTrainingRequestSchema,
  submitTrainingFeedbackSchema,
  type CreateTrainingOfferInput,
  type CreateTrainingRequestInput,
  type SubmitTrainingFeedbackInput,
} from '@/lib/validations/training';
import {
  CACHE_TAG_TRAINING_OFFERS,
  CACHE_TAG_TRAINING_REQUESTS,
  trainingEngagementTag,
} from '@/lib/cache-tags';
import { isMatchable } from '@/lib/matchmaking/availabilityFilter';
import type { ApiResponse } from '@/types/modalities';
import { getAvailablePublicOfferOwnerWhereInput } from '@/lib/public-member-eligibility';
import { runAction } from '@/lib/server-action-wrapper';

// ─────────────────────────────────────────
// OFFER CRUD
// ─────────────────────────────────────────

export async function createTrainingOfferAction(
  input: CreateTrainingOfferInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createTrainingOfferAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createTrainingOfferSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const offer = await prisma.trainingOffer.create({
    data: { ...parsed.data, creatorId: auth.data.id },
    select: { id: true },
  });

  revalidateTag(CACHE_TAG_TRAINING_OFFERS, 'default');
  return { success: true, data: offer };
  });
}

export async function editTrainingOfferAction(
  id: string,
  input: Partial<CreateTrainingOfferInput>,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('editTrainingOfferAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const offer = await prisma.trainingOffer.findUnique({ where: { id }, select: { creatorId: true } });
  if (!offer || offer.creatorId !== auth.data.id) return { success: false, error: 'Not found' };

  await prisma.trainingOffer.update({ where: { id }, data: input });

  revalidateTag(CACHE_TAG_TRAINING_OFFERS, 'default');
  return { success: true, data: { id } };
  });
}

export async function archiveTrainingOfferAction(id: string): Promise<ApiResponse<void>> {
  return runAction('archiveTrainingOfferAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const offer = await prisma.trainingOffer.findUnique({ where: { id }, select: { creatorId: true } });
  if (!offer || offer.creatorId !== auth.data.id) return { success: false, error: 'Not found' };

  await prisma.trainingOffer.update({ where: { id }, data: { isArchived: true } });

  revalidateTag(CACHE_TAG_TRAINING_OFFERS, 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// REQUEST CRUD
// ─────────────────────────────────────────

export async function createTrainingRequestAction(
  input: CreateTrainingRequestInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createTrainingRequestAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createTrainingRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const request = await prisma.trainingRequest.create({
    data: { ...parsed.data, requesterId: auth.data.id },
    select: { id: true },
  });

  revalidateTag(CACHE_TAG_TRAINING_REQUESTS, 'default');
  return { success: true, data: request };
  });
}

export async function withdrawTrainingRequestAction(id: string): Promise<ApiResponse<void>> {
  return runAction('withdrawTrainingRequestAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const request = await prisma.trainingRequest.findUnique({ where: { id }, select: { requesterId: true } });
  if (!request || request.requesterId !== auth.data.id) return { success: false, error: 'Not found' };

  await prisma.trainingRequest.update({ where: { id }, data: { isWithdrawn: true } });

  revalidateTag(CACHE_TAG_TRAINING_REQUESTS, 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// ENGAGEMENT CRUD
// ─────────────────────────────────────────

export async function createTrainingEngagementAction(
  offerId: string,
  requestId: string,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createTrainingEngagementAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  // Verify the requesting user owns the request
  const request = await prisma.trainingRequest.findUnique({
    where: { id: requestId },
    select: { requesterId: true, isWithdrawn: true },
  });
  if (!request || request.requesterId !== auth.data.id) return { success: false, error: 'Not found' };
  if (request.isWithdrawn) return { success: false, error: 'Request has been withdrawn' };

  // Verify offer is not archived
  const offer = await prisma.trainingOffer.findUnique({
    where: { id: offerId },
    select: { isArchived: true, creator: { select: { functionalProfile: { select: { availabilityMode: true } } } } },
  });
  if (!offer || offer.isArchived) return { success: false, error: 'Offer not found or archived' };

  // Availability gate: never match with RESTING/REFLECTING trainers
  const trainerMode = offer.creator.functionalProfile?.availabilityMode ?? 'DELIVERING';
  if (!isMatchable(trainerMode)) {
    return { success: false, error: 'Trainer is currently not available for new engagements' };
  }

  const engagement = await prisma.trainingEngagement.create({
    data: { offerId, requestId, status: 'PENDING' },
    select: { id: true },
  });

  revalidateTag(trainingEngagementTag(engagement.id), 'default');
  return { success: true, data: engagement };
  });
}

export async function acceptTrainingEngagementAction(id: string): Promise<ApiResponse<void>> {
  return runAction('acceptTrainingEngagementAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

const engagement = await prisma.trainingEngagement.findUnique({
		where: { id },
		select: {
			id: true,
			status: true,
			offer: { select: { creatorId: true } },
		},
	});
  if (!engagement || engagement.offer.creatorId !== auth.data.id) {
    return { success: false, error: 'Not found' };
  }

  await prisma.trainingEngagement.update({ where: { id }, data: { status: 'ACTIVE' } });

  revalidateTag(trainingEngagementTag(id), 'default');
  return { success: true, data: undefined };
  });
}

export async function completeTrainingEngagementAction(id: string): Promise<ApiResponse<void>> {
  return runAction('completeTrainingEngagementAction', async () => {
	const auth = await getCurrentUser();
	if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

	const engagement = await prisma.trainingEngagement.findUnique({
		where: { id },
		select: {
			id: true,
			status: true,
			offer: { select: { creatorId: true } },
			request: { select: { requesterId: true } },
		},
	});
  if (!engagement) return { success: false, error: 'Not found' };

  const isTrainer = engagement.offer.creatorId === auth.data.id;
  const isLearner = engagement.request.requesterId === auth.data.id;
  if (!isTrainer && !isLearner) return { success: false, error: 'Unauthorized' };

  // Status transition + follow-up notifications must be atomic (AUDIT-20260612-010).
  await prisma.$transaction(async (tx) => {
    await tx.trainingEngagement.update({
      where: { id },
      data: { status: 'COMPLETE', completedAt: new Date() },
    });

    // Notify learner to submit feedback
    await tx.notification.create({
      data: {
        userId: engagement.request.requesterId,
        type: 'ENGAGEMENT_COMPLETE_FEEDBACK',
        title: 'Share your reflection',
        message: 'Your training engagement is complete. Please write a reflection.',
        link: `/training/connections`,
      },
    });

    // Forward reciprocity prompt for learner
    await tx.notification.create({
      data: {
        userId: engagement.request.requesterId,
        type: 'FORWARD_RECIPROCITY_PROMPT',
        title: 'What do you now carry that someone else needs?',
        link: '/contribute/offer/new',
      },
    });
  });

  revalidateTag(trainingEngagementTag(id), 'default');
  return { success: true, data: undefined };
  });
}

export async function cancelTrainingEngagementAction(id: string): Promise<ApiResponse<void>> {
  return runAction('cancelTrainingEngagementAction', async () => {
	const auth = await getCurrentUser();
	if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

	const engagement = await prisma.trainingEngagement.findUnique({
		where: { id },
		select: {
			id: true,
			status: true,
			offer: { select: { creatorId: true } },
			request: { select: { requesterId: true } },
		},
	});
  if (!engagement) return { success: false, error: 'Not found' };
  if (
    engagement.offer.creatorId !== auth.data.id &&
    engagement.request.requesterId !== auth.data.id
  ) {
    return { success: false, error: 'Unauthorized' };
  }

  await prisma.trainingEngagement.update({ where: { id }, data: { status: 'CANCELLED' } });

  revalidateTag(trainingEngagementTag(id), 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// FEEDBACK
// ─────────────────────────────────────────

export async function submitTrainingFeedbackAction(
  input: SubmitTrainingFeedbackInput,
): Promise<ApiResponse<void>> {
  return runAction('submitTrainingFeedbackAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = submitTrainingFeedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

const engagement = await prisma.trainingEngagement.findUnique({
		where: { id: parsed.data.engagementId },
		select: {
			id: true,
			status: true,
			request: { select: { requesterId: true } },
			feedback: { select: { id: true } },
		},
	});
  if (!engagement) return { success: false, error: 'Engagement not found' };
  if (engagement.status !== 'COMPLETE') return { success: false, error: 'Engagement not complete' };
  if (engagement.request.requesterId !== auth.data.id) {
    return { success: false, error: 'Only the learner can submit feedback' };
  }
  if (engagement.feedback) return { success: false, error: 'Feedback already submitted' };

  await prisma.trainingFeedback.create({
    data: {
      engagementId: parsed.data.engagementId,
      learnerReflection: parsed.data.learnerReflection,
      trainerObservation: parsed.data.trainerObservation,
    },
  });

  revalidateTag(trainingEngagementTag(parsed.data.engagementId), 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────

export async function getTrainingOffersAction(filters?: {
  domain?: string;
  format?: string;
  level?: string;
}) {
return prisma.trainingOffer.findMany({
		where: {
			isArchived: false,
			...(filters?.domain ? { domain: { contains: filters.domain, mode: 'insensitive' } } : {}),
			...(filters?.format ? { format: filters.format as never } : {}),
			...(filters?.level ? { level: filters.level as never } : {}),
			creator: getAvailablePublicOfferOwnerWhereInput(),
		},
select: {
id: true,
domain: true,
format: true,
level: true,
deliveryMode: true,
city: true,
timeCommitment: true,
capacity: true,
description: true,
isArchived: true,
createdAt: true,
creator: {
select: {
id: true,
name: true,
displayName: true,
profilePhoto: true,
archetypes: true,
functionalProfile: { select: { availabilityMode: true } },
},
},
_count: { select: { engagements: true } },
},
orderBy: { createdAt: 'desc' },
take: 50,
});
}

export async function getMyTrainingConnectionsAction() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return [];

  const currentUserId = auth.data.id;
  const engagements = await prisma.trainingEngagement.findMany({
  where: {
    OR: [
      { offer: { creatorId: auth.data.id } },
      { request: { requesterId: auth.data.id } },
    ],
  },
  take: 50,
  select: {
id: true,
status: true,
completedAt: true,
createdAt: true,
updatedAt: true,
offer: {
select: {
id: true,
domain: true,
format: true,
creator: { select: { id: true, name: true, profilePhoto: true } }
}
},
request: {
select: {
id: true,
domain: true,
skillGapDescription: true,
requester: { select: { id: true, name: true, profilePhoto: true } }
}
},
feedback: { select: { id: true, learnerReflection: true, trainerObservation: true } },
},
orderBy: { updatedAt: 'desc' },
});

  return engagements.map((e) => ({ ...e, currentUserId }));
}

export async function getTrainingOfferByIdAction(id: string) {
	return prisma.trainingOffer.findFirst({
		where: { id, isArchived: false, creator: getAvailablePublicOfferOwnerWhereInput() },
select: {
id: true,
domain: true,
format: true,
level: true,
deliveryMode: true,
city: true,
cityLat: true,
cityLng: true,
timeCommitment: true,
capacity: true,
description: true,
professionalUrl: true,
isSync: true,
isGroupFormat: true,
isArchived: true,
createdAt: true,
creator: {
select: {
id: true,
name: true,
displayName: true,
profilePhoto: true,
archetypes: true,
functionalProfile: { select: { availabilityMode: true } },
},
},
_count: { select: { engagements: true } },
},
});
}

export async function getMyTrainingOffersAction() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return [];

  return prisma.trainingOffer.findMany({
  where: { creatorId: auth.data.id },
  take: 50,
  select: {
id: true,
domain: true,
format: true,
level: true,
deliveryMode: true,
city: true,
timeCommitment: true,
capacity: true,
description: true,
isArchived: true,
createdAt: true,
},
orderBy: { createdAt: 'desc' },
});
}

export async function getMyTrainingRequestsAction() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return [];

  return prisma.trainingRequest.findMany({
    where: { requesterId: auth.data.id, isWithdrawn: false },
    select: {
      id: true,
      domain: true,
      skillGapDescription: true,
      formatPreference: true,
      levelPreference: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
