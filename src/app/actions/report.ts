'use server';

import { logActionError } from '@/lib/action-logger';
import { localizeActionMessage } from '@/lib/action-result-i18n';
// Report Server Actions
// Handles user reporting and moderation actions

import prisma from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { revalidatePath } from 'next/cache';
import type { ReportCategory, ReportStatus } from '@/lib/prisma';

import type { ApiResponse } from '@/types/common';

/**
 * Create a new report against a user, community, event, or message
 */
export async function createReportAction(
    targetId: string,
    targetType: 'USER' | 'COMMUNITY' | 'EVENT' | 'MESSAGE',
    category: ReportCategory,
    description?: string
): Promise<ApiResponse<{ reportId: string }>> {
    try {
        const currentUserResponse = await getCurrentUser();
        if (!currentUserResponse.success || !currentUserResponse.data) {
            return { success: false, error: await localizeActionMessage('common.loginRequired') };
        }
        const userId = currentUserResponse.data.user.id;

        // Prevent self-reporting
        if (targetType === 'USER' && targetId === userId) {
            return { success: false, error: await localizeActionMessage('report.cannotReportSelf') };
        }

    // Check if user already reported this target
    const existingReport = await prisma.report.findFirst({
      where: {
        filerId: userId,
        targetId: targetId,
        targetType: targetType,
        status: { in: ['PENDING', 'UNDER_REVIEW'] }
      },
      select: { id: true }
    });

        if (existingReport) {
            return { success: false, error: await localizeActionMessage('report.alreadyReported') };
        }

        // Report create + audit log must be atomic (AUDIT-20260613-030).
        const report = await prisma.$transaction(async (tx) => {
            const created = await tx.report.create({
                data: {
                    filerId: userId,
                    targetId: targetId,
                    targetType: targetType,
                    category: category,
                    description: description || null,
                    status: 'PENDING'
                }
            });

            // Log the action
            await tx.auditLog.create({
                data: {
                    userId: userId,
                    action: 'REPORT_FILED',
                    entityType: 'Report',
                    entityId: created.id,
                    metadata: {
                        targetType,
                        targetId,
                        category
                    }
                }
            });

            return created;
        });

        return {
            success: true,
            data: { reportId: report.id },
            message: await localizeActionMessage('report.submitted')
        };
    } catch (error) {
        logActionError('Create report error', error);
        return { success: false, error: await localizeActionMessage('report.submitFailed') };
    }
}

/**
 * Get all reports (admin only)
 */
export async function getReportsAction(
    status?: ReportStatus,
    limit: number = 20,
    offset: number = 0
): Promise<ApiResponse<{
    reports: Array<{
        id: string;
        filerName: string;
        targetName: string;
        targetType: string;
        category: string;
        description: string | null;
        status: string;
        createdAt: Date;
    }>;
    total: number;
}>> {
    try {
        const currentUserResponse = await getCurrentUser();
        if (!currentUserResponse.success || !currentUserResponse.data) {
            return { success: false, error: await localizeActionMessage('common.loginRequired') };
        }

        const user = currentUserResponse.data.user;

        if (!user.isAdmin) {
            return { success: false, error: 'Admin authorization required' };
        }

        const where = status ? { status } : {};

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        select: {
          id: true,
          filer: { select: { displayName: true, name: true } },
          target: { select: { displayName: true, name: true } },
          targetType: true,
          category: true,
          description: true,
          status: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.report.count({ where })
    ]);

        return {
            success: true,
            data: {
                reports: reports.map((r) => ({
                    id: r.id,
                    filerName: r.filer.displayName || r.filer.name,
                    targetName: r.target.displayName || r.target.name,
                    targetType: r.targetType,
                    category: r.category,
                    description: r.description,
                    status: r.status,
                    createdAt: r.createdAt
                })),
                total
            }
        };
    } catch (error) {
        logActionError('Get reports error', error);
        return { success: false, error: await localizeActionMessage('report.fetchFailed') };
    }
}

/**
 * Update report status (admin only)
 */
export async function updateReportStatusAction(
    reportId: string,
    newStatus: ReportStatus,
    resolution?: string
): Promise<ApiResponse<null>> {
    try {
        const currentUserResponse = await getCurrentUser();
        if (!currentUserResponse.success || !currentUserResponse.data) {
            return { success: false, error: await localizeActionMessage('common.loginRequired') };
        }
        const userId = currentUserResponse.data.user.id;

        if (!currentUserResponse.data.user.isAdmin) {
            return { success: false, error: 'Admin authorization required' };
        }

        const report = await prisma.report.findUnique({
      where: { id: reportId },
      select: { status: true }
    });

        if (!report) {
            return { success: false, error: await localizeActionMessage('report.notFound') };
        }

        // Status update + audit log must be atomic (AUDIT-20260613-030).
        await prisma.$transaction(async (tx) => {
            await tx.report.update({
                where: { id: reportId },
                data: {
                    status: newStatus,
                    resolution: resolution || null,
                    resolvedAt: newStatus === 'RESOLVED' || newStatus === 'DISMISSED' ? new Date() : null,
                    resolvedById: userId
                }
            });

            // Log the action
            await tx.auditLog.create({
                data: {
                    userId: userId,
                    action: 'REPORT_RESOLVED',
                    entityType: 'Report',
                    entityId: reportId,
                    metadata: {
                        previousStatus: report.status,
                        newStatus,
                        resolution
                    }
                }
            });
        });

        revalidatePath('/admin');

        return { success: true, data: null, message: await localizeActionMessage('report.statusUpdated') };
    } catch (error) {
        logActionError('Update report status error', error);
        return { success: false, error: await localizeActionMessage('report.statusUpdateFailed') };
    }
}

/**
 * Unblock a user
 */
export async function unblockUserAction(
    targetUserId: string
): Promise<ApiResponse<null>> {
    try {
        const currentUserResponse = await getCurrentUser();
        if (!currentUserResponse.success || !currentUserResponse.data) {
            return { success: false, error: await localizeActionMessage('common.loginRequired') };
        }
        const userId = currentUserResponse.data.user.id;

    // Find the blocked connection
    const connection = await prisma.connection.findUnique({
      where: {
        senderId_receiverId: {
          senderId: userId,
          receiverId: targetUserId
        }
      },
      select: { status: true }
    });

        if (connection?.status !== 'BLOCKED') {
            return { success: false, error: await localizeActionMessage('report.userNotBlocked') };
        }

        // Delete the block connection
        await prisma.connection.delete({
            where: {
                senderId_receiverId: {
                    senderId: userId,
                    receiverId: targetUserId
                }
            }
        });

        return { success: true, data: null, message: await localizeActionMessage('report.userUnblocked') };
    } catch (error) {
        logActionError('Unblock user error', error);
        return { success: false, error: await localizeActionMessage('report.unblockFailed') };
    }
}

/**
 * Check if a user is blocked
 */
export async function isUserBlockedAction(
    targetUserId: string
): Promise<ApiResponse<{ isBlocked: boolean; blockedByMe: boolean; blockedMe: boolean }>> {
    try {
        const currentUserResponse = await getCurrentUser();
        if (!currentUserResponse.success || !currentUserResponse.data) {
            return { success: false, error: await localizeActionMessage('common.loginRequired') };
        }
        const userId = currentUserResponse.data.user.id;

    const [blockedByMe, blockedMe] = await Promise.all([
      prisma.connection.findFirst({
        where: { senderId: userId, receiverId: targetUserId, status: 'BLOCKED' },
        select: { id: true }
      }),
      prisma.connection.findFirst({
        where: { senderId: targetUserId, receiverId: userId, status: 'BLOCKED' },
        select: { id: true }
      })
    ]);

        return {
            success: true,
            data: {
                isBlocked: !!(blockedByMe || blockedMe),
                blockedByMe: !!blockedByMe,
                blockedMe: !!blockedMe
            }
        };
    } catch (error) {
        logActionError('Check block status error', error);
        return { success: false, error: await localizeActionMessage('report.blockCheckFailed') };
    }
}
