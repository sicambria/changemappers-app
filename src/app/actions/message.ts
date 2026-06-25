'use server';

import { logActionError } from '@/lib/action-logger';
import prisma from '@/lib/prisma';
import { ApiResponse } from '@/types';
import { getCurrentUser } from '@/app/actions/auth';
import { softDeleteWithAudit } from '@/lib/audit';
import { rateLimitAsync } from '@/lib/rate-limit';
import { decryptHighRiskContent, encryptHighRiskContent } from '@/lib/high-risk-content-crypto';
import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';

const MESSAGE_MAX_LENGTH = 2000;
// Bounded window of recent messages returned by getMessagesAction.
const MESSAGE_HISTORY_LIMIT = 500;
const DIRECT_MESSAGE_ENCRYPTION_CONTEXT = 'changemappers:direct-message:v1';

const sendMessageSchema = z.object({
    receiverId: z.string().min(1).max(191),
    content: z.string().trim().min(1).max(MESSAGE_MAX_LENGTH),
});

function sanitizeMessageContent(content: string): string {
    return sanitizeHtml(content, {
        allowedTags: [],
        allowedAttributes: {},
    }).trim();
}

function decryptDirectMessageContent(content: string): string {
    return decryptHighRiskContent(content, DIRECT_MESSAGE_ENCRYPTION_CONTEXT);
}

function encryptDirectMessageContent(content: string): string {
    return encryptHighRiskContent(content, DIRECT_MESSAGE_ENCRYPTION_CONTEXT);
}

// Action to get unread message count for the current user
export async function getUnreadMessageCountAction(userId: string): Promise<ApiResponse<number>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || currentUser.data?.user.id !== userId) {
            return { success: false, error: 'Unauthorized' };
        }

        const count = await prisma.message.count({
            where: {
                receiverId: userId,
                isRead: false,
            },
        });

        return { success: true, data: count };
    } catch (error) {
        logActionError('Error fetching unread count', error);
        return { success: false, error: 'Failed to fetch unread count' };
    }
}

// Action to mark messages as read for a specific sender
export async function markMessagesAsReadAction(userId: string, senderId: string): Promise<ApiResponse<void>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || currentUser.data?.user.id !== userId) {
            return { success: false, error: 'Unauthorized' };
        }

        await prisma.message.updateMany({
            where: {
                receiverId: userId,
                senderId: senderId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        return { success: true, data: undefined };
    } catch (error) {
        logActionError('Error marking messages as read', error);
        return { success: false, error: 'Failed to mark messages as read' };
    }
}

// Action to get conversation history with a specific user
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getMessagesAction(partnerId: string): Promise<ApiResponse<any[]>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || !currentUser.data) {
            return { success: false, error: 'Unauthorized' };
        }
        const userId = currentUser.data.user.id;

        // Fetch the NEWEST bounded window, then reverse to ascending for display.
        // orderBy desc + take ensures the most recent messages are never dropped
        // once a conversation exceeds the cap (was: oldest 500 ascending, which
        // silently hid recent messages in long conversations).
        const messages = await prisma.message.findMany({
            where: {
                // AUDIT-20260613-037: never surface soft-deleted messages.
                deletedAt: null,
                OR: [
                    { senderId: userId, receiverId: partnerId },
                    { senderId: partnerId, receiverId: userId },
                ],
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: MESSAGE_HISTORY_LIMIT,
            select: {
                id: true,
                content: true,
                createdAt: true,
                senderId: true,
                receiverId: true,
                sender: {
                    select: {
                        id: true,
                        name: true,
                        profilePhoto: true,
                    },
                },
            },
        });

        return {
            success: true,
            // Reverse the newest-first window back to ascending (oldest → newest)
            // so the returned contract is unchanged for callers.
            data: messages
                .toReversed()
                .map((message) => ({
                    ...message,
                    content: decryptDirectMessageContent(message.content),
                })),
        };
    } catch (error) {
        logActionError('Error fetching messages', error);
        return { success: false, error: 'Failed to fetch messages' };
    }
}

// Action to send a message to a user
export async function sendMessageAction(receiverId: string, content: string): Promise<ApiResponse<{ id: string, content: string, createdAt: Date, senderId: string, receiverId: string }>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || !currentUser.data) {
            return { success: false, error: 'Unauthorized' };
        }
        const userId = currentUser.data.user.id;

        const parsed = sendMessageSchema.safeParse({ receiverId, content });
        if (!parsed.success) {
            return { success: false, error: 'Invalid message' };
        }

        const rl = await rateLimitAsync(`msg_${userId}`, 30, 60000);
        if (!rl.success) {
            return { success: false, error: 'Too many messages — please slow down.' };
        }

        if (userId === parsed.data.receiverId) {
            return { success: false, error: 'Cannot send message to yourself' };
        }

        const receiver = await prisma.user.findUnique({
            where: { id: parsed.data.receiverId },
            select: { id: true },
        });
        if (!receiver) {
            return { success: false, error: 'Recipient not found' };
        }

        const block = await prisma.connection.findFirst({
            where: {
                status: 'BLOCKED',
                OR: [
                    { senderId: userId, receiverId: parsed.data.receiverId },
                    { senderId: parsed.data.receiverId, receiverId: userId },
                ],
            },
            select: { id: true },
        });
        if (block) {
            return { success: false, error: 'Cannot send message to this user' };
        }

        const sanitizedContent = sanitizeMessageContent(parsed.data.content);
        if (sanitizedContent.length === 0) {
            return { success: false, error: 'Invalid message' };
        }

        const encryptedContent = encryptDirectMessageContent(sanitizedContent);

        const message = await prisma.message.create({
            data: {
                senderId: userId,
                receiverId: parsed.data.receiverId,
                content: encryptedContent,
                isRead: false,
            },
            select: {
                id: true,
                content: true,
                createdAt: true,
                senderId: true,
                receiverId: true,
            }
        });

        return { success: true, data: { ...message, content: sanitizedContent } };
    } catch (error: unknown) {
        logActionError('Send message action error', error);
        return { success: false, error: 'Failed to send message' };
    }
}

// Soft-delete a message the current user sent (AUDIT-20260613-037). Only the
// sender may delete their own message; deletion is a soft-delete with an audit
// trail and removes the message from future history fetches.
export async function deleteMessageAction(messageId: string): Promise<ApiResponse<void>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || !currentUser.data) {
            return { success: false, error: 'Unauthorized' };
        }
        const userId = currentUser.data.user.id;

        const message = await prisma.message.findUnique({
            where: { id: messageId },
            select: { id: true, senderId: true, deletedAt: true },
        });
        // Generic not-found avoids leaking the existence of others' messages.
        if (!message || message.deletedAt || message.senderId !== userId) {
            return { success: false, error: 'Message not found' };
        }

        await softDeleteWithAudit('message', messageId, userId, currentUser.data.user.email);
        return { success: true, data: undefined };
    } catch (error: unknown) {
        logActionError('Delete message action error', error);
        return { success: false, error: 'Failed to delete message' };
    }
}
