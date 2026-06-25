'use server';

import { logActionError } from '@/lib/action-logger';
import { localizeActionMessage, localizeActionZodError } from '@/lib/action-result-i18n';
import { z } from 'zod';
import prisma, { InviteStatus, ProfileType } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { createAuditLog } from '@/lib/audit';
import { sendInviteEmail } from '@/lib/email';
import { getLocale } from '@/lib/get-locale';
import { generateInviteCode, getWeekExpirationDate } from '@/lib/invite-utils';

const revokeSchema = z.object({
  inviteId: z.string(),
  reason: z.string().min(3, 'admin.invite.validation.reasonMin').max(500),
});

const resendSchema = z.object({
  inviteId: z.string(),
});

const directInviteSchema = z.object({
  emails: z.array(z.email('common.invalidEmail')).min(1, 'admin.invite.validation.emailRequired').max(50, 'admin.invite.validation.emailMax'),
  profileType: z.enum(ProfileType),
  subject: z.string().trim().min(3, 'admin.invite.validation.subjectMin').max(140, 'admin.invite.validation.subjectMax').refine((value) => !/[\r\n]/.test(value), 'admin.invite.validation.subjectNoNewlines'),
  comment: z.string().trim().max(1200, 'admin.invite.validation.commentMax').optional(),
});

type ExistingUserEmailRow = { email: string };
type ExistingInviteEmailRow = { recipientEmail: string | null };

export async function adminCreateDirectInvitesAction(
  data: z.infer<typeof directInviteSchema>
): Promise<{
  success: boolean;
  data?: { created: number; skipped: string[] };
  error?: string;
}> {
  try {
    const auth = await getCurrentUser();
    if (!auth.success || !auth.data.isAdmin) {
      return { success: false, error: await localizeActionMessage('common.adminRequired') };
    }

    const lang = await getLocale();
    const validated = directInviteSchema.parse(data);
    const normalizedEmails = Array.from(new Set(validated.emails.map((email) => email.trim().toLowerCase())));

    const existingUsers: ExistingUserEmailRow[] = await prisma.user.findMany({
      where: { email: { in: normalizedEmails } },
      select: { email: true },
      take: normalizedEmails.length,
    });
    const existingUserEmails = new Set(existingUsers.map((user) => user.email.toLowerCase()));

    const existingInvites: ExistingInviteEmailRow[] = await prisma.invite.findMany({
      where: {
        recipientEmail: { in: normalizedEmails },
        status: { in: [InviteStatus.CREATED, InviteStatus.SENT, InviteStatus.OPENED] },
        expiresAt: { gt: new Date() },
      },
      select: { recipientEmail: true },
      take: normalizedEmails.length,
    });
    const existingInviteEmails = new Set(
      existingInvites
        .map((invite) => invite.recipientEmail?.toLowerCase())
        .filter(Boolean)
    );

    const skipped = normalizedEmails.filter(
      (email) => existingUserEmails.has(email) || existingInviteEmails.has(email)
    );
    const emailsToInvite = normalizedEmails.filter((email) => !skipped.includes(email));

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // SAFE:
    const expiresAt = getWeekExpirationDate();
    let created = 0;

    for (const email of emailsToInvite) {
      const code = generateInviteCode(validated.profileType);
      const invite = await prisma.invite.create({
        data: {
          code,
          createdById: auth.data.id,
          recipientEmail: email,
          status: InviteStatus.SENT,
          isDirect: true,
          profileType: validated.profileType,
          emailSubject: validated.subject,
          notes: validated.comment || null,
          sentAt: new Date(),
          expiresAt,
          resendCount: 1,
        },
        select: { id: true, code: true, recipientEmail: true },
      });

      await sendInviteEmail(email, auth.data.name || 'Admin', invite.code, `${appUrl}/invite/${invite.code}`, {
        subject: validated.subject,
        comment: validated.comment,
        language: lang,
      });

      await createAuditLog({
        userId: auth.data.id,
        action: 'INVITE_SENT',
        entityType: 'Invite',
        entityId: invite.id,
        newState: {
          directInvite: true,
          recipientEmail: invite.recipientEmail,
          profileType: validated.profileType,
        },
      });
      created += 1;
    }

    return { success: true, data: { created, skipped } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: await localizeActionZodError(error, 'common.invalidData') };
    }
    logActionError('Admin create direct invites error', error);
    return { success: false, error: await localizeActionMessage('admin.invite.directCreateFailed') };
  }
}

export async function adminGetAllInvitesAction(filters?: {
  status?: InviteStatus[];
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  data?: {
    invites: Array<{
      id: string;
      code: string;
      status: InviteStatus;
      createdAt: Date;
      expiresAt: Date;
      recipientEmail: string | null;
      sentAt: Date | null;
      openedAt: Date | null;
      acceptedAt: Date | null;
      lastActivityAt: Date;
      resendCount: number;
      createdBy: { id: string; name: string; email: string };
      recipient: { id: string; name: string; email: string } | null;
      isDirect: boolean;
      profileType: ProfileType | null;
      emailSubject: string | null;
      notes: string | null;
    }>;
    total: number;
    page: number;
    totalPages: number;
  };
	error?: string;
}> {
	try {
	const auth = await getCurrentUser();
	if (!auth.success || !auth.data.isAdmin) {
		return { success: false, error: await localizeActionMessage('common.adminRequired') };
	}

	const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(filters?.status?.length
        ? { status: { in: filters.status } }
        : {}),
      ...(filters?.search
        ? {
            OR: [
              { code: { contains: filters.search, mode: 'insensitive' as const } },
              { recipientEmail: { contains: filters.search, mode: 'insensitive' as const } },
              { createdBy: { name: { contains: filters.search, mode: 'insensitive' as const } } },
              { createdBy: { email: { contains: filters.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [invites, total] = await Promise.all([
      prisma.invite.findMany({
        where,
        select: {
          id: true,
          code: true,
          status: true,
          createdAt: true,
          expiresAt: true,
          recipientEmail: true,
          sentAt: true,
          openedAt: true,
          acceptedAt: true,
          lastActivityAt: true,
          resendCount: true,
          isDirect: true,
          profileType: true,
          emailSubject: true,
          notes: true,
          createdBy: { select: { id: true, name: true, email: true } },
          recipient: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invite.count({ where }),
    ]);

    return {
      success: true,
      data: {
        invites,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logActionError('Admin get invites error', error);
    return { success: false, error: await localizeActionMessage('invite.fetchFailed') };
  }
}

export async function adminRevokeInviteAction(
	data: z.infer<typeof revokeSchema>
): Promise<{ success: boolean; error?: string }> {
	try {
	const auth = await getCurrentUser();
	if (!auth.success || !auth.data.isAdmin) {
		return { success: false, error: await localizeActionMessage('common.adminRequired') };
	}

	const validated = revokeSchema.parse(data);

	const invite = await prisma.invite.findUnique({
		where: { id: validated.inviteId },
		select: { id: true, createdById: true, status: true, code: true },
	});

	if (!invite) {
		return { success: false, error: await localizeActionMessage('invite.notFound') };
	}

	if (invite.status === InviteStatus.ACCEPTED) {
		return { success: false, error: await localizeActionMessage('admin.invite.acceptedCannotRevoke') };
	}

	if (invite.status === InviteStatus.REVOKED || invite.status === InviteStatus.EXPIRED) {
		return { success: false, error: await localizeActionMessage('admin.invite.noLongerActive') };
	}

	await prisma.$transaction([
		prisma.invite.update({
			where: { id: validated.inviteId },
			data: {
				status: InviteStatus.REVOKED,
				revokedAt: new Date(),
				revokedById: auth.data.id,
				revokeReason: validated.reason,
				lastActivityAt: new Date(),
			},
		}),
		prisma.user.update({
			where: { id: invite.createdById },
			data: { inviteSlotsTotal: { increment: 1 } },
		}),
	]);

	await createAuditLog({
		userId: auth.data.id,
		action: 'INVITE_REVOKED',
		entityType: 'Invite',
		entityId: validated.inviteId,
		newState: { reason: validated.reason, code: invite.code },
	});

	return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: await localizeActionZodError(error, 'common.invalidData') };
    }
    logActionError('Admin revoke invite error', error);
    return { success: false, error: await localizeActionMessage('admin.invite.revokeFailed') };
  }
}

export async function adminResendInviteAction(
	data: z.infer<typeof resendSchema>
): Promise<{ success: boolean; error?: string }> {
	try {
	const auth = await getCurrentUser();
	if (!auth.success || !auth.data.isAdmin) {
		return { success: false, error: await localizeActionMessage('common.adminRequired') };
	}

	const validated = resendSchema.parse(data);

	const invite = await prisma.invite.findUnique({
		where: { id: validated.inviteId },
		select: {
			id: true,
			code: true,
			recipientEmail: true,
			resendCount: true,
			status: true,
			createdBy: { select: { id: true, name: true } },
			emailSubject: true,
			notes: true,
		},
	});

	if (!invite) {
		return { success: false, error: await localizeActionMessage('invite.notFound') };
	}

	if (invite.status !== InviteStatus.SENT && invite.status !== InviteStatus.OPENED) {
		return { success: false, error: await localizeActionMessage('admin.invite.cannotResend') };
	}

	if (invite.resendCount >= 3) {
		return { success: false, error: await localizeActionMessage('invite.resendLimit') };
	}

	if (!invite.recipientEmail) {
		return { success: false, error: await localizeActionMessage('admin.invite.noRecipient') };
	}

	const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // SAFE:
	const inviteUrl = `${appUrl}/invite/${invite.code}`;

	const lang = await getLocale();
	await sendInviteEmail(invite.recipientEmail, invite.createdBy.name, invite.code, inviteUrl, {
		 subject: invite.emailSubject ?? undefined,
		 comment: invite.notes ?? undefined,
		language: lang,
	});

	await prisma.invite.update({
		where: { id: invite.id },
		data: {
			resendCount: { increment: 1 },
			lastActivityAt: new Date(),
		},
	});

	await createAuditLog({
		userId: auth.data.id,
		action: 'INVITE_SENT',
		entityType: 'Invite',
		entityId: invite.id,
		newState: { adminResend: true, recipientEmail: invite.recipientEmail },
	});

	return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: await localizeActionZodError(error, 'common.invalidData') };
    }
    logActionError('Admin resend invite error', error);
    return { success: false, error: await localizeActionMessage('admin.invite.resendFailed') };
  }
}

export async function adminGetInviteStatsAction(): Promise<{
  success: boolean;
  data?: {
    total: number;
    byStatus: Record<InviteStatus, number>;
    acceptedThisWeek: number;
    createdThisWeek: number;
  };
	error?: string;
}> {
	try {
	const auth = await getCurrentUser();
	if (!auth.success || !auth.data.isAdmin) {
		return { success: false, error: await localizeActionMessage('common.adminRequired') };
	}

	const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [total, byStatus, acceptedThisWeek, createdThisWeek] = await Promise.all([
      prisma.invite.count(),
      prisma.invite.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.invite.count({
        where: {
          status: InviteStatus.ACCEPTED,
          acceptedAt: { gte: weekAgo },
        },
      }),
      prisma.invite.count({
        where: {
          createdAt: { gte: weekAgo },
        },
      }),
    ]);

    const statusCounts: Record<InviteStatus, number> = {
      [InviteStatus.CREATED]: 0,
      [InviteStatus.SENT]: 0,
      [InviteStatus.OPENED]: 0,
      [InviteStatus.ACCEPTED]: 0,
      [InviteStatus.EXPIRED]: 0,
      [InviteStatus.REVOKED]: 0,
    };

    for (const item of byStatus) {
      statusCounts[item.status] = item._count;
    }

    return {
      success: true,
      data: {
        total,
        byStatus: statusCounts,
        acceptedThisWeek,
        createdThisWeek,
      },
    };
  } catch (error) {
    logActionError('Admin get invite stats error', error);
    return { success: false, error: await localizeActionMessage('invite.statsFetchFailed') };
  }
}
