'use server';
import { flattenError } from 'zod';
import { revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  createMentorProfileSchema,
  createMentoringRequestSchema,
  acceptMentoringRequestSchema,
  submitMentoringFeedbackSchema,
  type CreateMentorProfileInput,
  type CreateMentoringRequestInput,
  type AcceptMentoringRequestInput,
  type SubmitMentoringFeedbackInput,
} from '@/lib/validations/mentoring';
import {
  CACHE_TAG_MENTOR_PROFILES,
  CACHE_TAG_MENTORING_REQUESTS,
  mentoringRelationshipTag,
} from '@/lib/cache-tags';
import { isMatchable } from '@/lib/matchmaking/availabilityFilter';
import type { ApiResponse } from '@/types/modalities';
import { getAvailablePublicOfferOwnerWhereInput } from '@/lib/public-member-eligibility';
import { runAction } from '@/lib/server-action-wrapper';

// ─────────────────────────────────────────
// MENTOR PROFILE CRUD
// ─────────────────────────────────────────

export async function createMentorProfileAction(
  input: CreateMentorProfileInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createMentorProfileAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createMentorProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  // Check if profile already exists
  const existing = await prisma.mentorProfile.findUnique({
    where: { userId: auth.data.id },
    select: { id: true },
  });
  if (existing) return { success: false, error: 'Mentor profile already exists' };

  const profile = await prisma.mentorProfile.create({
    data: { ...parsed.data, userId: auth.data.id },
    select: { id: true },
  });

  revalidateTag(CACHE_TAG_MENTOR_PROFILES, 'default');
  return { success: true, data: profile };
  });
}

export async function editMentorProfileAction(
  id: string,
  input: Partial<CreateMentorProfileInput>,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('editMentorProfileAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const profile = await prisma.mentorProfile.findUnique({ where: { id }, select: { userId: true } });
  if (!profile || profile.userId !== auth.data.id) return { success: false, error: 'Not found' };

  await prisma.mentorProfile.update({ where: { id }, data: input });

  revalidateTag(CACHE_TAG_MENTOR_PROFILES, 'default');
  return { success: true, data: { id } };
  });
}

export async function archiveMentorProfileAction(id: string): Promise<ApiResponse<void>> {
  return runAction('archiveMentorProfileAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const profile = await prisma.mentorProfile.findUnique({ where: { id }, select: { userId: true } });
  if (!profile || profile.userId !== auth.data.id) return { success: false, error: 'Not found' };

  await prisma.mentorProfile.update({ where: { id }, data: { isArchived: true } });

  revalidateTag(CACHE_TAG_MENTOR_PROFILES, 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// MENTORING REQUEST CRUD
// ─────────────────────────────────────────

export async function createMentoringRequestAction(
  input: CreateMentoringRequestInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createMentoringRequestAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createMentoringRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const request = await prisma.mentoringRequest.create({
    data: { ...parsed.data, requesterId: auth.data.id },
    select: { id: true },
  });

  revalidateTag(CACHE_TAG_MENTORING_REQUESTS, 'default');
  return { success: true, data: request };
  });
}

export async function withdrawMentoringRequestAction(id: string): Promise<ApiResponse<void>> {
  return runAction('withdrawMentoringRequestAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const request = await prisma.mentoringRequest.findUnique({
    where: { id },
    select: { requesterId: true },
  });
  if (!request || request.requesterId !== auth.data.id) return { success: false, error: 'Not found' };

  await prisma.mentoringRequest.update({ where: { id }, data: { isWithdrawn: true } });

  revalidateTag(CACHE_TAG_MENTORING_REQUESTS, 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// RELATIONSHIP CRUD
// ─────────────────────────────────────────

export async function acceptMentoringRequestAction(
  input: AcceptMentoringRequestInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('acceptMentoringRequestAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = acceptMentoringRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  // Look up the mentor profile for the authenticated user
  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: auth.data.id },
    select: {
      id: true,
      isArchived: true,
      maxConcurrent: true,
      user: { select: { functionalProfile: { select: { availabilityMode: true } } } },
      _count: {
        select: {
          relationships: { where: { status: { in: ['EXPLORING', 'ACTIVE'] } } },
        },
      },
    },
  });
  if (!mentorProfile) return { success: false, error: 'No mentor profile found' };
  if (mentorProfile.isArchived) {
    return { success: false, error: 'Mentor profile is archived' };
  }

  // Availability gate
  const mentorMode = mentorProfile.user.functionalProfile?.availabilityMode ?? 'DELIVERING';
  if (!isMatchable(mentorMode)) {
    return { success: false, error: 'You are currently not available for new mentoring relationships' };
  }

  // Concurrent cap check
  if (mentorProfile._count.relationships >= mentorProfile.maxConcurrent) {
    return { success: false, error: 'You have reached your maximum concurrent relationships' };
  }

  // Verify the request exists and is not withdrawn
  const request = await prisma.mentoringRequest.findUnique({
    where: { id: parsed.data.requestId },
    select: { requesterId: true, isWithdrawn: true },
  });
  if (!request) return { success: false, error: 'Request not found' };
  if (request.isWithdrawn) return { success: false, error: 'Request has been withdrawn' };

  // Relationship create + mentee notification must be atomic (AUDIT-20260612-010).
  const relationship = await prisma.$transaction(async (tx) => {
    const created = await tx.mentoringRelationship.create({
      data: {
        mentorId: mentorProfile.id,
        requestId: parsed.data.requestId,
        arcLength: parsed.data.arcLength,
        checkInRhythm: parsed.data.checkInRhythm,
        status: 'EXPLORING',
      },
      select: { id: true },
    });

    // Notify the mentee
    await tx.notification.create({
      data: {
        userId: request.requesterId,
        type: 'MENTORING_REQUEST',
        title: 'Your mentoring request was accepted',
        message: 'A mentor has accepted your request. Check your relationships.',
        link: '/mentor/relationships',
      },
    });

    return created;
  });

  revalidateTag(mentoringRelationshipTag(relationship.id), 'default');
  return { success: true, data: relationship };
  });
}

export async function declineMentoringRequestAction(requestId: string): Promise<ApiResponse<void>> {
  return runAction('declineMentoringRequestAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  // Verify they have a mentor profile
  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: auth.data.id },
    select: { id: true },
  });
  if (!mentorProfile) return { success: false, error: 'No mentor profile found' };

  const request = await prisma.mentoringRequest.findUnique({
    where: { id: requestId },
    select: { id: true, isWithdrawn: true },
  });
  if (!request || request.isWithdrawn) return { success: false, error: 'Request not found' };

  // No explanation required — simply withdraw from our perspective
  // (the request remains; it can be accepted by another mentor)
  return { success: true, data: undefined };
  });
}

export async function activateMentoringRelationshipAction(id: string): Promise<ApiResponse<void>> {
  return runAction('activateMentoringRelationshipAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

const relationship = await prisma.mentoringRelationship.findUnique({
		where: { id },
		select: {
			id: true,
			status: true,
			mentor: { select: { userId: true } },
		},
	});
  if (!relationship || relationship.mentor.userId !== auth.data.id) {
    return { success: false, error: 'Not found' };
  }
  if (relationship.status !== 'EXPLORING') {
    return { success: false, error: 'Relationship is not in EXPLORING status' };
  }

  await prisma.mentoringRelationship.update({ where: { id }, data: { status: 'ACTIVE' } });

  revalidateTag(mentoringRelationshipTag(id), 'default');
  return { success: true, data: undefined };
  });
}

export async function closeMentoringRelationshipAction(id: string): Promise<ApiResponse<void>> {
  return runAction('closeMentoringRelationshipAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

const relationship = await prisma.mentoringRelationship.findUnique({
		where: { id },
		select: {
			id: true,
			status: true,
			mentor: { select: { userId: true } },
			request: { select: { requesterId: true } },
		},
	});
  if (!relationship) return { success: false, error: 'Not found' };

  const isMentor = relationship.mentor.userId === auth.data.id;
  const isMentee = relationship.request.requesterId === auth.data.id;
  if (!isMentor && !isMentee) return { success: false, error: 'Unauthorized' };

  // Status transition + follow-up notifications must be atomic (AUDIT-20260612-010).
  await prisma.$transaction(async (tx) => {
    await tx.mentoringRelationship.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
    });

    // Notify mentee to submit post-arc reflection
    await tx.notification.create({
      data: {
        userId: relationship.request.requesterId,
        type: 'ENGAGEMENT_COMPLETE_FEEDBACK',
        title: 'Reflect on your mentoring arc',
        message: 'Your mentoring relationship has closed. Please write a reflection.',
        link: `/mentor/relationships`,
      },
    });

    // Forward reciprocity prompt for mentee
    await tx.notification.create({
      data: {
        userId: relationship.request.requesterId,
        type: 'FORWARD_RECIPROCITY_PROMPT',
        title: 'What do you now carry that someone else needs?',
        link: '/contribute/offer/new',
      },
    });
  });

  revalidateTag(mentoringRelationshipTag(id), 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// FEEDBACK
// ─────────────────────────────────────────

export async function submitMentoringFeedbackAction(
  input: SubmitMentoringFeedbackInput,
): Promise<ApiResponse<void>> {
  return runAction('submitMentoringFeedbackAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = submitMentoringFeedbackSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

const relationship = await prisma.mentoringRelationship.findUnique({
		where: { id: parsed.data.relationshipId },
		select: {
			id: true,
			status: true,
			request: { select: { requesterId: true } },
			feedbacks: { select: { id: true, phase: true } },
		},
	});
  if (!relationship) return { success: false, error: 'Relationship not found' };

  // Critical: Only the mentee can submit feedback — structural enforcement
  if (relationship.request.requesterId !== auth.data.id) {
    return { success: false, error: 'Only the mentee can submit feedback' };
  }

  if (relationship.feedbacks.length > 0) {
    return { success: false, error: `${parsed.data.phase} feedback already submitted` };
  }

  // Validate phase requirements
  if (parsed.data.phase === 'post_arc' && relationship.status !== 'CLOSED') {
    return { success: false, error: 'Post-arc feedback requires a closed relationship' };
  }

  await prisma.mentoringFeedback.create({
    data: {
      relationshipId: parsed.data.relationshipId,
      phase: parsed.data.phase,
      reflection: parsed.data.reflection,
      authorId: auth.data.id,
    },
  });

  revalidateTag(mentoringRelationshipTag(parsed.data.relationshipId), 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────

export async function getMentorProfilesAction(filters?: {
  domain?: string;
}) {
return prisma.mentorProfile.findMany({
		where: {
			isArchived: false,
			...(filters?.domain ? { domain: { contains: filters.domain, mode: 'insensitive' } } : {}),
			user: getAvailablePublicOfferOwnerWhereInput(),
		},
select: {
id: true,
whatCanOffer: true,
domain: true,
yearsExperience: true,
arcLengthPreference: true,
maxConcurrent: true,
professionalUrl: true,
isArchived: true,
createdAt: true,
user: {
select: {
id: true,
name: true,
displayName: true,
profilePhoto: true,
archetypes: true,
functionalProfile: { select: { availabilityMode: true } },
},
},
_count: { select: { relationships: true } },
},
orderBy: { createdAt: 'desc' },
take: 50,
});
}

export async function getMyMentoringRelationshipsAction() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return [];

  const currentUserId = auth.data.id;
  const relationships = await prisma.mentoringRelationship.findMany({
  where: {
    OR: [
      { mentor: { userId: auth.data.id } },
      { request: { requesterId: auth.data.id } },
    ],
  },
  take: 50,
  select: {
			id: true,
			status: true,
			arcLength: true,
			checkInRhythm: true,
			createdAt: true,
			updatedAt: true,
			mentor: {
				select: {
					id: true,
					user: { select: { id: true, name: true, profilePhoto: true } }
				}
			},
			request: {
				select: {
					id: true,
					requester: { select: { id: true, name: true, profilePhoto: true } }
				}
			},
			feedbacks: { select: { id: true, phase: true, reflection: true } },
		},
		orderBy: { updatedAt: 'desc' },
	});

  return relationships.map((r) => ({ ...r, currentUserId }));
}

export async function getMentorProfileByIdAction(id: string) {
return prisma.mentorProfile.findFirst({
		where: { id, isArchived: false, user: getAvailablePublicOfferOwnerWhereInput() },
select: {
id: true,
whatCanOffer: true,
domain: true,
yearsExperience: true,
arcLengthPreference: true,
maxConcurrent: true,
professionalUrl: true,
isArchived: true,
createdAt: true,
user: {
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

export async function getMyMentorProfileAction() {
const auth = await getCurrentUser();
if (!auth.success || !auth.data) return null;

return prisma.mentorProfile.findUnique({
where: { userId: auth.data.id },
select: {
id: true,
whatCanOffer: true,
domain: true,
yearsExperience: true,
arcLengthPreference: true,
maxConcurrent: true,
professionalUrl: true,
isArchived: true,
createdAt: true,
user: {
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

export async function getMyMentoringRequestsAction() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return [];

  return prisma.mentoringRequest.findMany({
    where: { requesterId: auth.data.id, isWithdrawn: false },
    select: {
      id: true,
      domain: true,
      inflectionPoint: true,
      guidanceSought: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function getOpenMentoringRequestsAction() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return [];

  return prisma.mentoringRequest.findMany({
    where: {
      isWithdrawn: false,
      relationships: { none: {} },
    },
    select: {
      id: true,
      domain: true,
      inflectionPoint: true,
      guidanceSought: true,
      createdAt: true,
      requester: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}
