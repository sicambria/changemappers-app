import crypto from 'node:crypto';
import prisma, { InviteStatus, PendingRegistrationMode } from '@/lib/prisma';
import { sendLeanRegistrationReminderEmail, sendLeanVerificationEmail } from '@/lib/email';
import { buildAbsoluteUrl } from '@/lib/site-url';
import { DAY_MS } from '@/lib/constants';
import { hashRefreshToken } from '@/lib/auth';
import { appendLanguageParam, resolveAuthLanguage } from '@/lib/auth-localization';

export { PENDING_REGISTRATION_NAME } from '@/lib/registration-completion';
export const PENDING_REGISTRATION_REMINDER_AFTER_DAYS = 4;
export const PENDING_REGISTRATION_DELETE_AFTER_DAYS = 7;
const VERIFICATION_TOKEN_TTL_MS = DAY_MS;

type SendPendingRegistrationContinueEmailOptions = { reminder: boolean; now?: Date; language?: string | null };
const DEFAULT_SEND_PENDING_CONTINUE_OPTIONS: SendPendingRegistrationContinueEmailOptions = { reminder: false };

export type PendingRegistrationMaintenanceResult = {
  remindedCount: number;
  deletedCount: number;
  releasedInviteCount: number;
};

export function getPendingRegistrationCutoffs(now = new Date()) {
  return {
    reminderCutoff: daysBefore(now, PENDING_REGISTRATION_REMINDER_AFTER_DAYS),
    deleteCutoff: daysBefore(now, PENDING_REGISTRATION_DELETE_AFTER_DAYS),
  };
}

function daysBefore(now: Date, days: number) {
  return new Date(now.getTime() - days * DAY_MS);
}

function buildPendingRegistrationVerificationUrl(token: string, mode: PendingRegistrationMode | null | undefined, language?: string | null) {
  const path = mode === PendingRegistrationMode.FULL ? '/api/register/full/verify' : '/api/register/verify';
  return appendLanguageParam(buildAbsoluteUrl(`${path}?token=${token}`), language);
}

async function issuePendingRegistrationToken(userId: string, now: Date) {
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationToken: hashRefreshToken(token),
      verificationTokenExpiry: new Date(now.getTime() + VERIFICATION_TOKEN_TTL_MS),
    },
    select: { id: true },
  });
  return token;
}

export async function sendPendingRegistrationContinueEmail(
  user: { id: string; email: string; createdAt?: Date; uiLanguage?: string | null; pendingRegistrationMode?: PendingRegistrationMode | null },
  options: SendPendingRegistrationContinueEmailOptions = DEFAULT_SEND_PENDING_CONTINUE_OPTIONS
): Promise<void> {
  const now = options.now ?? new Date();
  const token = await issuePendingRegistrationToken(user.id, now);
  const language = resolveAuthLanguage(options.language ?? user.uiLanguage);
  const continueUrl = buildPendingRegistrationVerificationUrl(token, user.pendingRegistrationMode, language);

  if (options.reminder) {
    const deletionDate = user.createdAt
      ? new Date(user.createdAt.getTime() + PENDING_REGISTRATION_DELETE_AFTER_DAYS * DAY_MS)
      : undefined;
    await sendLeanRegistrationReminderEmail(user.email, continueUrl, deletionDate, language);
    await prisma.user.update({
      where: { id: user.id },
      data: { pendingRegistrationReminderSentAt: now },
      select: { id: true },
    });
    return;
  }

  await sendLeanVerificationEmail(user.email, continueUrl, language);
}

export async function deleteAbandonedPendingRegistrations(now = new Date()): Promise<{
  deletedCount: number;
  releasedInviteCount: number;
}> {
  const { deleteCutoff } = getPendingRegistrationCutoffs(now);
  const users = await prisma.user.findMany({
    where: {
      isRegistrationPending: true,
      createdAt: { lte: deleteCutoff },
    },
    select: { id: true },
  });

  if (users.length === 0) {
    return { deletedCount: 0, releasedInviteCount: 0 };
  }

  const userIds = users.map((user) => user.id);

  const releasedInvites = await prisma.invite.updateMany({
    where: { recipientId: { in: userIds } },
    data: {
      recipientId: null,
      status: InviteStatus.SENT,
      acceptedAt: null,
      lastActivityAt: now,
    },
  });

  const deleted = await prisma.user.deleteMany({
    where: {
      id: { in: userIds },
      isRegistrationPending: true,
    },
  });

  return { deletedCount: deleted.count, releasedInviteCount: releasedInvites.count };
}

export async function sendPendingRegistrationReminders(now = new Date()): Promise<{ remindedCount: number }> {
  const { reminderCutoff, deleteCutoff } = getPendingRegistrationCutoffs(now);
  const users = await prisma.user.findMany({
    where: {
      isRegistrationPending: true,
      createdAt: { lte: reminderCutoff, gt: deleteCutoff },
      pendingRegistrationReminderSentAt: null,
    },
    select: { id: true, email: true, createdAt: true, uiLanguage: true, pendingRegistrationMode: true },
    orderBy: { createdAt: 'asc' },
    take: 100,
  });

  let remindedCount = 0;
  for (const user of users) {
    await sendPendingRegistrationContinueEmail(user, { reminder: true, now });
    remindedCount += 1;
  }

  return { remindedCount };
}

export async function runPendingRegistrationMaintenance(now = new Date()): Promise<PendingRegistrationMaintenanceResult> {
  const reminderResult = await sendPendingRegistrationReminders(now);
  const deletionResult = await deleteAbandonedPendingRegistrations(now);

  return {
    remindedCount: reminderResult.remindedCount,
    deletedCount: deletionResult.deletedCount,
    releasedInviteCount: deletionResult.releasedInviteCount,
  };
}

export function isPendingRegistrationDeletable(createdAt: Date, now = new Date()) {
  return createdAt <= getPendingRegistrationCutoffs(now).deleteCutoff;
}
