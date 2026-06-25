import { nanoid } from 'nanoid';
import prisma, { ProfileType, InviteStatus } from './prisma';

export function generateInviteCode(profileType: ProfileType): string {
  const prefix = profileType === 'CHANGEMAPPER' ? 'CM' : 'CO';
  const code = nanoid(10);
  return `${prefix}-${code}`;
}

export async function calculateAvailableSlots(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { inviteSlotsTotal: true },
  });
  if (!user) return 0;

  const activeInvites = await prisma.invite.count({
    where: {
      createdById: userId,
      status: { in: [InviteStatus.CREATED, InviteStatus.SENT, InviteStatus.OPENED] },
    },
  });

  return Math.max(0, user.inviteSlotsTotal - activeInvites);
}

export async function grantWeeklyInviteSlots(): Promise<void> {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();

  if (dayOfWeek !== 1) return;

  // Reset everyone to exactly 1 slot — unused slots from prior weeks are lost (non-accumulating)
  await prisma.user.updateMany({
    data: {
      inviteSlotsTotal: 1,
      lastInviteSlotGranted: now,
    },
  });
}

export async function expireOldInvites(): Promise<void> {
  const now = new Date();

  await prisma.invite.updateMany({
    where: {
      status: { in: [InviteStatus.CREATED, InviteStatus.SENT, InviteStatus.OPENED] },
      expiresAt: { lt: now },
    },
    data: { 
      status: InviteStatus.EXPIRED,
      recipientEmail: null,
    },
  });
}

export function getNextSlotDate(lastInviteSlotGranted: Date | null): Date | null {
  const now = new Date();
  const lastGranted = lastInviteSlotGranted || now;

  const nextMonday = new Date(lastGranted);
  const daysUntilMonday = (8 - nextMonday.getUTCDay()) % 7 || 7;
  nextMonday.setUTCDate(nextMonday.getUTCDate() + daysUntilMonday);
  nextMonday.setUTCHours(0, 0, 0, 0);

  return nextMonday;
}

export function getWeekExpirationDate(): Date {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setUTCDate(expiresAt.getUTCDate() + 7);
  return expiresAt;
}
