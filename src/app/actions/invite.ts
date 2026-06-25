'use server';

import { logActionError } from '@/lib/action-logger';
import { localizeActionMessage, localizeActionZodError } from '@/lib/action-result-i18n';
import { z } from 'zod';
import prisma, { InviteStatus, ProfileType } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { createAuditLog } from '@/lib/audit';
import { rateLimitAsync } from '@/lib/rate-limit';
import {
  generateInviteCode,
  calculateAvailableSlots,
  getWeekExpirationDate,
  getNextSlotDate,
} from '@/lib/invite-utils';
import { sendInviteEmail } from '@/lib/email';
import { getLocale } from '@/lib/get-locale';

const sendInviteSchema = z.object({
  recipientEmail: z.email('common.invalidEmail'),
});

export async function generateInviteCodeAction(): Promise<
	{ success: boolean; data?: { code: string; id: string }; error?: string }
> {
	try {
		const auth = await getCurrentUser();
		if (!auth.success) {
			return { success: false, error: await localizeActionMessage('common.loginRequired') };
		}

	const availableSlots = await calculateAvailableSlots(auth.data.id);
	if (availableSlots <= 0) {
		return { success: false, error: await localizeActionMessage('invite.noSlots') };
	}

	const code = generateInviteCode(auth.data.profileType as ProfileType);
	const expiresAt = getWeekExpirationDate();

	const invite = await prisma.invite.create({
		data: {
			code,
			createdById: auth.data.id,
			expiresAt,
			status: InviteStatus.CREATED,
		},
	});

	await createAuditLog({
		userId: auth.data.id,
		action: 'INVITE_CREATED',
		entityType: 'Invite',
		entityId: invite.id,
		newState: { code, expiresAt: expiresAt.toISOString() },
	});

	return { success: true, data: { code: invite.code, id: invite.id } };
	} catch (error) {
		logActionError('Generate invite error', error);
		return { success: false, error: await localizeActionMessage('invite.createFailed') };
	}
}

export async function sendInviteEmailAction(
	inviteId: string,
	recipientEmail: string
): Promise<{ success: boolean; error?: string }> {
	try {
	const auth = await getCurrentUser();
	if (!auth.success) {
		return { success: false, error: await localizeActionMessage('common.loginRequired') };
	}

	const rl = await rateLimitAsync(`invite_send_${auth.data.id}`, 10, 3600000);
    if (!rl.success) {
      return { success: false, error: await localizeActionMessage('invite.rateLimited') };
    }

    const validated = sendInviteSchema.parse({ recipientEmail });

    const invite = await prisma.invite.findUnique({
      where: { id: inviteId },
      select: { id: true, code: true, createdById: true, status: true, resendCount: true },
    });

	if (!invite || invite.createdById !== auth.data.id) {
		return { success: false, error: await localizeActionMessage('invite.notFound') };
	}

	if (invite.status !== InviteStatus.CREATED && invite.status !== InviteStatus.SENT) {
		return { success: false, error: await localizeActionMessage('invite.cannotSend') };
	}

	if (invite.resendCount >= 3) {
		return { success: false, error: await localizeActionMessage('invite.resendLimit') };
	}

	const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // SAFE:
	const inviteUrl = `${appUrl}/invite/${invite.code}`;

	const lang = await getLocale();
	await sendInviteEmail(validated.recipientEmail, auth.data.name || await localizeActionMessage('user.defaultName'), invite.code, inviteUrl, { language: lang });

	await prisma.invite.update({
		where: { id: invite.id },
		data: {
			recipientEmail: validated.recipientEmail,
			status: InviteStatus.SENT,
			sentAt: new Date(),
			lastActivityAt: new Date(),
			resendCount: { increment: 1 },
		},
	});

	await createAuditLog({
		userId: auth.data.id,
		action: 'INVITE_SENT',
		entityType: 'Invite',
		entityId: invite.id,
		newState: { recipientEmail: validated.recipientEmail },
	});

	return { success: true };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { success: false, error: await localizeActionZodError(error, 'common.invalidData') };
		}
		logActionError('Send invite error', error);
		return { success: false, error: await localizeActionMessage('invite.sendFailed') };
	}
}

export async function getMyInvitesAction(): Promise<{
	success: boolean;
	data?: Array<{
		id: string;
		code: string;
		recipientEmail: string | null;
		status: InviteStatus;
		createdAt: Date;
		expiresAt: Date;
		sentAt: Date | null;
		openedAt: Date | null;
		acceptedAt: Date | null;
	}>;
	error?: string;
}> {
	try {
	const auth = await getCurrentUser();
	if (!auth.success) {
		return { success: false, error: await localizeActionMessage('common.loginRequired') };
	}

  const invites = await prisma.invite.findMany({
    where: { createdById: auth.data.id },
    select: {
      id: true,
      code: true,
      recipientEmail: true,
      status: true,
      createdAt: true,
      expiresAt: true,
      sentAt: true,
      openedAt: true,
      acceptedAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

    return { success: true, data: invites };
  } catch (error) {
    logActionError('Get my invites error', error);
    return { success: false, error: await localizeActionMessage('invite.fetchFailed') };
  }
}

export async function getInviteStatsAction(): Promise<{
	success: boolean;
	data?: {
		availableSlots: number;
		totalSlots: number;
		nextSlotDate: Date | null;
		activeInvites: number;
		acceptedInvites: number;
	};
	error?: string;
}> {
	try {
	const auth = await getCurrentUser();
	if (!auth.success) {
		return { success: false, error: await localizeActionMessage('common.loginRequired') };
	}

	const userData = await prisma.user.findUnique({
		where: { id: auth.data.id },
		select: { inviteSlotsTotal: true, lastInviteSlotGranted: true },
	});

	if (!userData) {
		return { success: false, error: await localizeActionMessage('user.notFound') };
	}

	const availableSlots = await calculateAvailableSlots(auth.data.id);
	const activeInvites = await prisma.invite.count({
		where: {
			createdById: auth.data.id,
			status: { in: [InviteStatus.CREATED, InviteStatus.SENT, InviteStatus.OPENED] },
		},
	});
	const acceptedInvites = await prisma.invite.count({
		where: {
			createdById: auth.data.id,
			status: InviteStatus.ACCEPTED,
		},
	});

	const nextSlotDate =
		userData.inviteSlotsTotal >= 2 ? null : getNextSlotDate(userData.lastInviteSlotGranted);

	return {
		success: true,
		data: {
			availableSlots,
			totalSlots: userData.inviteSlotsTotal,
			nextSlotDate,
			activeInvites,
			acceptedInvites,
		},
	};
	} catch (error) {
		logActionError('Get invite stats error', error);
		return { success: false, error: await localizeActionMessage('invite.statsFetchFailed') };
	}
}

export async function validateInviteCodeAction(
  code: string
): Promise<{
  success: boolean;
  data?: {
    valid: boolean;
    inviterName?: string;
    inviteId?: string;
  };
  error?: string;
}> {
  try {
    const invite = await prisma.invite.findUnique({
      where: { code },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        createdBy: { select: { name: true } },
      },
    });

    if (!invite) {
      return { success: true, data: { valid: false } };
    }

    if (invite.status !== InviteStatus.CREATED && invite.status !== InviteStatus.SENT) {
      return { success: true, data: { valid: false } };
    }

    if (invite.expiresAt < new Date()) {
      return { success: true, data: { valid: false } };
    }

    return {
      success: true,
      data: {
        valid: true,
        inviterName: invite.createdBy.name,
        inviteId: invite.id,
      },
    };
  } catch (error) {
    logActionError('Validate invite error', error);
    return { success: false, error: await localizeActionMessage('invite.validationFailed') };
  }
}

export async function markInviteOpenedAction(
  code: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const invite = await prisma.invite.findUnique({
      where: { code },
      select: { id: true, status: true },
    });

    if (!invite) {
      return { success: false, error: await localizeActionMessage('invite.notFound') };
    }

    if (invite.status === InviteStatus.SENT) {
      await prisma.invite.update({
        where: { id: invite.id },
        data: {
          status: InviteStatus.OPENED,
          openedAt: new Date(),
          lastActivityAt: new Date(),
        },
      });

      await createAuditLog({
        action: 'INVITE_OPENED',
        entityType: 'Invite',
        entityId: invite.id,
      });
    }

    return { success: true };
  } catch (error) {
    logActionError('Mark invite opened error', error);
    return { success: false, error: await localizeActionMessage('invite.openFailed') };
  }
}

export async function acceptInviteAction(
  inviteId: string,
  recipientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const invite = await prisma.invite.findUnique({
      where: { id: inviteId },
      select: { id: true, status: true, expiresAt: true, createdById: true },
    });

    if (!invite) {
      return { success: false, error: await localizeActionMessage('invite.notFound') };
    }

    if (invite.status !== InviteStatus.CREATED && invite.status !== InviteStatus.SENT && invite.status !== InviteStatus.OPENED) {
      return { success: false, error: await localizeActionMessage('invite.noLongerUsable') };
    }

    if (invite.expiresAt < new Date()) {
      return { success: false, error: await localizeActionMessage('invite.expired') };
    }

    await prisma.invite.update({
      where: { id: inviteId },
      data: {
        status: InviteStatus.ACCEPTED,
        recipientId,
        acceptedAt: new Date(),
        lastActivityAt: new Date(),
      },
    });

    await createAuditLog({
      userId: recipientId,
      action: 'INVITE_ACCEPTED',
      entityType: 'Invite',
      entityId: inviteId,
      newState: { createdById: invite.createdById },
    });

    return { success: true };
  } catch (error) {
    logActionError('Accept invite error', error);
    return { success: false, error: await localizeActionMessage('invite.acceptFailed') };
  }
}
