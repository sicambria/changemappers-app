'use server';

import { logActionError } from '@/lib/action-logger';
import { localizeActionMessage } from '@/lib/action-result-i18n';
import { z } from 'zod';
import prisma, { ConnectionStatus, ConnectionType } from '@/lib/prisma';
import { getCurrentUser } from '@/app/actions/auth';
import { revalidatePath } from 'next/cache';
import { createNotificationRecord } from '@/lib/notifications';
import { rateLimitAsync } from '@/lib/rate-limit';
import { getConnectableMemberWhereInput } from '@/lib/public-member-eligibility';
import { isRecentlyActive } from '@/lib/user-activity';
import { ensureForwardReciprocityPrompt } from '@/app/actions/forward-reciprocity';

import type { ApiResponse } from '@/types/common';

// Schemas
const connectionRequestSchema = z.object({
    targetUserId: z.string().min(1),
    message: z.string().max(500).optional(),
    type: z.enum(['GENERAL', 'ROMANTIC', 'COFOUNDER', 'SUPPORT', 'MENTORING', 'PEER_LEARNING', 'COMMUNITY_MEMBER']).default('GENERAL'),
});

type ExistingConnectionResult = { done: true; response: ApiResponse<undefined> } | { done: false };

async function handleExistingConnection(
    existing: { id: string; status: string },
    message: string | undefined,
    type: string,
): Promise<ExistingConnectionResult> {
    if (existing.status === 'BLOCKED') {
        return { done: true, response: { success: false, error: await localizeActionMessage('connection.cannotRequestUser') } };
    }
    if (existing.status === 'PENDING') {
        return { done: true, response: { success: false, error: await localizeActionMessage('connection.alreadyRequested') } };
    }
    if (existing.status === 'ACCEPTED') {
        return { done: true, response: { success: false, error: await localizeActionMessage('connection.alreadyConnected') } };
    }
    if (existing.status === 'DECLINED') {
        await prisma.connection.update({
            where: { id: existing.id },
            data: { status: 'PENDING', message, type: type as ConnectionType }
        });
        revalidatePath('/connections');
        return { done: true, response: { success: true, data: undefined, message: await localizeActionMessage('connection.requestResent') } };
    }
    return { done: false };
}

type ReverseConnectionResult = { done: true; response: ApiResponse<undefined> } | { done: false };

async function handleReverseConnection(
    reverse: { id: string; status: string },
): Promise<ReverseConnectionResult> {
    if (reverse.status === 'PENDING') {
        await prisma.connection.update({
            where: { id: reverse.id },
            data: { status: 'ACCEPTED' }
        });
        revalidatePath('/connections');
        return { done: true, response: { success: true, data: undefined, message: await localizeActionMessage('connection.createdFromReverse') } };
    }
    if (reverse.status === 'BLOCKED') {
        return { done: true, response: { success: false, error: await localizeActionMessage('connection.cannotRequest') } };
    }
    return { done: false };
}

/**
 * Send a connection request
 */
export async function sendConnectionRequestAction(
    data: z.infer<typeof connectionRequestSchema>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<ApiResponse<any>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || !currentUser.data) return { success: false, error: await localizeActionMessage('common.loginRequired') };

        const userId = currentUser.data.user.id;

        const rl = await rateLimitAsync(`conn_${userId}`, 20, 3600000);
        if (!rl.success) {
            return { success: false, error: await localizeActionMessage('connection.rateLimited') };
        }

        const { targetUserId, message, type } = connectionRequestSchema.parse(data);

        if (userId === targetUserId) {
            return { success: false, error: await localizeActionMessage('connection.cannotConnectSelf') };
        }

        const targetUser = await prisma.user.findFirst({
            where: getConnectableMemberWhereInput({ id: targetUserId }),
            select: { id: true },
        });

        if (!targetUser) {
            return { success: false, error: await localizeActionMessage('connection.cannotRequestUser') };
        }

        // Check existing connection
        const existing = await prisma.connection.findUnique({
            where: {
                senderId_receiverId: {
                    senderId: userId,
                    receiverId: targetUserId
                }
            },
            select: { id: true, status: true }
        });

        if (existing) {
            const result = await handleExistingConnection(existing, message, type);
            if (result.done) return result.response;
        }

        // Check reverse connection (did they send one to us?)
        const reverse = await prisma.connection.findUnique({
            where: {
                senderId_receiverId: {
                    senderId: targetUserId,
                    receiverId: userId
                }
            },
            select: { id: true, status: true }
        });

        if (reverse) {
            const result = await handleReverseConnection(reverse);
            if (result.done) return result.response;
        }

        // Create new
        await prisma.connection.create({
            data: {
                senderId: userId,
                receiverId: targetUserId,
                message,
                type: type as ConnectionType,
                status: 'PENDING'
            }
        });

        revalidatePath('/profile');
        revalidatePath('/connections');
        return { success: true, data: undefined, message: await localizeActionMessage('connection.requestSent') };

    } catch (error) {
        logActionError('Connection request error', error);
        return { success: false, error: await localizeActionMessage('connection.requestFailed') };
    }
}

/**
 * Accept connection request
 */
export async function acceptConnectionRequestAction(
    connectionId: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<ApiResponse<any>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || !currentUser.data) return { success: false, error: await localizeActionMessage('common.unauthorized') };
        const userId = currentUser.data.user.id;

        const conn = await prisma.connection.findUnique({ where: { id: connectionId }, select: { id: true, senderId: true, receiverId: true } });
        if (!conn) return { success: false, error: await localizeActionMessage('connection.requestNotFound') };

        if (conn.receiverId !== userId) {
            return { success: false, error: await localizeActionMessage('connection.notReceiver') };
        }

        await prisma.connection.update({
            where: { id: connectionId },
            data: { status: 'ACCEPTED', respondedAt: new Date() }
        });

        await ensureForwardReciprocityPrompt({ userId, trigger: 'ACCEPTED_MATCH', triggerEntityId: connectionId });

        // Notify sender
        await createNotificationRecord({
            userId: conn.senderId,
            type: 'CONNECTION_ACCEPTED',
            title: await localizeActionMessage('connection.notification.acceptedTitle'),
            message: await localizeActionMessage('connection.notification.acceptedMessage', { name: currentUser.data.user.displayName || currentUser.data.user.name }),
            senderId: userId,
            link: `/profile/${userId}`
        });

        await createNotificationRecord({
            userId,
            type: 'FORWARD_RECIPROCITY_PROMPT',
            title: 'Pass something forward',
            message: 'Who could this help next, and what could you offer?',
            link: '/dashboard'
        });

        revalidatePath('/connections');
        return { success: true, data: undefined, message: await localizeActionMessage('connection.accepted') };
    } catch {
        return { success: false, error: await localizeActionMessage('common.operationFailed') };
    }
}

/**
 * Reject connection request
 */
export async function rejectConnectionRequestAction(
    connectionId: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<ApiResponse<any>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || !currentUser.data) return { success: false, error: await localizeActionMessage('common.unauthorized') };
        const userId = currentUser.data.user.id;

        const conn = await prisma.connection.findUnique({ where: { id: connectionId }, select: { id: true, receiverId: true } });
        if (!conn) return { success: false, error: await localizeActionMessage('connection.requestNotFound') };

        if (conn.receiverId !== userId) {
            return { success: false, error: await localizeActionMessage('connection.notReceiver') };
        }

        await prisma.connection.update({
            where: { id: connectionId },
            data: { status: 'DECLINED', respondedAt: new Date() }
        });

        revalidatePath('/connections');
        return { success: true, data: undefined, message: await localizeActionMessage('connection.rejected') };
    } catch {
        return { success: false, error: await localizeActionMessage('common.operationFailed') };
    }
}

/**
 * Remove connection (disconnect)
 */
export async function removeConnectionAction(
    targetUserId: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<ApiResponse<any>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || !currentUser.data) return { success: false, error: await localizeActionMessage('common.unauthorized') };
        const userId = currentUser.data.user.id;

        // Find connection where I am sender OR receiver with target
        const conn = await prisma.connection.findFirst({
            where: {
                OR: [
                    { senderId: userId, receiverId: targetUserId },
                    { senderId: targetUserId, receiverId: userId }
                ]
            },
            select: { id: true, status: true, senderId: true }
        });

        if (!conn) return { success: false, error: await localizeActionMessage('connection.notFound') };

        await prisma.connection.delete({
            where: { id: conn.id }
        });

        revalidatePath('/profile');
        return { success: true, data: undefined, message: await localizeActionMessage('connection.removed') };
    } catch {
        return { success: false, error: await localizeActionMessage('common.deleteFailed') };
    }
}

/**
 * Get my connections
 */
export async function getConnectionsAction(
    status: ConnectionStatus = 'ACCEPTED'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<ApiResponse<any[]>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || !currentUser.data) return { success: false, error: await localizeActionMessage('common.loginRequired') };
        const userId = currentUser.data.user.id;

const connections = await prisma.connection.findMany({
where: {
OR: [
{ senderId: userId },
{ receiverId: userId }
],
status
},
select: {
id: true,
status: true,
type: true,
createdAt: true,
senderId: true,
receiverId: true,
sender: { select: { id: true, name: true, displayName: true, profilePhoto: true, city: true, archetypes: true } },
receiver: { select: { id: true, name: true, displayName: true, profilePhoto: true, city: true, archetypes: true } }
},
orderBy: { createdAt: 'desc' },
take: 200
});

        // Map to friend object (the other user)
        const mapped = connections.map((c) => {
            const isSender = c.senderId === userId;
            const otherUser = isSender ? c.receiver : c.sender;
            return {
                id: c.id,
                userId: otherUser.id, // The friend's ID
                name: otherUser.displayName || otherUser.name,
                profilePhoto: otherUser.profilePhoto,
                senderArchetypes: otherUser.archetypes || [],
                city: otherUser.city,
                status: c.status,
                type: c.type,
                initiatedByMe: isSender,
                createdAt: c.createdAt
            };
        });

        return { success: true, data: mapped };
    } catch (e) {
        logActionError('getConnectionsAction', e);
        return { success: false, error: await localizeActionMessage('connection.fetchFailed') };
    }
}
/**
 * Get pending connection requests (received)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getConnectionRequestsAction(): Promise<ApiResponse<any[]>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || !currentUser.data) return { success: false, error: await localizeActionMessage('common.loginRequired') };
        const userId = currentUser.data.user.id;

  const requests = await prisma.connection.findMany({
    where: {
      receiverId: userId,
      status: 'PENDING'
    },
    select: {
      id: true,
      type: true,
      message: true,
      createdAt: true,
      sender: { select: { id: true, name: true, displayName: true, profilePhoto: true, city: true, archetypes: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

        const mapped = requests.map((c) => ({
            id: c.id,
            senderId: c.sender.id,
            senderName: c.sender.displayName || c.sender.name,
            senderPhoto: c.sender.profilePhoto,
            senderArchetypes: c.sender.archetypes || [],
            type: c.type,
            message: c.message,
            createdAt: c.createdAt
        }));

        return { success: true, data: mapped };
    } catch (e) {
        logActionError('getConnectionRequestsAction', e);
        return { success: false, error: await localizeActionMessage('connection.requestsFetchFailed') };
    }
}

/**
 * Get connection status with a specific user
 */
export async function getConnectionStatusAction(targetUserId: string): Promise<ApiResponse<{ status: ConnectionStatus | 'NONE', isSender: boolean, connectionId?: string }>> {
    try {
        const currentUser = await getCurrentUser();
        // Allow unauthenticated to see 'NONE' (or handle via UI)
        if (!currentUser.success || !currentUser.data) return { success: true, data: { status: 'NONE', isSender: false } };
        const userId = currentUser.data.user.id;

        if (userId === targetUserId) return { success: true, data: { status: 'NONE', isSender: false } }; // Self-check handled in UI usually

        const conn = await prisma.connection.findFirst({
            where: {
                OR: [
                    { senderId: userId, receiverId: targetUserId },
                    { senderId: targetUserId, receiverId: userId }
                ]
            },
            select: { id: true, status: true, senderId: true }
        });

        if (!conn) {
            return { success: true, data: { status: 'NONE', isSender: false } };
        }

        return {
            success: true,
            data: {
                status: conn.status,
                isSender: conn.senderId === userId,
                connectionId: conn.id
            }
        };
    } catch (e) {
        logActionError('getConnectionStatusAction', e);
        return { success: false, error: await localizeActionMessage('connection.statusFetchFailed') };
    }
}

/**
 * Get recommended connections
 * Simple logic: recent active users or random for now.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getRecommendedConnectionsAction(limit = 10): Promise<ApiResponse<any[]>> {
    try {
        const currentUser = await getCurrentUser();
        let userId = '';
        if (currentUser.success && currentUser.data) {
            userId = currentUser.data.user.id;
        }

        // Get IDs of existing connections to exclude
        const excludedIds: string[] = [userId]; // Exclude self
        if (userId) {
    const connections = await prisma.connection.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }]
      },
      select: { senderId: true, receiverId: true },
      take: 500,
    });
            connections.forEach((c) => {
                excludedIds.push(c.senderId === userId ? c.receiverId : c.senderId);
            });
        }

        const users = await prisma.user.findMany({
            where: getConnectableMemberWhereInput({
                id: { notIn: excludedIds },
            }),
            take: limit,
            orderBy: { createdAt: 'desc' }, // Newest first for now
            select: {
                id: true,
                name: true,
                displayName: true,
                profilePhoto: true,
                city: true,
                archetypes: true,
                lastActiveAt: true,

            }
        });

        return { success: true, data: users.map((user) => ({ ...user, isRecentlyActive: isRecentlyActive(user.lastActiveAt) })) };
    } catch (e) {
        logActionError('getRecommendedConnectionsAction', e);
        return { success: false, error: await localizeActionMessage('connection.recommendationsFetchFailed') };
    }
}
