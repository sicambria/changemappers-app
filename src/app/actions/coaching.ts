'use server';
import { flattenError } from 'zod';
import { revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  createCoachingOfferSchema,
  createCoachingRequestSchema,
  acceptCoachingRequestSchema,
  submitCoachingFeedbackSchema,
  type CreateCoachingOfferInput,
  type CreateCoachingRequestInput,
  type AcceptCoachingRequestInput,
  type SubmitCoachingFeedbackInput,
} from '@/lib/validations/coaching';
import {
  CACHE_TAG_COACHING_OFFERS,
  CACHE_TAG_COACHING_REQUESTS,
  coachingEngagementTag,
} from '@/lib/cache-tags';
import { isMatchable } from '@/lib/matchmaking/availabilityFilter';
import type { ApiResponse } from '@/types/modalities';
import { getAvailablePublicOfferOwnerWhereInput } from '@/lib/public-member-eligibility';
import { runAction } from '@/lib/server-action-wrapper';

// ─────────────────────────────────────────
// OFFER CRUD
// ─────────────────────────────────────────

export async function createCoachingOfferAction(
  input: CreateCoachingOfferInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createCoachingOfferAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createCoachingOfferSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const offer = await prisma.coachingOffer.create({
    data: { ...parsed.data, coachId: auth.data.id },
    select: { id: true },
  });

  revalidateTag(CACHE_TAG_COACHING_OFFERS, 'default');
  return { success: true, data: offer };
  });
}

export async function editCoachingOfferAction(
  id: string,
  input: Partial<CreateCoachingOfferInput>,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('editCoachingOfferAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const offer = await prisma.coachingOffer.findUnique({ where: { id }, select: { coachId: true } });
  if (!offer || offer.coachId !== auth.data.id) return { success: false, error: 'Not found' };

  await prisma.coachingOffer.update({ where: { id }, data: input });

  revalidateTag(CACHE_TAG_COACHING_OFFERS, 'default');
  return { success: true, data: { id } };
  });
}

export async function archiveCoachingOfferAction(id: string): Promise<ApiResponse<void>> {
  return runAction('archiveCoachingOfferAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const offer = await prisma.coachingOffer.findUnique({ where: { id }, select: { coachId: true } });
  if (!offer || offer.coachId !== auth.data.id) return { success: false, error: 'Not found' };

  await prisma.coachingOffer.update({ where: { id }, data: { isArchived: true } });

  revalidateTag(CACHE_TAG_COACHING_OFFERS, 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// REQUEST CRUD
// ─────────────────────────────────────────

export async function createCoachingRequestAction(
  input: CreateCoachingRequestInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createCoachingRequestAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createCoachingRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const request = await prisma.coachingRequest.create({
    data: { ...parsed.data, requesterId: auth.data.id },
    select: { id: true },
  });

  revalidateTag(CACHE_TAG_COACHING_REQUESTS, 'default');
  return { success: true, data: request };
  });
}

export async function withdrawCoachingRequestAction(id: string): Promise<ApiResponse<void>> {
  return runAction('withdrawCoachingRequestAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const request = await prisma.coachingRequest.findUnique({
    where: { id },
    select: { requesterId: true },
  });
  if (!request || request.requesterId !== auth.data.id) return { success: false, error: 'Not found' };

  await prisma.coachingRequest.update({ where: { id }, data: { isWithdrawn: true } });

  revalidateTag(CACHE_TAG_COACHING_REQUESTS, 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// ENGAGEMENT CRUD
// ─────────────────────────────────────────

export async function acceptCoachingRequestAction(
  input: AcceptCoachingRequestInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('acceptCoachingRequestAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = acceptCoachingRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  // Verify the coach owns this offer
  const offer = await prisma.coachingOffer.findUnique({
    where: { id: parsed.data.offerId },
    select: {
      coachId: true,
      isArchived: true,
      coach: { select: { functionalProfile: { select: { availabilityMode: true } } } },
    },
  });
  if (!offer || offer.coachId !== auth.data.id) return { success: false, error: 'Offer not found' };
  if (offer.isArchived) return { success: false, error: 'Offer is archived' };

  // Availability gate
  const coachMode = offer.coach.functionalProfile?.availabilityMode ?? 'DELIVERING';
  if (!isMatchable(coachMode)) {
    return { success: false, error: 'You are currently not available for new coaching engagements' };
  }

  // Verify the request exists and is not withdrawn
  const request = await prisma.coachingRequest.findUnique({
    where: { id: parsed.data.requestId },
    select: { requesterId: true, isWithdrawn: true },
  });
  if (!request) return { success: false, error: 'Request not found' };
  if (request.isWithdrawn) return { success: false, error: 'Request has been withdrawn' };

  // Engagement create + coachee notification must be atomic (AUDIT-20260612-010):
  // a partial write would create an engagement the coachee is never told about.
  const engagement = await prisma.$transaction(async (tx) => {
    const created = await tx.coachingEngagement.create({
      data: {
        offerId: parsed.data.offerId,
        requestId: parsed.data.requestId,
        style: parsed.data.style,
        format: parsed.data.format,
        arcLength: parsed.data.arcLength,
        checkInRhythm: parsed.data.checkInRhythm ?? null,
        status: 'PENDING',
      },
      select: { id: true },
    });

    // Notify the coachee
    await tx.notification.create({
      data: {
        userId: request.requesterId,
        type: 'COACHING_REQUEST',
        title: 'Your coaching request was accepted',
        message: 'A coach has accepted your request. Check your connections.',
        link: '/coach/connections',
      },
    });

    return created;
  });

  revalidateTag(coachingEngagementTag(engagement.id), 'default');
  return { success: true, data: engagement };
  });
}

export async function activateCoachingEngagementAction(id: string): Promise<ApiResponse<void>> {
  return runAction('activateCoachingEngagementAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

const engagement = await prisma.coachingEngagement.findUnique({
		where: { id },
		select: {
			id: true,
			status: true,
			offer: { select: { coachId: true } },
		},
	});
  if (!engagement || engagement.offer.coachId !== auth.data.id) {
    return { success: false, error: 'Not found' };
  }

  await prisma.coachingEngagement.update({ where: { id }, data: { status: 'ACTIVE' } });

  revalidateTag(coachingEngagementTag(id), 'default');
  return { success: true, data: undefined };
  });
}

export async function completeCoachingEngagementAction(id: string): Promise<ApiResponse<void>> {
  return runAction('completeCoachingEngagementAction', async () => {
	const auth = await getCurrentUser();
	if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

	const engagement = await prisma.coachingEngagement.findUnique({
		where: { id },
		select: {
			id: true,
			status: true,
			offer: { select: { coachId: true } },
			request: { select: { requesterId: true } },
		},
	});
  if (!engagement) return { success: false, error: 'Not found' };

  const isCoach = engagement.offer.coachId === auth.data.id;
  const isCoachee = engagement.request.requesterId === auth.data.id;
  if (!isCoach && !isCoachee) return { success: false, error: 'Unauthorized' };

  // Engagement completion + both notifications must be atomic (AUDIT-20260613-030),
  // mirroring the accept path wrapped by AUDIT-20260612-010.
  await prisma.$transaction(async (tx) => {
    await tx.coachingEngagement.update({
      where: { id },
      data: { status: 'COMPLETE', completedAt: new Date() },
    });

    // Notify coachee to submit reflection
    await tx.notification.create({
      data: {
        userId: engagement.request.requesterId,
        type: 'ENGAGEMENT_COMPLETE_FEEDBACK',
        title: 'Reflect on your coaching arc',
        message: 'Your coaching engagement is complete. Please write a reflection.',
        link: '/coach/connections',
      },
    });

    // Forward reciprocity prompt for coachee
    await tx.notification.create({
      data: {
        userId: engagement.request.requesterId,
        type: 'FORWARD_RECIPROCITY_PROMPT',
        title: 'What do you now carry that someone else needs?',
        link: '/contribute/offer/new',
      },
    });
  });

  revalidateTag(coachingEngagementTag(id), 'default');
  return { success: true, data: undefined };
  });
}

export async function cancelCoachingEngagementAction(id: string): Promise<ApiResponse<void>> {
  return runAction('cancelCoachingEngagementAction', async () => {
	const auth = await getCurrentUser();
	if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

	const engagement = await prisma.coachingEngagement.findUnique({
		where: { id },
		select: {
			id: true,
			status: true,
			offer: { select: { coachId: true } },
			request: { select: { requesterId: true } },
		},
	});
  if (!engagement) return { success: false, error: 'Not found' };

  if (
    engagement.offer.coachId !== auth.data.id &&
    engagement.request.requesterId !== auth.data.id
  ) {
    return { success: false, error: 'Unauthorized' };
  }

  await prisma.coachingEngagement.update({ where: { id }, data: { status: 'CANCELLED' } });

  revalidateTag(coachingEngagementTag(id), 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// FEEDBACK
// ─────────────────────────────────────────

export async function submitCoachingFeedbackAction(
  input: SubmitCoachingFeedbackInput,
): Promise<ApiResponse<void>> {
  return runAction('submitCoachingFeedbackAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = submitCoachingFeedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

const engagement = await prisma.coachingEngagement.findUnique({
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
    return { success: false, error: 'Only the coachee can submit feedback' };
  }
  if (engagement.feedback) return { success: false, error: 'Feedback already submitted' };

  await prisma.coachingFeedback.create({
    data: {
      engagementId: parsed.data.engagementId,
      coacheeReflection: parsed.data.coacheeReflection,
      coachObservation: parsed.data.coachObservation ?? null,
    },
  });

  revalidateTag(coachingEngagementTag(parsed.data.engagementId), 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────

export async function getCoachingOffersAction(filters?: {
  style?: string;
  format?: string;
}) {
return prisma.coachingOffer.findMany({
		where: {
			isArchived: false,
			...(filters?.style ? { style: { contains: filters.style, mode: 'insensitive' } } : {}),
			...(filters?.format ? { format: { contains: filters.format, mode: 'insensitive' } } : {}),
			coach: getAvailablePublicOfferOwnerWhereInput(),
		},
select: {
id: true,
style: true,
format: true,
arcLengthOption: true,
availability: true,
coacheeKnow: true,
isArchived: true,
createdAt: true,
coach: {
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

export async function getMyCoachingConnectionsAction() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return [];

  const currentUserId = auth.data.id;
  const engagements = await prisma.coachingEngagement.findMany({
  where: {
    OR: [
      { offer: { coachId: auth.data.id } },
      { request: { requesterId: auth.data.id } },
    ],
  },
  take: 50,
  select: {
id: true,
status: true,
style: true,
format: true,
arcLength: true,
checkInRhythm: true,
completedAt: true,
createdAt: true,
updatedAt: true,
offer: {
select: {
id: true,
style: true,
coach: { select: { id: true, name: true, profilePhoto: true } }
}
},
request: {
select: {
id: true,
stuckOn: true,
requester: { select: { id: true, name: true, profilePhoto: true } }
}
},
feedback: { select: { id: true, coacheeReflection: true, coachObservation: true } },
},
orderBy: { updatedAt: 'desc' },
});

  return engagements.map((e) => ({ ...e, currentUserId }));
}

export async function getCoachingOfferByIdAction(id: string) {
	return prisma.coachingOffer.findFirst({
		where: { id, isArchived: false, coach: getAvailablePublicOfferOwnerWhereInput() },
select: {
id: true,
style: true,
format: true,
arcLengthOption: true,
availability: true,
coacheeKnow: true,
isArchived: true,
createdAt: true,
coach: {
select: {
id: true,
name: true,
displayName: true,
profilePhoto: true,
archetypes: true,
functionalProfile: { select: { availabilityMode: true } },
},
},
},
});
}

export async function getCoachingRequestByIdAction(id: string) {
	return prisma.coachingRequest.findUnique({
		where: { id },
select: {
id: true,
stuckOn: true,
shiftsWanted: true,
formatPreference: true,
isWithdrawn: true,
createdAt: true,
requester: {
select: {
id: true,
name: true,
displayName: true,
profilePhoto: true,
archetypes: true,
},
},
},
});
}

export async function getMyCoachingOffersAction() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return [];

  return prisma.coachingOffer.findMany({
  where: { coachId: auth.data.id },
  take: 50,
  select: {
    id: true,
    style: true,
    format: true,
    arcLengthOption: true,
    availability: true,
    coacheeKnow: true,
    isArchived: true,
    createdAt: true,
  },
  orderBy: { createdAt: 'desc' },
});
}

export async function getMyCoachingRequestsAction() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return [];

  return prisma.coachingRequest.findMany({
    where: { requesterId: auth.data.id, isWithdrawn: false },
    select: {
      id: true,
      stuckOn: true,
      shiftsWanted: true,
      formatPreference: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getOpenCoachingRequestsAction() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return [];

  return prisma.coachingRequest.findMany({
    where: {
      isWithdrawn: false,
      engagements: { none: {} },
    },
    select: {
      id: true,
      stuckOn: true,
      shiftsWanted: true,
      formatPreference: true,
      createdAt: true,
      requester: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
