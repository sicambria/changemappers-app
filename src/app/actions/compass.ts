'use server';

import { getCurrentUser } from '@/lib/get-current-user';
import { prisma, ChangemakerLevel } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  saveCompassPlacementSchema,
  saveCompassClaritySchema,
  saveCompassContextSchema,
  saveCompassCapacitySchema,
  saveCompassCatalystSchema,
} from '@/lib/validations/compass';

function validateOrThrow<T>(schema: import('zod').ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Invalid data: ' + parsed.error.issues.map(i => i.message).join(', '));
  }
  return parsed.data;
}

// ─── Placement ───────────────────────────────────────────────────────────────

export async function saveCompassPlacement(level: number) {
  const authResult = await getCurrentUser();
  const user = authResult?.data;
  if (!user) throw new Error('Unauthorized');

  const validated = validateOrThrow(saveCompassPlacementSchema, { level });
  const enumLevel = `LEVEL_${validated.level}` as typeof ChangemakerLevel[keyof typeof ChangemakerLevel];

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { changemakeLevel: enumLevel },
    });
    await tx.compassProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        unlockedPillars: ['PILLAR_I'],
      },
    });
  });

  revalidatePath('/compass');
  return { success: true };
}

// ─── Pillar I: Clarity ───────────────────────────────────────────────────────

export async function saveCompassClarity(data: {
  northStar: string;
  nonNegotiables: string[];
  originQuestion?: string;
}) {
  const authResult = await getCurrentUser();
  const user = authResult?.data;
  if (!user) throw new Error('Unauthorized');

  const validated = validateOrThrow(saveCompassClaritySchema, data);

  const profile = await prisma.compassProfile.findUnique({
    where: { userId: user.id },
    select: { userId: true, unlockedPillars: true },
  });
  if (!profile) throw new Error('Compass profile not found. Please complete the placement first.');

  const newUnlocked = Array.from(new Set([...profile.unlockedPillars, 'PILLAR_II']));

  await prisma.compassProfile.update({
    where: { userId: user.id },
    data: {
      northStar: validated.northStar,
      nonNegotiables: validated.nonNegotiables,
      originQuestion: validated.originQuestion ?? null,
      unlockedPillars: newUnlocked,
      lastActiveSection: 'clarity',
    },
  });

  revalidatePath('/compass');
  return { success: true };
}

// ─── Pillar II: Context ──────────────────────────────────────────────────────

export async function saveCompassContext(data: {
  ecosystemMap?: {
    sharers: string[];
    gatekeepers: string[];
    affected: string[];
    gapReflection?: string;
  };
  translationMap?: {
    myFraming: string;
    alliesFraming: string;
    powerFraming: string;
  };
  conflictStyleNote?: string;
  communicationNote?: string;
}) {
  const authResult = await getCurrentUser();
  const user = authResult?.data;
  if (!user) throw new Error('Unauthorized');

  const validated = validateOrThrow(saveCompassContextSchema, data);

  await prisma.compassProfile.update({
    where: { userId: user.id },
    data: {
      ecosystemMap: validated.ecosystemMap ?? undefined,
      translationMap: validated.translationMap ?? undefined,
      conflictStyleNote: validated.conflictStyleNote ?? null,
      communicationNote: validated.communicationNote ?? null,
      lastActiveSection: 'context',
    },
  });

  revalidatePath('/compass');
  return { success: true };
}

// ─── Pillar III: Capacity ────────────────────────────────────────────────────

export async function saveCompassCapacity(data: {
  timeScore: number;
  resourceScore: number;
  bandwidthScore: number;
  confirmedScope: number;
  energyPatterns?: string;
  riskFears?: string;
  emotionalPattern?: string;
  supportNetwork?: {
    mentor?: string;
    peer?: string;
    challenger?: string;
    believer?: string;
  };
}) {
  const authResult = await getCurrentUser();
  const user = authResult?.data;
  if (!user) throw new Error('Unauthorized');

  const validated = validateOrThrow(saveCompassCapacitySchema, data);

  const profile = await prisma.compassProfile.findUnique({
    where: { userId: user.id },
    select: { userId: true, unlockedPillars: true },
  });
  if (!profile) throw new Error('Compass profile not found.');

  const newUnlocked = Array.from(new Set([...profile.unlockedPillars, 'PILLAR_IV']));

  await prisma.compassProfile.update({
    where: { userId: user.id },
    data: {
      timeScore: validated.timeScore,
      resourceScore: validated.resourceScore,
      bandwidthScore: validated.bandwidthScore,
      confirmedScope: validated.confirmedScope,
      energyPatterns: validated.energyPatterns ?? null,
      riskFears: validated.riskFears ?? null,
      emotionalPattern: validated.emotionalPattern ?? null,
      supportNetwork: validated.supportNetwork ?? undefined,
      unlockedPillars: newUnlocked,
      lastActiveSection: 'capacity',
    },
  });

  revalidatePath('/compass');
  return { success: true };
}

// ─── Pillar IV: Catalyst ─────────────────────────────────────────────────────

export async function saveCompassCatalyst(data: {
  experiments: {
    action: string;
    people: string;
    hypothesis: string;
    impactCheck: string;
    outcome?: string;
  }[];
  domainBalance?: {
    relationships?: string;
    resources?: string;
    knowledge?: string;
    influence?: string;
    wellbeing?: string;
    integrity?: string;
  };
  storyWhy?: string;
  storyVision?: string;
  storyShift?: string;
}) {
  const authResult = await getCurrentUser();
  const user = authResult?.data;
  if (!user) throw new Error('Unauthorized');

  const validated = validateOrThrow(saveCompassCatalystSchema, data);

  await prisma.compassProfile.update({
    where: { userId: user.id },
    data: {
      experiments: validated.experiments,
      domainBalance: validated.domainBalance ?? undefined,
      storyWhy: validated.storyWhy ?? null,
      storyVision: validated.storyVision ?? null,
      storyShift: validated.storyShift ?? null,
      lastActiveSection: 'catalyst',
    },
  });

  revalidatePath('/compass');
  return { success: true };
}
