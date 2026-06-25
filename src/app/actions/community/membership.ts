'use server';

// Community membership and join-request actions.
import { logActionError } from '@/lib/action-logger';
import { localizeActionMessage, localizeActionZodError } from '@/lib/action-result-i18n';
import { z } from 'zod';
import prisma, { AuditAction, CommunityRole } from '@/lib/prisma';
import { getCurrentUser } from '@/app/actions/auth';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/lib/audit';
import { canEditCommunity, canModerateCommunity } from '@/lib/permissions';
import type { ApiResponse } from '@/types/common';
import { updateCommunityMemberRoleSchema } from '@/lib/community-contracts';

/**
 * Join community request (Send connection to owner)
 */
export async function requestJoinCommunityAction(
    userId: string,
    communityId: string,
    message?: string
): Promise<ApiResponse<null>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || currentUser.data?.user?.id !== userId) {
            return { success: false, error: await localizeActionMessage('common.loginRequired') };
        }

const community = await prisma.community.findUnique({
		where: { id: communityId },
		select: { id: true, name: true, ownerId: true }
	});

        if (!community) return { success: false, error: await localizeActionMessage('community.notFound') };

        // Check if already member or pending
const existingMember = await prisma.communityMember.findUnique({
		where: { communityId_userId: { communityId, userId } },
		select: { id: true, status: true }
	});

        if (existingMember) {
            if (existingMember.status === 'PENDING') return { success: false, error: await localizeActionMessage('community.join.alreadyRequested') };
            if (existingMember.status === 'BANNED') return { success: false, error: await localizeActionMessage('community.join.banned') };
            return { success: false, error: await localizeActionMessage('community.join.alreadyMember') };
        }

        // Create membership request (PENDING status)
        await prisma.communityMember.create({
            data: {
                communityId,
                userId,
                role: 'MEMBER',
                status: 'PENDING'
            }
        });

        await createAuditLog({
            userId,
            action: AuditAction.MEMBERSHIP_JOIN,
            entityType: 'Community',
            entityId: communityId,
            metadata: { hasMessage: Boolean(message) }
        });

        return { success: true, data: null, message: await localizeActionMessage('community.join.requestSent') };
    } catch (error) {
        logActionError('Join request error', error);
        return { success: false, error: await localizeActionMessage('community.join.requestFailed') };
    }
}

/**
 * Leave community
 */
export async function leaveCommunityAction(
    userId: string,
    communityId: string
): Promise<ApiResponse<null>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || currentUser.data?.user?.id !== userId) {
            return { success: false, error: await localizeActionMessage('common.loginRequired') };
        }

        // Check if owner
const member = await prisma.communityMember.findUnique({
		where: { communityId_userId: { communityId, userId } },
		select: { id: true, role: true, status: true }
	});

        if (!member) return { success: false, error: await localizeActionMessage('community.leave.notMember') };

        if (member.role === 'OWNER') {
            return { success: false, error: await localizeActionMessage('community.leave.ownerCannotLeave') };
        }

        await prisma.communityMember.delete({
            where: {
                communityId_userId: { communityId, userId }
            }
        });

        await createAuditLog({
            userId,
            action: AuditAction.MEMBERSHIP_LEAVE,
            entityType: 'Community',
            entityId: communityId
        });

        revalidatePath(`/communities/${communityId}`);
        return { success: true, data: null, message: await localizeActionMessage('community.leave.success') };
    } catch {
        return { success: false, error: await localizeActionMessage('community.leave.failed') };
    }
}

/**
 * Get pending join requests for a community
 */
export async function getCommunityJoinRequestsAction(
    communityId: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<ApiResponse<any[]>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || !currentUser.data) {
            return { success: false, error: await localizeActionMessage('common.loginRequired') };
        }
const community = await prisma.community.findUnique({
		where: { id: communityId },
		select: { id: true, name: true, ownerId: true }
	});

        if (!community) return { success: false, error: await localizeActionMessage('community.notFound') };

        if (!(await canModerateCommunity(currentUser.data.user, communityId))) {
            return { success: false, error: await localizeActionMessage('common.forbidden') };
        }

  const requests = await prisma.communityMember.findMany({
    where: {
      communityId,
      status: 'PENDING'
    },
    select: {
      id: true,
      userId: true,
      role: true,
      status: true,
      joinedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          profilePhoto: true,
          email: true
        }
      }
    },
    orderBy: { joinedAt: 'desc' },
    take: 50,
  });

        return { success: true, data: requests };
    } catch (error) {
        logActionError('Get join requests error', error);
        return { success: false, error: await localizeActionMessage('community.join.requestsFetchFailed') };
    }
}

/**
 * Respond to join request
 */
export async function respondToJoinRequestAction(
    communityId: string,
    targetUserId: string,
    action: 'ACCEPT' | 'REJECT'
): Promise<ApiResponse<null>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || !currentUser.data) {
            return { success: false, error: await localizeActionMessage('common.loginRequired') };
        }
const community = await prisma.community.findUnique({
		where: { id: communityId },
		select: { id: true, name: true, ownerId: true }
	});

        if (!community) return { success: false, error: await localizeActionMessage('community.notFound') };

        if (!(await canModerateCommunity(currentUser.data.user, communityId))) {
            return { success: false, error: await localizeActionMessage('common.forbidden') };
        }

const member = await prisma.communityMember.findUnique({
		where: { communityId_userId: { communityId, userId: targetUserId } },
		select: { id: true, status: true }
	});

        if (member?.status !== 'PENDING') {
            return { success: false, error: await localizeActionMessage('community.join.requestNotFoundOrProcessed') };
        }

        if (action === 'ACCEPT') {
            await prisma.communityMember.update({
                where: { communityId_userId: { communityId, userId: targetUserId } },
                data: { status: 'ACTIVE' }
            });
        } else {
            await prisma.communityMember.update({
                where: { communityId_userId: { communityId, userId: targetUserId } },
                data: { status: 'REJECTED' }
            });
        }

        await createAuditLog({
            userId: currentUser.data.user.id, // The admin/owner who performed the action
            action: AuditAction.UPDATE, // or MEMBERSHIP_UPDATE if available, strict schema says UPDATE or we reuse MEMBERSHIP_JOIN? Let's use UPDATE for now or add enum. Schema has MEMBERSHIP_JOIN/LEAVE.
            // Wait, schema has MEMBERSHIP_JOIN, MEMBERSHIP_LEAVE. No explicit STATUS_CHANGE.
            // Let's use UPDATE and set metadata.
            entityType: 'CommunityMember',
            entityId: `${communityId}_${targetUserId}`,
            newState: { status: action === 'ACCEPT' ? 'ACTIVE' : 'REJECTED' },
            metadata: { targetUserId, action }
        });

        revalidatePath(`/communities/${communityId}`);
        return { success: true, data: null, message: action === 'ACCEPT' ? await localizeActionMessage('community.join.accepted') : await localizeActionMessage('community.join.rejected') };
    } catch (error) {
        logActionError('Respond to request error', error);
        return { success: false, error: await localizeActionMessage('common.operationFailed') };
    }
}

export async function updateCommunityMemberRoleAction(
  communityId: string,
  targetUserId: string,
  role: CommunityRole
): Promise<ApiResponse<null>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: await localizeActionMessage('common.loginRequired') };
    }

    const validated = updateCommunityMemberRoleSchema.parse({ communityId, targetUserId, role });
    if (validated.role === CommunityRole.OWNER) {
      return { success: false, error: await localizeActionMessage('common.forbidden') };
    }

    if (!(await canEditCommunity(currentUser.data.user, validated.communityId))) {
      return { success: false, error: await localizeActionMessage('common.forbidden') };
    }

    const member = await prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId: validated.communityId, userId: validated.targetUserId } },
      select: { id: true, role: true, status: true },
    });

    if (member?.status !== 'ACTIVE' || member.role === CommunityRole.OWNER) {
      return { success: false, error: await localizeActionMessage('common.forbidden') };
    }

    await prisma.communityMember.update({
      where: { communityId_userId: { communityId: validated.communityId, userId: validated.targetUserId } },
      data: { role: validated.role },
    });

    await createAuditLog({
      userId: currentUser.data.user.id,
      action: AuditAction.UPDATE,
      entityType: 'CommunityMember',
      entityId: `${validated.communityId}_${validated.targetUserId}`,
      previousState: { role: member.role },
      newState: { role: validated.role },
    });

    revalidatePath(`/communities/${validated.communityId}`);
    return { success: true, data: null, message: await localizeActionMessage('community.updated') };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: await localizeActionZodError(error, 'common.invalidData') };
    }
    logActionError('Update community member role error', error);
    return { success: false, error: await localizeActionMessage('common.updateFailed') };
  }
}
