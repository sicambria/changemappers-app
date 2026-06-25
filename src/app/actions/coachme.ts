'use server';

import { revalidatePath } from 'next/cache';
import { DAY_MS } from '@/lib/constants';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/app/actions/auth';
import { verifyPassword } from '@/lib/auth';
import type { CoachMeFocusTag, CoachMeEncryptionModel } from '@/lib/prisma';

export type { CoachMeFocusTag, CoachMeEncryptionModel } from '@/lib/prisma';

const SESSION_SELECT = {
  id: true, userId: true, focusTag: true, customFocusTag: true,
  whyImportant: true, sessionGoal: true, sessionSuccessCriteria: true,
  miracleSignsA: true, miracleSignsB: true, miracleSignsC: true, miracleOptional: true,
  scalingCurrent: true, scalingAlreadyHere: true, scalingResources: true,
  scalingRecentMoments: true, scalingNextStep: true,
  actionPlanV1: true, actionPlanFinal: true, actionOptional: true,
  sessionUsefulness: true, finalReflections: true,
  currentPhase: true, createdAt: true, updatedAt: true, completedAt: true, archivedAt: true,
} as const;

const SUPPORT_RESOURCE_SELECT = {
  id: true, region: true, name: true, type: true, contact: true, description: true,
  order: true, active: true,
} as const;

const FocusTagValues = ['WORK_CAREER', 'RELATIONSHIPS', 'HEALTH', 'PERSONAL_GROWTH', 'LIFE_BALANCE', 'OTHER'] as const;
const FocusTagSchema = z.enum(FocusTagValues);

// Text fields accept arbitrary strings because they arrive as AES-GCM ciphertext (base64).
const CreateSessionSchema = z.object({
  focusTag: FocusTagSchema.optional(),
  customFocusTag: z.string().optional(),
  whyImportant: z.string().optional(),
  sessionGoal: z.string().min(1),
  sessionSuccessCriteria: z.string().optional(),
});

const UpdateSessionSchema = z.object({
  currentPhase: z.number().int().min(0).max(8).optional(),
  focusTag: FocusTagSchema.optional(),
  customFocusTag: z.string().optional(),
  whyImportant: z.string().optional(),
  sessionGoal: z.string().optional(),
  sessionSuccessCriteria: z.string().optional(),
  miracleSignsA: z.string().optional(),
  miracleSignsB: z.string().optional(),
  miracleSignsC: z.string().optional(),
  miracleOptional: z.string().optional(),
  scalingCurrent: z.number().int().min(1).max(10).optional(),
  scalingAlreadyHere: z.number().int().min(1).max(10).optional(),
  scalingResources: z.string().optional(),
  scalingRecentMoments: z.string().optional(),
  scalingNextStep: z.string().optional(),
  actionPlanV1: z.string().optional(),
  actionPlanFinal: z.string().optional(),
  actionOptional: z.string().optional(),
  sessionUsefulness: z.number().int().min(1).max(10).optional(),
  finalReflections: z.string().optional(),
});

const SaveConsentSchema = z.object({});

const SaveEncryptionConfigSchema = z.object({
  encryptionModel: z.enum(['STRONG', 'RECOVERABLE']),
  encryptionSalt: z.string().min(1),
  encryptedDek: z.string().nullable(),
});

export type SessionData = Awaited<ReturnType<typeof getSession>>;
export type ConsentData = Awaited<ReturnType<typeof getConsentStatus>>;

const CRISIS_PHRASES = [
  "don't want to be here",
  'not worth living',
  'end it all',
  'no reason to go on',
  "can't do this anymore",
  'better off dead',
  'kill myself',
  'suicide',
];

function hasCompleteEncryptionConfig(consent: {
  encryptionModel: CoachMeEncryptionModel | null;
  encryptionSalt: string | null;
} | null): boolean {
  return !!consent?.encryptionModel && !!consent.encryptionSalt;
}

function checkCrisisSignals(text: string): boolean {
  const lowerText = text.toLowerCase();
  return CRISIS_PHRASES.some((phrase) => lowerText.includes(phrase.toLowerCase()));
}

async function requireActiveCoachmeConsent(userId: string): Promise<boolean> {
  const consent = await prisma.coachMeConsent.findUnique({
    where: { userId },
    select: { encryptionModel: true, encryptionSalt: true },
  });

  return hasCompleteEncryptionConfig(consent);
}

export async function getConsentStatus() {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data) {
    return { success: false, error: 'Not authenticated' };
  }

  const userId = userRes.data.user.id;

  const consent = await prisma.coachMeConsent.findUnique({
    where: { userId },
    select: { id: true, agreedAt: true, encryptionModel: true, encryptionSalt: true },
  });

  return { success: true, data: consent, hasConsent: hasCompleteEncryptionConfig(consent) };
}

export async function getEncryptionConfig() {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data) {
    return { success: false, error: 'Not authenticated' };
  }

  const userId = userRes.data.user.id;

  const consent = await prisma.coachMeConsent.findUnique({
    where: { userId },
    select: { encryptionModel: true, encryptionSalt: true, encryptedDek: true },
  });

  if (!consent?.encryptionModel || !consent.encryptionSalt) {
    return { success: false, error: 'Encryption not configured' };
  }

  return {
    success: true,
    data: {
      encryptionModel: consent.encryptionModel,
      encryptionSalt: consent.encryptionSalt,
      encryptedDek: consent.encryptedDek,
    },
  };
}

export async function saveConsent(_data: Record<string, never> = {}) {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data) {
    return { success: false, error: 'Not authenticated' };
  }

  const userId = userRes.data.user.id;
  SaveConsentSchema.parse(_data);

  const consent = await prisma.coachMeConsent.upsert({
    where: { userId },
    create: { userId, agreedAt: new Date() },
    update: { agreedAt: new Date() },
  });

  revalidatePath('/coachme');
  return { success: true, data: consent };
}

export async function saveEncryptionConfig(data: {
  encryptionModel: CoachMeEncryptionModel;
  encryptionSalt: string;
  encryptedDek: string | null;
}) {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data) {
    return { success: false, error: 'Not authenticated' };
  }

  const userId = userRes.data.user.id;
  const parsed = SaveEncryptionConfigSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data', issues: parsed.error.issues };
  }

  await prisma.coachMeConsent.update({
    where: { userId },
    data: {
      encryptionModel: parsed.data.encryptionModel,
      encryptionSalt: parsed.data.encryptionSalt,
      encryptedDek: parsed.data.encryptedDek,
    },
  });

  return { success: true };
}

export async function verifyAccountPassword(password: string) {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data) {
    return { success: false, error: 'Not authenticated' };
  }

  const userId = userRes.data.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return { success: false, error: 'No password set. OAuth users must set a password first.' };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { success: false, error: 'Incorrect password' };
  }

  return { success: true };
}

export async function createSession(data: {
  focusTag?: CoachMeFocusTag;
  customFocusTag?: string;
  whyImportant?: string;
  sessionGoal: string;
  sessionSuccessCriteria?: string;
}) {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data) {
    return { success: false, error: 'Not authenticated' };
  }

  const userId = userRes.data.user.id;
  const parsed = CreateSessionSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: 'Invalid data', issues: parsed.error.issues };
  }

  const consent = await prisma.coachMeConsent.findUnique({
    where: { userId },
    select: { encryptionModel: true, encryptionSalt: true },
  });

  if (!hasCompleteEncryptionConfig(consent)) {
    return { success: false, error: 'Encryption setup required' };
  }

  const inactiveThreshold = new Date(Date.now() - 30 * DAY_MS);
  const existingSession = await prisma.coachMeSession.findFirst({
    where: { userId, completedAt: null, archivedAt: null, updatedAt: { gte: inactiveThreshold } },
    orderBy: { updatedAt: 'desc' },
    select: SESSION_SELECT,
  });

  if (existingSession) {
    return { success: true, data: existingSession, resumed: true };
  }

  const session = await prisma.coachMeSession.create({
    data: {
      userId,
      focusTag: parsed.data.focusTag ?? 'OTHER',
      customFocusTag: parsed.data.customFocusTag,
      whyImportant: parsed.data.whyImportant,
      sessionGoal: parsed.data.sessionGoal,
      sessionSuccessCriteria: parsed.data.sessionSuccessCriteria,
      currentPhase: 2,
    },
    select: SESSION_SELECT,
  });

  revalidatePath('/coachme');
  return { success: true, data: session, resumed: false };
}

export async function getSession(sessionId: string) {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data) {
    return { success: false, error: 'Not authenticated' };
  }

  const userId = userRes.data.user.id;

  if (!await requireActiveCoachmeConsent(userId)) {
    return { success: false, error: 'CoachMe consent required' };
  }

  const session = await prisma.coachMeSession.findFirst({
    where: { id: sessionId, userId },
    select: SESSION_SELECT,
  });

  if (!session) {
    return { success: false, error: 'Session not found' };
  }

  return { success: true, data: session };
}

export async function updateSessionPhase(sessionId: string, data: Record<string, unknown>) {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data) {
    return { success: false, error: 'Not authenticated' };
  }

  const userId = userRes.data.user.id;

  if (!await requireActiveCoachmeConsent(userId)) {
    return { success: false, error: 'CoachMe consent required' };
  }

  const existingSession = await prisma.coachMeSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  });

  if (!existingSession) {
    return { success: false, error: 'Session not found' };
  }

  const parsed = UpdateSessionSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: 'Invalid data', issues: parsed.error.issues };
  }

  // Crisis detection runs on the goal field only (it's checked pre-encryption client-side;
  // we keep a server-side check for the raw value too, which may be ciphertext if encrypted).
  const rawGoal = data.sessionGoal;
  if (typeof rawGoal === 'string' && checkCrisisSignals(rawGoal)) {
    return {
      success: true,
      data: await prisma.coachMeSession.update({
        where: { id: sessionId },
        data: { ...parsed.data, updatedAt: new Date() },
        select: SESSION_SELECT,
      }),
      crisisDetected: true,
    };
  }

  const session = await prisma.coachMeSession.update({
    where: { id: sessionId },
    data: { ...parsed.data, updatedAt: new Date() },
    select: SESSION_SELECT,
  });

  return { success: true, data: session };
}

export async function getSessionHistory(focusTag?: CoachMeFocusTag) {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data) {
    return { success: false, error: 'Not authenticated' };
  }

  const userId = userRes.data.user.id;

  if (!await requireActiveCoachmeConsent(userId)) {
    return { success: false, error: 'CoachMe consent required' };
  }

  const sessions = await prisma.coachMeSession.findMany({
    where: {
      userId,
      completedAt: { not: null },
      ...(focusTag ? { focusTag } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true, createdAt: true, focusTag: true, customFocusTag: true,
      sessionUsefulness: true, actionPlanFinal: true, actionPlanV1: true,
    },
  });

  return { success: true, data: sessions };
}

export async function getActiveSession() {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data) {
    return { success: false, error: 'Not authenticated' };
  }

  const userId = userRes.data.user.id;

  if (!await requireActiveCoachmeConsent(userId)) {
    return { success: false, error: 'CoachMe consent required' };
  }

  const inactiveThreshold = new Date(Date.now() - 30 * DAY_MS);

  const session = await prisma.coachMeSession.findFirst({
    where: { userId, completedAt: null, archivedAt: null, updatedAt: { gte: inactiveThreshold } },
    orderBy: { updatedAt: 'desc' },
    select: SESSION_SELECT,
  });

  return { success: true, data: session };
}

export async function completeSession(sessionId: string) {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data) {
    return { success: false, error: 'Not authenticated' };
  }

  const userId = userRes.data.user.id;

  if (!await requireActiveCoachmeConsent(userId)) {
    return { success: false, error: 'CoachMe consent required' };
  }

  const session = await prisma.coachMeSession.update({
    where: { id: sessionId, userId },
    data: { completedAt: new Date(), currentPhase: 8 },
    select: SESSION_SELECT,
  });

  revalidatePath('/coachme');
  revalidatePath('/coachme/progress');

  return { success: true, data: session };
}

export async function deleteSession(sessionId: string) {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data) {
    return { success: false, error: 'Not authenticated' };
  }

  const userId = userRes.data.user.id;

  if (!await requireActiveCoachmeConsent(userId)) {
    return { success: false, error: 'CoachMe consent required' };
  }

  await prisma.coachMeSession.delete({ where: { id: sessionId, userId } });

  revalidatePath('/coachme');
  revalidatePath('/coachme/progress');

  return { success: true };
}

export async function exportSessionJSON(sessionId: string) {
  const userRes = await getCurrentUser();
  if (!userRes.success || !userRes.data) {
    return { success: false, error: 'Not authenticated' };
  }

  const userId = userRes.data.user.id;

  if (!await requireActiveCoachmeConsent(userId)) {
    return { success: false, error: 'CoachMe consent required' };
  }

  const session = await prisma.coachMeSession.findFirst({
    where: { id: sessionId, userId },
    select: SESSION_SELECT,
  });

  if (!session) {
    return { success: false, error: 'Session not found' };
  }

  const exportData = {
    session_date: session.createdAt.toISOString().split('T')[0],
    topic: session.customFocusTag || session.focusTag,
    why_important: session.whyImportant,
    session_goal: session.sessionGoal,
    session_success_criteria: session.sessionSuccessCriteria,
    success_criteria: {
      a: session.miracleSignsA,
      b: session.miracleSignsB,
      c: session.miracleSignsC,
      optional: session.miracleOptional,
    },
    scaling: {
      current: session.scalingCurrent,
      already_here_score: session.scalingAlreadyHere,
      resources: session.scalingResources,
      recent_moments: session.scalingRecentMoments,
      next_step: session.scalingNextStep,
    },
    action_plan: {
      initial: session.actionPlanV1,
      final: session.actionPlanFinal,
      notes: session.actionOptional,
    },
    closing: {
      session_usefulness: session.sessionUsefulness,
      final_reflections: session.finalReflections,
    },
  };

  return { success: true, data: exportData };
}

export async function getSupportResources(region: string = 'HU') {
  const resources = await prisma.coachMeSupportResource.findMany({
    where: { region, active: true },
    orderBy: { order: 'asc' },
    take: 50,
    select: SUPPORT_RESOURCE_SELECT,
  });

  return { success: true, data: resources };
}

export async function archiveInactiveSessions() {
  const inactiveThreshold = new Date(Date.now() - 30 * DAY_MS);

  const result = await prisma.coachMeSession.updateMany({
    where: { completedAt: null, archivedAt: null, updatedAt: { lt: inactiveThreshold } },
    data: { archivedAt: new Date() },
  });

  return { success: true, archivedCount: result.count };
}
