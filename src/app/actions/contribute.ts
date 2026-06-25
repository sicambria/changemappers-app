'use server';
import { flattenError } from 'zod';
import { revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  createContributionOfferSchema,
  createContributionRequestSchema,
  submitContributionFeedbackSchema,
  type CreateContributionOfferInput,
  type CreateContributionRequestInput,
  type SubmitContributionFeedbackInput,
} from '@/lib/validations/contribute';
import {
  CACHE_TAG_CONTRIBUTION_OFFERS,
  CACHE_TAG_CONTRIBUTION_REQUESTS,
  contributionConnectionTag,
} from '@/lib/cache-tags';
import { isMatchable } from '@/lib/matchmaking/availabilityFilter';
import type { ApiResponse } from '@/types/modalities';
import { getAvailablePublicOfferOwnerWhereInput } from '@/lib/public-member-eligibility';
import { runAction } from '@/lib/server-action-wrapper';

// ─────────────────────────────────────────
// OFFER CRUD
// ─────────────────────────────────────────

export async function createContributionOfferAction(
  input: CreateContributionOfferInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createContributionOfferAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createContributionOfferSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const offer = await prisma.contributionOffer.create({
    data: { ...parsed.data, offererId: auth.data.id },
    select: { id: true },
  });

  revalidateTag(CACHE_TAG_CONTRIBUTION_OFFERS, 'default');
  return { success: true, data: offer };
  });
}

export async function editContributionOfferAction(
  id: string,
  input: Partial<CreateContributionOfferInput>,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('editContributionOfferAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const offer = await prisma.contributionOffer.findUnique({
    where: { id },
    select: { offererId: true },
  });
  if (!offer || offer.offererId !== auth.data.id) return { success: false, error: 'Not found' };

  await prisma.contributionOffer.update({ where: { id }, data: input });

  revalidateTag(CACHE_TAG_CONTRIBUTION_OFFERS, 'default');
  return { success: true, data: { id } };
  });
}

export async function archiveContributionOfferAction(id: string): Promise<ApiResponse<void>> {
  return runAction('archiveContributionOfferAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const offer = await prisma.contributionOffer.findUnique({
    where: { id },
    select: { offererId: true },
  });
  if (!offer || offer.offererId !== auth.data.id) return { success: false, error: 'Not found' };

  await prisma.contributionOffer.update({ where: { id }, data: { isArchived: true } });

  revalidateTag(CACHE_TAG_CONTRIBUTION_OFFERS, 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// REQUEST CRUD
// ─────────────────────────────────────────

export async function createContributionRequestAction(
  input: CreateContributionRequestInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createContributionRequestAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createContributionRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const request = await prisma.contributionRequest.create({
    data: { ...parsed.data, requesterId: auth.data.id },
    select: { id: true },
  });

  revalidateTag(CACHE_TAG_CONTRIBUTION_REQUESTS, 'default');
  return { success: true, data: request };
  });
}

export async function withdrawContributionRequestAction(id: string): Promise<ApiResponse<void>> {
  return runAction('withdrawContributionRequestAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const request = await prisma.contributionRequest.findUnique({
    where: { id },
    select: { requesterId: true },
  });
  if (!request || request.requesterId !== auth.data.id) return { success: false, error: 'Not found' };

  await prisma.contributionRequest.update({ where: { id }, data: { isWithdrawn: true } });

  revalidateTag(CACHE_TAG_CONTRIBUTION_REQUESTS, 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// CONNECTION CRUD
// ─────────────────────────────────────────

export async function createContributionConnectionAction(
  offerId: string,
  requestId: string,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createContributionConnectionAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  // Verify the request belongs to the authenticated user
  const request = await prisma.contributionRequest.findUnique({
    where: { id: requestId },
    select: { requesterId: true, isWithdrawn: true },
  });
  if (!request || request.requesterId !== auth.data.id) return { success: false, error: 'Not found' };
  if (request.isWithdrawn) return { success: false, error: 'Request has been withdrawn' };

  // Verify offer is not archived and offerer is available
  const offer = await prisma.contributionOffer.findUnique({
    where: { id: offerId },
    select: {
      offererId: true,
      isArchived: true,
      offerer: { select: { functionalProfile: { select: { availabilityMode: true } } } },
    },
  });
  if (!offer || offer.isArchived) return { success: false, error: 'Offer not found or archived' };

  // Availability gate
  const offererMode = offer.offerer.functionalProfile?.availabilityMode ?? 'DELIVERING';
  if (!isMatchable(offererMode)) {
    return { success: false, error: 'Contributor is currently not available for new connections' };
  }

  // Connection create + offerer notification must be atomic (AUDIT-20260612-010).
  const connection = await prisma.$transaction(async (tx) => {
    const created = await tx.contributionConnection.create({
      data: { offerId, requestId, status: 'PENDING' },
      select: { id: true },
    });

    // Notify the offerer
    await tx.notification.create({
      data: {
        userId: offer.offererId,
        type: 'CONTRIBUTION_MATCH',
        title: 'Someone wants your contribution',
        message: 'A new connection request has been made for your contribution offer.',
        link: '/contribute/connections',
      },
    });

    return created;
  });

  revalidateTag(contributionConnectionTag(connection.id), 'default');
  return { success: true, data: connection };
  });
}

export async function acceptContributionConnectionAction(id: string): Promise<ApiResponse<void>> {
  return runAction('acceptContributionConnectionAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

const connection = await prisma.contributionConnection.findUnique({
		where: { id },
		select: {
			id: true,
			status: true,
			offer: { select: { offererId: true } },
		},
	});
  if (!connection || connection.offer.offererId !== auth.data.id) {
    return { success: false, error: 'Not found' };
  }

  await prisma.contributionConnection.update({ where: { id }, data: { status: 'ACTIVE' } });

  revalidateTag(contributionConnectionTag(id), 'default');
  return { success: true, data: undefined };
  });
}

/**
 * Completion requires feedback to be submitted first — action fails without it.
 * This is structural enforcement, not optional.
 */
export async function completeContributionConnectionAction(
  id: string,
): Promise<ApiResponse<void>> {
  return runAction('completeContributionConnectionAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

const connection = await prisma.contributionConnection.findUnique({
		where: { id },
		select: {
			id: true,
			status: true,
			offer: { select: { offererId: true } },
			request: { select: { requesterId: true } },
			feedback: { select: { id: true } },
		},
	});
  if (!connection) return { success: false, error: 'Not found' };

  const isOfferer = connection.offer.offererId === auth.data.id;
  const isRequester = connection.request.requesterId === auth.data.id;
  if (!isOfferer && !isRequester) return { success: false, error: 'Unauthorized' };

  // Structural gate: feedback must exist before completing
  if (!connection.feedback) {
    return {
      success: false,
      error: 'A public reflection is required before marking this connection complete',
    };
  }

  // Status transition + reciprocity notification must be atomic (AUDIT-20260612-010).
  await prisma.$transaction(async (tx) => {
    await tx.contributionConnection.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    // Forward reciprocity prompt for requester
    await tx.notification.create({
      data: {
        userId: connection.request.requesterId,
        type: 'FORWARD_RECIPROCITY_PROMPT',
        title: 'What do you now carry that someone else needs?',
        link: '/contribute/offer/new',
      },
    });
  });

  revalidateTag(contributionConnectionTag(id), 'default');
  return { success: true, data: undefined };
  });
}

export async function cancelContributionConnectionAction(id: string): Promise<ApiResponse<void>> {
  return runAction('cancelContributionConnectionAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

const connection = await prisma.contributionConnection.findUnique({
		where: { id },
		select: {
			id: true,
			status: true,
			offer: { select: { offererId: true } },
			request: { select: { requesterId: true } },
		},
	});
	if (!connection) return { success: false, error: 'Not found' };

	if (
		connection.offer.offererId !== auth.data.id &&
		connection.request.requesterId !== auth.data.id
	) {
    return { success: false, error: 'Unauthorized' };
  }

  await prisma.contributionConnection.update({ where: { id }, data: { status: 'CANCELLED' } });

  revalidateTag(contributionConnectionTag(id), 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// FEEDBACK
// ─────────────────────────────────────────

export async function submitContributionFeedbackAction(
  input: SubmitContributionFeedbackInput,
): Promise<ApiResponse<void>> {
  return runAction('submitContributionFeedbackAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = submitContributionFeedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

const connection = await prisma.contributionConnection.findUnique({
		where: { id: parsed.data.connectionId },
		select: {
			id: true,
			status: true,
			request: { select: { requesterId: true } },
			feedback: { select: { id: true } },
		},
	});
  if (!connection) return { success: false, error: 'Connection not found' };

  // Only the requester can submit the public reflection
  if (connection.request.requesterId !== auth.data.id) {
    return { success: false, error: 'Only the person who requested can submit feedback' };
  }

  if (connection.feedback) return { success: false, error: 'Feedback already submitted' };

  await prisma.contributionFeedback.create({
    data: {
      connectionId: parsed.data.connectionId,
      publicReflection: parsed.data.publicReflection,
    },
  });

  revalidateTag(contributionConnectionTag(parsed.data.connectionId), 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────

export async function getContributionOffersAction(filters?: {
  type?: string;
  domain?: string;
}) {
return prisma.contributionOffer.findMany({
		where: {
			isArchived: false,
			...(filters?.type ? { type: filters.type as never } : {}),
			...(filters?.domain ? { domain: { contains: filters.domain, mode: 'insensitive' } } : {}),
			offerer: getAvailablePublicOfferOwnerWhereInput(),
		},
select: {
id: true,
type: true,
domain: true,
timeCommitment: true,
format: true,
availability: true,
prerequisites: true,
isArchived: true,
createdAt: true,
offerer: {
select: {
id: true,
name: true,
displayName: true,
profilePhoto: true,
archetypes: true,
functionalProfile: { select: { availabilityMode: true } },
},
},
_count: { select: { connections: true } },
},
orderBy: { createdAt: 'desc' },
take: 50,
});
}

export async function getMyContributionConnectionsAction() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return [];

  const connections = await prisma.contributionConnection.findMany({
  where: {
    OR: [
      { offer: { offererId: auth.data.id } },
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
type: true,
domain: true,
offerer: { select: { id: true, name: true, profilePhoto: true } }
}
},
request: {
select: {
id: true,
type: true,
whatNeeded: true,
requester: { select: { id: true, name: true, profilePhoto: true } }
}
},
feedback: { select: { id: true, publicReflection: true } },
},
orderBy: { updatedAt: 'desc' },
});

return connections.map((connection) => ({
...connection,
currentUserId: auth.data.id,
}));
}

export async function getContributionOfferByIdAction(id: string) {
	return prisma.contributionOffer.findFirst({
		where: { id, isArchived: false, offerer: getAvailablePublicOfferOwnerWhereInput() },
select: {
id: true,
type: true,
domain: true,
timeCommitment: true,
format: true,
availability: true,
prerequisites: true,
isArchived: true,
createdAt: true,
offerer: {
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

export async function getMyContributionOffersAction() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return [];

  return prisma.contributionOffer.findMany({
  where: { offererId: auth.data.id },
  take: 50,
  select: {
id: true,
type: true,
domain: true,
timeCommitment: true,
format: true,
availability: true,
prerequisites: true,
isArchived: true,
createdAt: true,
},
orderBy: { createdAt: 'desc' },
});
}

export async function getMyContributionRequestsAction() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return [];

  return prisma.contributionRequest.findMany({
    where: { requesterId: auth.data.id, isWithdrawn: false },
    select: {
      id: true,
      type: true,
      whatNeeded: true,
      alreadyTried: true,
      willDoWith: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
