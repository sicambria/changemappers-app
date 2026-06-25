import prisma, { AccountDeletionReason, type Prisma } from '@/lib/prisma';
import { DAY_MS } from '@/lib/constants';

export const RECENT_ACTIVITY_DAYS = 30;
export const INACTIVITY_DAYS = 180;
export const INACTIVITY_GRACE_DAYS = 30;
export const INACTIVITY_DELETE_AFTER_DAYS = INACTIVITY_DAYS + INACTIVITY_GRACE_DAYS;
export const ACTIVITY_UPDATE_THROTTLE_MS = 12 * 60 * 60 * 1000;

export function daysBefore(date: Date, days: number): Date {
  return new Date(date.getTime() - days * DAY_MS);
}

export function daysAfter(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function isRecentlyActive(lastActiveAt: Date | string | null | undefined, now = new Date()): boolean {
  if (!lastActiveAt) return false;
  const activeAt = lastActiveAt instanceof Date ? lastActiveAt : new Date(lastActiveAt);
  return activeAt.getTime() > now.getTime() - RECENT_ACTIVITY_DAYS * DAY_MS;
}

export function getInactivityDeletionDate(lastActiveAt: Date): Date {
  return daysAfter(lastActiveAt, INACTIVITY_DELETE_AFTER_DAYS);
}

type ActivityClient = Pick<typeof prisma, 'user'>;

type ActivityOptions = {
  login?: boolean;
  now?: Date;
};

export async function markUserActivity(
  userId: string,
  options: ActivityOptions = {},
  client: ActivityClient = prisma,
): Promise<void> {
  const now = options.now ?? new Date();
  const user = await client.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      lastActiveAt: true,
      inactiveAt: true,
      scheduledDeletionReason: true,
      deletedAt: true,
      isSuspended: true,
      isRegistrationPending: true,
    },
  });

  if (!user || user.deletedAt || user.isSuspended || user.isRegistrationPending) return;

  const shouldUpdateActivity =
    options.login === true ||
    user.inactiveAt != null ||
    !user.lastActiveAt ||
    user.lastActiveAt.getTime() <= now.getTime() - ACTIVITY_UPDATE_THROTTLE_MS;

  const data: Prisma.UserUpdateInput = {};
  if (shouldUpdateActivity) data.lastActiveAt = now;
  if (options.login) data.lastLoginAt = now;

  if (user.inactiveAt != null || user.scheduledDeletionReason === AccountDeletionReason.INACTIVITY) {
    data.inactiveAt = null;
    data.inactivityWarning30SentAt = null;
    data.inactivityWarning15SentAt = null;
    data.inactivityWarning3SentAt = null;
    data.inactivityFinalNoticeSentAt = null;
    data.scheduledDeletionAt = null;
    data.scheduledDeletionReason = null;
  }

  if (Object.keys(data).length === 0) return;

  await client.user.update({
    where: { id: userId },
    data,
    select: { id: true },
  });
}
