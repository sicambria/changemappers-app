'use server';
import { flattenError } from 'zod';

import { revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  createPitchSchema,
  updatePitchSchema,
  pitchFiltersSchema,
  endorsePitchSchema,
  archivePitchSchema,
  type CreatePitchInput,
  type UpdatePitchInput,
  type PitchFiltersInput,
} from '@/lib/validations/pitch';
import {
  CACHE_TAG_PITCHES,
  pitchTag,
} from '@/lib/cache-tags';
import type { ApiResponse } from '@/types/modalities';
import { runAction } from '@/lib/server-action-wrapper';

export type PitchDetail = {
  id: string;
  name: string;
  summary: string;
  location: string;
  website: string | null;
  language: string;
  localContext: string;
  systemicChallenge: string;
  vision: string;
  expectedOutcomes: string;
  teamDescription: string;
  experience: string | null;
  evidenceLinks: string[];
  temporalClass: string;
  license: string;
  protocolLabels: string[];
  casesWithProvenance: boolean;
  notInRoomAck: string | null;
  stage: string;
  mainObstacles: string;
  needsSkills: string[];
  needsFunding: boolean;
  fundingAmount: number | null;
  fundingCurrency: string | null;
  needsPartners: boolean;
  needsVolunteers: boolean;
  needsKnowledge: string | null;
  needsOther: string | null;
  callToAction: string;
  contactEmail: string | null;
  usePlatformMessaging: boolean;
  status: string;
  publishedAt: Date | null;
  topicTags: string[];
  authorId: string;
  communityId: string | null;
  initiativeId: string | null;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  author: {
    id: string;
    name: string;
    displayName: string | null;
    profilePhoto: string | null;
  };
  community: { id: string; name: string } | null;
  rdgTags: Array<{
    rdg: {
      id: string;
      key: string;
      label: string;
      labelHu: string | null;
      category: string;
    };
  }>;
  endorsements: Array<{
    id: string;
    message: string | null;
    createdAt: Date;
    endorser: {
      id: string;
      name: string;
      displayName: string | null;
      profilePhoto: string | null;
    };
  }>;
  _count: {
    endorsements: number;
  };
};

export type PitchCard = {
  id: string;
  name: string;
  summary: string;
  location: string;
  stage: string;
  needsFunding: boolean;
  needsPartners: boolean;
  needsVolunteers: boolean;
  needsSkills: string[];
  User: {
    name: string;
    displayName: string | null;
    profilePhoto: string | null;
  };
  rdgTags: Array<{
    RegenerativeGoal: {
      key: string;
      label: string;
      labelHu: string | null;
    };
  }>;
  _count: {
    endorsements: number;
  };
};

async function getPitchDetail(id: string) {
  return prisma.pitch.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      summary: true,
      location: true,
      website: true,
      language: true,
      localContext: true,
      systemicChallenge: true,
      vision: true,
      expectedOutcomes: true,
      teamDescription: true,
      experience: true,
      evidenceLinks: true,
      temporalClass: true,
      license: true,
      protocolLabels: true,
      casesWithProvenance: true,
      notInRoomAck: true,
      stage: true,
      mainObstacles: true,
      needsSkills: true,
      needsFunding: true,
      fundingAmount: true,
      fundingCurrency: true,
      needsPartners: true,
      needsVolunteers: true,
      needsKnowledge: true,
      needsOther: true,
      callToAction: true,
      contactEmail: true,
      usePlatformMessaging: true,
      status: true,
      publishedAt: true,
      topicTags: true,
      authorId: true,
      communityId: true,
      initiativeId: true,
      createdAt: true,
      updatedAt: true,
      archivedAt: true,
      User: {
        select: {
          id: true,
          name: true,
          displayName: true,
          profilePhoto: true,
        },
      },
      Community: {
        select: { id: true, name: true },
      },
      PitchRDGTag: {
        select: {
          RegenerativeGoal: {
            select: { id: true, key: true, label: true, labelHu: true, category: true },
          },
        },
      },
      PitchEndorsement: {
        select: {
          id: true,
          message: true,
          createdAt: true,
          User: {
            select: { id: true, name: true, displayName: true, profilePhoto: true },
          },
        },
        orderBy: { createdAt: 'desc' as const },
        take: 10,
      },
      _count: {
        select: { PitchEndorsement: true },
      },
    },
  });
}

export async function createPitchAction(
  input: CreatePitchInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createPitchAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createPitchSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const { rdgTags, ...pitchData } = parsed.data;

  const pitch = await prisma.pitch.create({
    data: {
      ...pitchData,
      authorId: auth.data.id,
      PitchRDGTag: {
        create: rdgTags.map((rdgKey) => ({
          RegenerativeGoal: { connect: { key: rdgKey } },
        })),
      },
    },
    select: { id: true },
  });

  revalidateTag(CACHE_TAG_PITCHES, 'default');
  return { success: true, data: { id: pitch.id } };
  });
}

export async function updatePitchAction(
  pitchId: string,
  input: UpdatePitchInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('updatePitchAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const existingPitch = await prisma.pitch.findUnique({
    where: { id: pitchId },
    select: { authorId: true, status: true },
  });

  if (!existingPitch) return { success: false, error: 'Pitch not found' };
  if (existingPitch.authorId !== auth.data.id) {
    return { success: false, error: 'Not authorized to edit this pitch' };
  }

  const parsed = updatePitchSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const { rdgTags, ...pitchData } = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.pitch.update({
      where: { id: pitchId },
      data: pitchData,
    });

    if (rdgTags !== undefined) {
      await tx.pitchRDGTag.deleteMany({ where: { pitchId } });
      if (rdgTags.length > 0) {
        await tx.pitch.update({
          where: { id: pitchId },
          data: {
            PitchRDGTag: {
              create: rdgTags.map((rdgKey) => ({
                RegenerativeGoal: { connect: { key: rdgKey } },
              })),
            },
          },
        });
      }
    }
  });

  revalidateTag(CACHE_TAG_PITCHES, 'default');
  revalidateTag(pitchTag(pitchId), 'default');
  return { success: true, data: { id: pitchId } };
  });
}

export async function publishPitchAction(
  pitchId: string,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('publishPitchAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const pitch = await prisma.pitch.findUnique({
    where: { id: pitchId },
    select: { authorId: true, status: true },
  });

  if (!pitch) return { success: false, error: 'Pitch not found' };
  if (pitch.authorId !== auth.data.id) {
    return { success: false, error: 'Not authorized' };
  }
  if (pitch.status !== 'DRAFT') {
    return { success: false, error: 'Only draft pitches can be published' };
  }

  await prisma.pitch.update({
    where: { id: pitchId },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });

  revalidateTag(CACHE_TAG_PITCHES, 'default');
  revalidateTag(pitchTag(pitchId), 'default');
  return { success: true, data: { id: pitchId } };
  });
}

export async function archivePitchAction(
  input: { pitchId: string; reason?: string },
): Promise<ApiResponse<void>> {
  return runAction('archivePitchAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = archivePitchSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const pitch = await prisma.pitch.findUnique({
    where: { id: parsed.data.pitchId },
    select: { authorId: true, status: true },
  });

  if (!pitch) return { success: false, error: 'Pitch not found' };
  if (pitch.authorId !== auth.data.id) {
    return { success: false, error: 'Not authorized' };
  }

  await prisma.pitch.update({
    where: { id: parsed.data.pitchId },
    data: {
      status: 'ARCHIVED',
      archivedAt: new Date(),
    },
  });

  revalidateTag(CACHE_TAG_PITCHES, 'default');
  revalidateTag(pitchTag(parsed.data.pitchId), 'default');
  return { success: true, data: undefined };
  });
}

export async function getPitchAction(
  pitchId: string,
): Promise<ApiResponse<PitchDetail>> {
  return runAction('getPitchAction', async () => {
  const auth = await getCurrentUser();
  const userId = auth.success ? auth.data?.id : null;

  const pitch = await getPitchDetail(pitchId);

  if (!pitch) return { success: false, error: 'Pitch not found' };

  if (pitch.status === 'DRAFT' && pitch.authorId !== userId) {
    return { success: false, error: 'Pitch not found' };
  }

  if (pitch.status === 'ARCHIVED' && pitch.authorId !== userId) {
    return { success: false, error: 'Pitch not found' };
  }

  const mappedPitch: PitchDetail = {
    ...pitch,
    author: pitch.User,
    community: pitch.Community,
    rdgTags: pitch.PitchRDGTag.map(t => ({ rdg: t.RegenerativeGoal })),
    endorsements: pitch.PitchEndorsement.map(e => ({ id: e.id, message: e.message, createdAt: e.createdAt, endorser: e.User })),
    _count: { endorsements: pitch._count?.PitchEndorsement ?? 0 },
  };
  return { success: true, data: mappedPitch };
  });
}

function buildPitchWhereClause(f: PitchFiltersInput): Record<string, unknown> {
  const where: Record<string, unknown> = { status: 'PUBLISHED' };
  if (f.stage) where.stage = f.stage;
  if (f.language) where.language = f.language;
  if (f.authorId) where.authorId = f.authorId;
  if (f.communityId) where.communityId = f.communityId;
  if (f.rdgTags?.length) {
    where.PitchRDGTag = { some: { RegenerativeGoal: { key: { in: f.rdgTags } } } };
  }
  if (f.location) where.location = { contains: f.location, mode: 'insensitive' };
  if (f.search) {
    where.OR = [
      { name: { contains: f.search, mode: 'insensitive' } },
      { summary: { contains: f.search, mode: 'insensitive' } },
    ];
  }
  return where;
}

export async function listPitchesAction(
  filters?: PitchFiltersInput,
): Promise<ApiResponse<PitchDetail[]>> {
  return runAction('listPitchesAction', async () => {
  const parsed = filters ? pitchFiltersSchema.safeParse(filters) : null;
  if (parsed && !parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const where = parsed?.data ? buildPitchWhereClause(parsed.data) : { status: 'PUBLISHED' };

  const pitches = await prisma.pitch.findMany({
    where,
    select: {
      id: true,
      name: true,
      summary: true,
      location: true,
      website: true,
      language: true,
      localContext: true,
      systemicChallenge: true,
      vision: true,
      expectedOutcomes: true,
      teamDescription: true,
      experience: true,
      evidenceLinks: true,
      temporalClass: true,
      license: true,
      protocolLabels: true,
      casesWithProvenance: true,
      notInRoomAck: true,
      stage: true,
      mainObstacles: true,
      needsSkills: true,
      needsFunding: true,
      fundingAmount: true,
      fundingCurrency: true,
      needsPartners: true,
      needsVolunteers: true,
      needsKnowledge: true,
      needsOther: true,
      callToAction: true,
      contactEmail: true,
      usePlatformMessaging: true,
      status: true,
      publishedAt: true,
      topicTags: true,
      authorId: true,
      communityId: true,
      initiativeId: true,
      createdAt: true,
      updatedAt: true,
      archivedAt: true,
      User: {
        select: {
          id: true,
          name: true,
          displayName: true,
          profilePhoto: true,
        },
      },
      Community: {
        select: { id: true, name: true },
      },
      PitchRDGTag: {
        select: {
          RegenerativeGoal: {
            select: { id: true, key: true, label: true, labelHu: true, category: true },
          },
        },
      },
      PitchEndorsement: {
        select: {
          id: true,
          message: true,
          createdAt: true,
          User: {
            select: { id: true, name: true, displayName: true, profilePhoto: true },
          },
        },
        orderBy: { createdAt: 'desc' as const },
        take: 10,
      },
      _count: {
        select: { PitchEndorsement: true },
      },
    },
    orderBy: { publishedAt: 'desc' as const },
    take: 50,
  });

  const mappedPitches: PitchDetail[] = pitches.map(pitch => ({
    ...pitch,
    author: pitch.User,
    community: pitch.Community,
    rdgTags: pitch.PitchRDGTag.map(t => ({ rdg: t.RegenerativeGoal })),
    endorsements: pitch.PitchEndorsement.map(e => ({ id: e.id, message: e.message, createdAt: e.createdAt, endorser: e.User })),
    _count: { endorsements: pitch._count?.PitchEndorsement ?? 0 },
  }));
  return { success: true, data: mappedPitches };
  });
}

export async function listMyPitchesAction(): Promise<ApiResponse<PitchDetail[]>> {
  return runAction('listMyPitchesAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const pitches = await prisma.pitch.findMany({
    where: { authorId: auth.data.id },
    select: {
      id: true,
      name: true,
      summary: true,
      location: true,
      website: true,
      language: true,
      localContext: true,
      systemicChallenge: true,
      vision: true,
      expectedOutcomes: true,
      teamDescription: true,
      experience: true,
      evidenceLinks: true,
      temporalClass: true,
      license: true,
      protocolLabels: true,
      casesWithProvenance: true,
      notInRoomAck: true,
      stage: true,
      mainObstacles: true,
      needsSkills: true,
      needsFunding: true,
      fundingAmount: true,
      fundingCurrency: true,
      needsPartners: true,
      needsVolunteers: true,
      needsKnowledge: true,
      needsOther: true,
      callToAction: true,
      contactEmail: true,
      usePlatformMessaging: true,
      status: true,
      publishedAt: true,
      topicTags: true,
      authorId: true,
      communityId: true,
      initiativeId: true,
      createdAt: true,
      updatedAt: true,
      archivedAt: true,
      User: {
        select: {
          id: true,
          name: true,
          displayName: true,
          profilePhoto: true,
        },
      },
      Community: {
        select: { id: true, name: true },
      },
      PitchRDGTag: {
        select: {
          RegenerativeGoal: {
            select: { id: true, key: true, label: true, labelHu: true, category: true },
          },
        },
      },
      PitchEndorsement: {
        select: {
          id: true,
          message: true,
          createdAt: true,
          User: {
            select: { id: true, name: true, displayName: true, profilePhoto: true },
          },
        },
        orderBy: { createdAt: 'desc' as const },
        take: 10,
      },
      _count: {
        select: { PitchEndorsement: true },
      },
    },
    orderBy: { updatedAt: 'desc' as const },
  });

  const mappedPitches: PitchDetail[] = pitches.map(pitch => ({
    ...pitch,
    author: pitch.User,
    community: pitch.Community,
    rdgTags: pitch.PitchRDGTag.map(t => ({ rdg: t.RegenerativeGoal })),
    endorsements: pitch.PitchEndorsement.map(e => ({ id: e.id, message: e.message, createdAt: e.createdAt, endorser: e.User })),
    _count: { endorsements: pitch._count?.PitchEndorsement ?? 0 },
  }));
  return { success: true, data: mappedPitches };
  });
}

export async function endorsePitchAction(
  input: { pitchId: string; message?: string },
): Promise<ApiResponse<{ id: string }>> {
  return runAction('endorsePitchAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = endorsePitchSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const pitch = await prisma.pitch.findUnique({
    where: { id: parsed.data.pitchId },
    select: { id: true, status: true, authorId: true },
  });

  if (!pitch) return { success: false, error: 'Pitch not found' };
  if (pitch.status !== 'PUBLISHED') {
    return { success: false, error: 'Can only endorse published pitches' };
  }
  if (pitch.authorId === auth.data.id) {
    return { success: false, error: 'Cannot endorse your own pitch' };
  }

  const endorsement = await prisma.pitchEndorsement.upsert({
    where: {
      pitchId_endorserId: {
        pitchId: parsed.data.pitchId,
        endorserId: auth.data.id,
      },
    },
    update: { message: parsed.data.message },
    create: {
      pitchId: parsed.data.pitchId,
      endorserId: auth.data.id,
      message: parsed.data.message,
    },
    select: { id: true },
  });

  revalidateTag(pitchTag(parsed.data.pitchId), 'default');
  return { success: true, data: endorsement };
  });
}

export async function listRegenerativeGoalsAction(): Promise<
  ApiResponse<
    Array<{
      id: string;
      key: string;
      label: string;
      labelHu: string | null;
      category: string;
    }>
  >
> {
  return runAction('listRegenerativeGoalsAction', async () => {
  const rdgs = await prisma.regenerativeGoal.findMany({
  select: { id: true, key: true, label: true, labelHu: true, category: true },
  orderBy: [{ sortOrder: 'asc' }],
  take: 200,
});

  return { success: true, data: rdgs };
  });
}

export async function removeEndorsementAction(
  pitchId: string,
): Promise<ApiResponse<void>> {
  return runAction('removeEndorsementAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  await prisma.pitchEndorsement.delete({
    where: {
      pitchId_endorserId: {
        pitchId,
        endorserId: auth.data.id,
      },
    },
  });

  revalidateTag(pitchTag(pitchId), 'default');
  return { success: true, data: undefined };
  });
}
