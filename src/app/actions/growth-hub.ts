'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  createMentorProfileAction,
  getMentorProfilesAction,
  getMyMentorProfileAction,
  archiveMentorProfileAction,
} from './mentoring';
import {
  createCoachingOfferAction,
  getCoachingOffersAction,
  getMyCoachingOffersAction,
  archiveCoachingOfferAction,
} from './coaching';
import {
  createTrainingOfferAction,
  getTrainingOffersAction,
  getMyTrainingOffersAction,
  archiveTrainingOfferAction,
} from './training';
import {
  createPeerSupportOfferAction,
  getPeerSupportOffersAction,
  getMyPeerSupportConnectionsAction,
  archivePeerSupportOfferAction,
} from './peer';
import type { ApiResponse } from '@/types/modalities';
import type { GrowthModality } from '@/types/growth-hub';
import { runAction } from '@/lib/server-action-wrapper';

export interface GrowthOfferListItem {
  id: string;
  modality: GrowthModality;
  domain: string;
  description: string;
  createdAt: Date;
  creator: {
    id: string;
    name: string | null;
    displayName: string | null;
    profilePhoto: string | null;
    archetypes: string[];
  };
}

export async function getGrowthOffersAction(filters?: {
  modality?: GrowthModality;
  domain?: string;
}): Promise<GrowthOfferListItem[]> {
  const [trainings, mentors, coaches, peers] = await Promise.all([
    filters?.modality && filters.modality !== 'TRAINING' ? Promise.resolve([]) : getTrainingOffersAction({ domain: filters?.domain }),
    filters?.modality && filters.modality !== 'MENTOR' ? Promise.resolve([]) : getMentorProfilesAction({ domain: filters?.domain }),
    filters?.modality && filters.modality !== 'COACH' ? Promise.resolve([]) : getCoachingOffersAction({}),
    filters?.modality && filters.modality !== 'PEER' ? Promise.resolve([]) : getPeerSupportOffersAction({}),
  ]);

  const trainingOffers: GrowthOfferListItem[] = trainings.map((t) => ({
    id: t.id,
    modality: 'TRAINING' as GrowthModality,
    domain: t.domain,
    description: t.description,
    createdAt: t.createdAt,
    creator: {
      id: t.creator.id,
      name: t.creator.name,
      displayName: t.creator.displayName,
      profilePhoto: t.creator.profilePhoto,
      archetypes: t.creator.archetypes,
    },
  }));

  const mentorOffers: GrowthOfferListItem[] = mentors.map((m) => ({
    id: m.id,
    modality: 'MENTOR' as GrowthModality,
    domain: m.domain,
    description: m.whatCanOffer,
    createdAt: m.createdAt,
    creator: {
      id: m.user.id,
      name: m.user.name,
      displayName: m.user.displayName,
      profilePhoto: m.user.profilePhoto,
      archetypes: m.user.archetypes,
    },
  }));

  const coachOffers: GrowthOfferListItem[] = coaches.map((c) => ({
    id: c.id,
    modality: 'COACH' as GrowthModality,
    domain: '',
    description: c.coacheeKnow,
    createdAt: c.createdAt,
    creator: {
      id: c.coach.id,
      name: c.coach.name,
      displayName: c.coach.displayName,
      profilePhoto: c.coach.profilePhoto,
      archetypes: c.coach.archetypes,
    },
  }));

  const peerOffers: GrowthOfferListItem[] = peers.map((p) => ({
    id: p.id,
    modality: 'PEER' as GrowthModality,
    domain: p.situationsNavigated.join(', '),
    description: p.boundaryStatement,
    createdAt: p.createdAt,
    creator: {
      id: p.offerer.id,
      name: p.offerer.name,
      displayName: p.offerer.displayName,
      profilePhoto: p.offerer.profilePhoto,
      archetypes: p.offerer.archetypes,
    },
  }));

  return [...trainingOffers, ...mentorOffers, ...coachOffers, ...peerOffers].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export async function getMyGrowthOffersAction(): Promise<
  Array<{ id: string; modality: GrowthModality; data: Record<string, unknown> }>
> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return [];

  const [trainings, mentor, coaches, peers] = await Promise.all([
    getMyTrainingOffersAction(),
    getMyMentorProfileAction(),
    getMyCoachingOffersAction(),
    prisma.peerSupportOffer.findMany({
    where: { offererId: auth.data.id, isArchived: false },
    take: 50,
    select: {
            id: true,
            situationsNavigated: true,
            boundaryStatement: true,
            format: true,
            capacity: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
  ]);

  const results: Array<{ id: string; modality: GrowthModality; data: Record<string, unknown> }> = [];

  trainings.forEach((t) => {
    results.push({ id: t.id, modality: 'TRAINING', data: t });
  });

  if (mentor) {
    results.push({ id: mentor.id, modality: 'MENTOR', data: mentor });
  }

  coaches.forEach((c) => {
    results.push({ id: c.id, modality: 'COACH', data: c });
  });

  peers.forEach((p) => {
    results.push({ id: p.id, modality: 'PEER', data: p });
  });

  return results;
}

export async function createGrowthOfferAction(
  modality: GrowthModality,
  data: Record<string, unknown>,
): Promise<ApiResponse<{ id: string; modality: GrowthModality }>> {
  return runAction('createGrowthOfferAction', async () => {
  switch (modality) {
    case 'MENTOR': {
      const result = await createMentorProfileAction({
        domain: data.domain as string,
        yearsExperience: (data.yearsExperience as number) ?? 1,
        whatCanOffer: data.description as string,
        arcLengthPreference: (data.arcLengthPreference as string) ?? '3 months',
        maxConcurrent: (data.maxConcurrent as number) ?? 2,
        professionalUrl: data.professionalUrl as string | undefined,
      });
      if (!result.success) return result;
      return { success: true, data: { id: result.data.id, modality: 'MENTOR' } };
    }
    case 'COACH': {
      const result = await createCoachingOfferAction({
        style: data.style as string,
        format: data.format as string,
        arcLengthOption: (data.arcLengthOption as string) ?? 'flexible',
        availability: (data.availability as string) ?? 'flexible',
        coacheeKnow: data.description as string,
      });
      if (!result.success) return result;
      return { success: true, data: { id: result.data.id, modality: 'COACH' } };
    }
    case 'TRAINING': {
      const result = await createTrainingOfferAction({
        domain: data.domain as string,
        format: data.format as 'WORKSHOP' | 'COURSE' | 'DEMO' | 'RESOURCE' | 'GUIDED_PRACTICE',
        level: data.level as 'EXPLORER' | 'PRACTITIONER' | 'GUIDE',
        deliveryMode: (data.deliveryMode as 'ONLINE' | 'IN_PERSON' | 'HYBRID') ?? 'ONLINE',
        city: data.city as string | undefined,
        cityLat: data.cityLat as number | undefined,
        cityLng: data.cityLng as number | undefined,
        professionalUrl: data.professionalUrl as string | undefined,
        isSync: (data.isSync as boolean) ?? true,
        isGroupFormat: (data.isGroupFormat as boolean) ?? false,
        timeCommitment: data.timeCommitment as string,
        capacity: data.capacity as number | undefined,
        description: data.description as string,
      });
      if (!result.success) return result;
      return { success: true, data: { id: result.data.id, modality: 'TRAINING' } };
    }
    case 'PEER': {
      const result = await createPeerSupportOfferAction({
        situationsNavigated: [data.situationType as string],
        format: data.format as string,
        capacity: (data.capacity as number) ?? 1,
        boundaryStatement: data.description as string,
      });
      if (!result.success) return result;
      return { success: true, data: { id: result.data.id, modality: 'PEER' } };
    }
    default:
      return { success: false, error: 'Invalid modality' };
  }
  });
}

export async function archiveGrowthOfferAction(
  id: string,
  modality: GrowthModality,
): Promise<ApiResponse<void>> {
  return runAction('archiveGrowthOfferAction', async () => {
  switch (modality) {
    case 'MENTOR':
      return archiveMentorProfileAction(id);
    case 'COACH':
      return archiveCoachingOfferAction(id);
    case 'TRAINING':
      return archiveTrainingOfferAction(id);
    case 'PEER':
      return archivePeerSupportOfferAction(id);
    default:
      return { success: false, error: 'Invalid modality' };
  }
  });
}

export async function getMyGrowthConnectionsAction() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { TRAINING: [], MENTOR: [], COACH: [], PEER: [] };

  const [trainingConnections, mentoringRelationships, coachingEngagements, peerConnections] =
    await Promise.all([
    prisma.trainingEngagement.findMany({
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
          updatedAt: true,
          offer: { select: { id: true, creator: { select: { id: true, name: true, profilePhoto: true } } } },
          request: { select: { id: true, requester: { select: { id: true, name: true, profilePhoto: true } } } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    prisma.mentoringRelationship.findMany({
    where: {
      OR: [{ mentor: { userId: auth.data.id } }, { request: { requesterId: auth.data.id } }],
    },
    take: 50,
    select: {
          id: true,
          status: true,
          updatedAt: true,
          mentor: { select: { id: true, user: { select: { id: true, name: true, profilePhoto: true } } } },
          request: { select: { id: true, requester: { select: { id: true, name: true, profilePhoto: true } } } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    prisma.coachingEngagement.findMany({
    where: {
      OR: [{ offer: { coachId: auth.data.id } }, { request: { requesterId: auth.data.id } }],
    },
    take: 50,
    select: {
          id: true,
          status: true,
          updatedAt: true,
          offer: { select: { id: true, coach: { select: { id: true, name: true, profilePhoto: true } } } },
          request: { select: { id: true, requester: { select: { id: true, name: true, profilePhoto: true } } } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      getMyPeerSupportConnectionsAction(),
    ]);

  return {
    TRAINING: trainingConnections,
    MENTOR: mentoringRelationships,
    COACH: coachingEngagements,
    PEER: peerConnections,
  };
}
