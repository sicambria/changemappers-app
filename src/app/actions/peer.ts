'use server';
import { flattenError } from 'zod';
import { revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  createPeerSupportOfferSchema,
  createPeerSupportRequestSchema,
  submitPeerSupportFeedbackSchema,
  type CreatePeerSupportOfferInput,
  type CreatePeerSupportRequestInput,
  type SubmitPeerSupportFeedbackInput,
} from '@/lib/validations/peer';
import {
  CACHE_TAG_PEER_OFFERS,
  CACHE_TAG_PEER_REQUESTS,
  peerConnectionTag,
} from '@/lib/cache-tags';
import { isMatchable } from '@/lib/matchmaking/availabilityFilter';
import type { ApiResponse } from '@/types/modalities';
import { getAvailablePublicOfferOwnerWhereInput } from '@/lib/public-member-eligibility';
import { runAction } from '@/lib/server-action-wrapper';

// ─────────────────────────────────────────
// OFFER CRUD
// ─────────────────────────────────────────

export async function createPeerSupportOfferAction(
  input: CreatePeerSupportOfferInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createPeerSupportOfferAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createPeerSupportOfferSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const offer = await prisma.peerSupportOffer.create({
    data: { ...parsed.data, offererId: auth.data.id },
    select: { id: true },
  });

  revalidateTag(CACHE_TAG_PEER_OFFERS, 'default');
  return { success: true, data: offer };
  });
}

export async function editPeerSupportOfferAction(
  id: string,
  input: Partial<CreatePeerSupportOfferInput>,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('editPeerSupportOfferAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const offer = await prisma.peerSupportOffer.findUnique({ where: { id }, select: { offererId: true } });
  if (!offer || offer.offererId !== auth.data.id) return { success: false, error: 'Not found' };

  await prisma.peerSupportOffer.update({ where: { id }, data: input });

  revalidateTag(CACHE_TAG_PEER_OFFERS, 'default');
  return { success: true, data: { id } };
  });
}

export async function pausePeerSupportOfferAction(id: string): Promise<ApiResponse<void>> {
  return runAction('pausePeerSupportOfferAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const offer = await prisma.peerSupportOffer.findUnique({ where: { id }, select: { offererId: true } });
  if (!offer || offer.offererId !== auth.data.id) return { success: false, error: 'Not found' };

  await prisma.peerSupportOffer.update({ where: { id }, data: { isPaused: true } });

  revalidateTag(CACHE_TAG_PEER_OFFERS, 'default');
  return { success: true, data: undefined };
  });
}

export async function resumePeerSupportOfferAction(id: string): Promise<ApiResponse<void>> {
  return runAction('resumePeerSupportOfferAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const offer = await prisma.peerSupportOffer.findUnique({ where: { id }, select: { offererId: true } });
  if (!offer || offer.offererId !== auth.data.id) return { success: false, error: 'Not found' };

  await prisma.peerSupportOffer.update({ where: { id }, data: { isPaused: false } });

  revalidateTag(CACHE_TAG_PEER_OFFERS, 'default');
  return { success: true, data: undefined };
  });
}

export async function archivePeerSupportOfferAction(id: string): Promise<ApiResponse<void>> {
  return runAction('archivePeerSupportOfferAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const offer = await prisma.peerSupportOffer.findUnique({ where: { id }, select: { offererId: true } });
  if (!offer || offer.offererId !== auth.data.id) return { success: false, error: 'Not found' };

  await prisma.peerSupportOffer.update({ where: { id }, data: { isArchived: true } });

  revalidateTag(CACHE_TAG_PEER_OFFERS, 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// REQUEST CRUD
// ─────────────────────────────────────────

export async function createPeerSupportRequestAction(
  input: CreatePeerSupportRequestInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createPeerSupportRequestAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createPeerSupportRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const request = await prisma.peerSupportRequest.create({
    data: { ...parsed.data, requesterId: auth.data.id },
    select: { id: true },
  });

  revalidateTag(CACHE_TAG_PEER_REQUESTS, 'default');
  return { success: true, data: request };
  });
}

export async function withdrawPeerSupportRequestAction(id: string): Promise<ApiResponse<void>> {
  return runAction('withdrawPeerSupportRequestAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const request = await prisma.peerSupportRequest.findUnique({
    where: { id },
    select: { requesterId: true },
  });
  if (!request || request.requesterId !== auth.data.id) return { success: false, error: 'Not found' };

  await prisma.peerSupportRequest.update({ where: { id }, data: { isWithdrawn: true } });

  revalidateTag(CACHE_TAG_PEER_REQUESTS, 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// CONNECTION CRUD
// ─────────────────────────────────────────

export async function createPeerSupportConnectionAction(
  offerId: string,
  requestId: string,
  format: string,
  arcLength?: string,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createPeerSupportConnectionAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  // Verify the request belongs to the authenticated user
  const request = await prisma.peerSupportRequest.findUnique({
    where: { id: requestId },
    select: { requesterId: true, isWithdrawn: true },
  });
  if (!request || request.requesterId !== auth.data.id) return { success: false, error: 'Not found' };
  if (request.isWithdrawn) return { success: false, error: 'Request has been withdrawn' };

  // Verify offer is not paused or archived
  const offer = await prisma.peerSupportOffer.findUnique({
    where: { id: offerId },
    select: {
      isPaused: true,
      isArchived: true,
      offerer: { select: { functionalProfile: { select: { availabilityMode: true } } } },
    },
  });
  if (!offer || offer.isArchived) return { success: false, error: 'Offer not found or archived' };
  if (offer.isPaused) return { success: false, error: 'Offer is currently paused' };

  // Availability gate
  const offererMode = offer.offerer.functionalProfile?.availabilityMode ?? 'DELIVERING';
  if (!isMatchable(offererMode)) {
    return { success: false, error: 'Supporter is currently not available for new connections' };
  }

  const connection = await prisma.peerSupportConnection.create({
    data: {
      offerId,
      requestId,
      format,
      arcLength: arcLength ?? null,
      status: 'PENDING',
    },
    select: { id: true },
  });

  revalidateTag(peerConnectionTag(connection.id), 'default');
  return { success: true, data: connection };
  });
}

export async function acceptPeerSupportConnectionAction(id: string): Promise<ApiResponse<void>> {
  return runAction('acceptPeerSupportConnectionAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

const connection = await prisma.peerSupportConnection.findUnique({
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

  await prisma.peerSupportConnection.update({ where: { id }, data: { status: 'ACTIVE' } });

  revalidateTag(peerConnectionTag(id), 'default');
  return { success: true, data: undefined };
  });
}

export async function closePeerSupportConnectionAction(id: string): Promise<ApiResponse<void>> {
  return runAction('closePeerSupportConnectionAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

const connection = await prisma.peerSupportConnection.findUnique({
		where: { id },
		select: {
			id: true,
			status: true,
			offer: { select: { offererId: true } },
			request: { select: { requesterId: true } },
		},
	});
	if (!connection) return { success: false, error: 'Not found' };

	const isSupporter = connection.offer.offererId === auth.data.id;
  const isSupported = connection.request.requesterId === auth.data.id;
  if (!isSupporter && !isSupported) return { success: false, error: 'Unauthorized' };

  // Status transition + follow-up notifications must be atomic (AUDIT-20260612-010):
  // without the transaction a notification failure leaves the connection closed
  // but returns an error, and the retry (no status guard) re-fires notifications.
  await prisma.$transaction(async (tx) => {
    await tx.peerSupportConnection.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
    });

    // Prompt supported person (NOT the supporter) to submit feedback
    await tx.notification.create({
      data: {
        userId: connection.request.requesterId,
        type: 'ENGAGEMENT_COMPLETE_FEEDBACK',
        title: 'Share a brief reflection',
        message: 'Your peer support connection has closed. A short reflection is welcome.',
        link: '/peer/connections',
      },
    });

    // Forward reciprocity prompt for supported person
    await tx.notification.create({
      data: {
        userId: connection.request.requesterId,
        type: 'FORWARD_RECIPROCITY_PROMPT',
        title: 'What do you now carry that someone else needs?',
        link: '/contribute/offer/new',
      },
    });
  });

  revalidateTag(peerConnectionTag(id), 'default');
  return { success: true, data: undefined };
  });
}

export async function cancelPeerSupportConnectionAction(id: string): Promise<ApiResponse<void>> {
  return runAction('cancelPeerSupportConnectionAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

const connection = await prisma.peerSupportConnection.findUnique({
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

  await prisma.peerSupportConnection.update({ where: { id }, data: { status: 'CLOSED' } });

  revalidateTag(peerConnectionTag(id), 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// FEEDBACK
// Critical: only the person-supported (requesterId) can submit feedback.
// Feedback from the supporter about the supported is STRUCTURALLY REJECTED.
// ─────────────────────────────────────────

export async function submitPeerSupportFeedbackAction(
  input: SubmitPeerSupportFeedbackInput,
): Promise<ApiResponse<void>> {
  return runAction('submitPeerSupportFeedbackAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = submitPeerSupportFeedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

const connection = await prisma.peerSupportConnection.findUnique({
		where: { id: parsed.data.connectionId },
		select: {
			id: true,
			status: true,
			offer: { select: { offererId: true } },
			request: { select: { requesterId: true } },
			feedbacks: { select: { id: true } },
		},
	});
  if (!connection) return { success: false, error: 'Connection not found' };

  // CRITICAL STRUCTURAL GUARD: reject if the caller is the supporter
  if (connection.offer.offererId === auth.data.id) {
    return {
      success: false,
      error: 'Supporters cannot submit feedback about the people they support',
    };
  }

  // Only the person-supported can submit
  if (connection.request.requesterId !== auth.data.id) {
    return { success: false, error: 'Only the person supported can submit feedback' };
  }

  if (connection.feedbacks.length > 0) {
    return { success: false, error: 'Feedback already submitted for this connection' };
  }

  await prisma.peerSupportFeedback.create({
    data: {
      connectionId: parsed.data.connectionId,
      authorId: auth.data.id,
      feltMet: parsed.data.feltMet ?? null,
      feltSafe: parsed.data.feltSafe ?? null,
      publicNote: parsed.data.publicNote ?? null,
      isPrivate: true, // always private — no public ratings in peer support
    },
  });

  revalidateTag(peerConnectionTag(parsed.data.connectionId), 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────

export async function getPeerSupportOffersAction(_filters?: {
  situationType?: string;
}) {
return prisma.peerSupportOffer.findMany({
		where: {
			isArchived: false,
			isPaused: false,
			offerer: getAvailablePublicOfferOwnerWhereInput(),
		},
select: {
id: true,
situationsNavigated: true,
format: true,
capacity: true,
boundaryStatement: true,
isPaused: true,
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

export async function getMyPeerSupportConnectionsAction() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return [];

  const currentUserId = auth.data.id;
  const connections = await prisma.peerSupportConnection.findMany({
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
format: true,
arcLength: true,
closedAt: true,
createdAt: true,
updatedAt: true,
offer: {
select: {
id: true,
situationsNavigated: true,
offerer: { select: { id: true, name: true, profilePhoto: true } }
}
},
request: {
select: {
id: true,
situationType: true,
whatSupportLooks: true,
requester: { select: { id: true, name: true, profilePhoto: true } }
}
},
feedbacks: { select: { id: true, feltMet: true, feltSafe: true, publicNote: true } },
},
orderBy: { updatedAt: 'desc' },
});

  return connections.map((c) => ({ ...c, currentUserId }));
}

export async function getMyPeerSupportRequestsAction() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return [];

  return prisma.peerSupportRequest.findMany({
    where: { requesterId: auth.data.id, isWithdrawn: false },
    select: {
      id: true,
      situationType: true,
      whatSupportLooks: true,
      whatNotLooking: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
