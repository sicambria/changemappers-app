'use server';

import { logActionError } from '@/lib/action-logger';
import { localizeActionMessage } from '@/lib/action-result-i18n';
import { adminHardDeleteUser } from '@/lib/gdpr/admin-user-deletion';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { revalidatePath } from 'next/cache';

// ──────────────────────────────────────────────
// Site config get/set
// ──────────────────────────────────────────────

export async function adminGetSiteConfigAction(key: string): Promise<{
    success: boolean;
    value?: string | null;
    error?: string;
}> {
    try {
        const auth = await getCurrentUser();
        if (!auth.success || !auth.data.isAdmin) {
            return { success: false, error: await localizeActionMessage('common.adminRequired') };
        }
        const config = await prisma.siteConfig.findUnique({ where: { key }, select: { value: true } });
        return { success: true, value: config?.value ?? null };
    } catch (error) {
        logActionError('Admin get site config error', error);
        return { success: false, error: await localizeActionMessage('admin.settings.fetchFailed') };
    }
}

export async function adminSetSiteConfigAction(
    key: string,
    value: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const auth = await getCurrentUser();
        if (!auth.success || !auth.data.isAdmin) {
            return { success: false, error: await localizeActionMessage('common.adminRequired') };
        }
        await prisma.siteConfig.upsert({
            where: { key },
            create: { key, value, updatedBy: auth.data.id },
            update: { value, updatedBy: auth.data.id },
        });
        return { success: true };
    } catch (error) {
        logActionError('Admin set site config error', error);
        return { success: false, error: await localizeActionMessage('admin.settings.saveFailed') };
    }
}

// ──────────────────────────────────────────────
// Registration list
// ──────────────────────────────────────────────

export interface RegistrationRow {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
    usedInviteCode: string | null;
    profileType: string;
    isEmailVerified: boolean;
    isAdmin: boolean;
    isSuspended: boolean;
}

export async function adminGetRegistrationsAction(filters?: {
    page?: number;
    limit?: number;
    search?: string;
}): Promise<{
    success: boolean;
    data?: {
        registrations: RegistrationRow[];
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

        const page = filters?.page ?? 1;
        const limit = filters?.limit ?? 25;
        const skip = (page - 1) * limit;

        const where = filters?.search
            ? {
                  OR: [
                      { email: { contains: filters.search, mode: 'insensitive' as const } },
                      { name: { contains: filters.search, mode: 'insensitive' as const } },
                      { usedInviteCode: { contains: filters.search, mode: 'insensitive' as const } },
                  ],
              }
            : {};

        const [registrations, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    createdAt: true,
                    usedInviteCode: true,
                    profileType: true,
                    isEmailVerified: true,
                    isAdmin: true,
                    isSuspended: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        return {
            success: true,
            data: {
                registrations,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        };
    } catch (error) {
        logActionError('Admin get registrations error', error);
        return { success: false, error: await localizeActionMessage('admin.settings.registrationsFetchFailed') };
    }
}

export async function adminDeleteRegistrationUserAction(userId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const auth = await getCurrentUser();
        if (!auth.success || !auth.data.isAdmin) {
            return { success: false, error: await localizeActionMessage('common.adminRequired') };
        }

        if (auth.data.id === userId) {
            return { success: false, error: await localizeActionMessage('admin.settings.cannotDeleteSelf') };
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                isAdmin: true,
            },
        });

        if (!targetUser) {
            return { success: false, error: await localizeActionMessage('user.notFound') };
        }

        if (targetUser.isAdmin) {
            return { success: false, error: await localizeActionMessage('admin.settings.cannotDeleteAdmin') };
        }

        // AUDIT-20260613-028: a bare `user.delete` fails with an FK violation
        // for any content-bearing account (~34 User relations default to
        // onDelete: Restrict). Route through the shared GDPR erasure helper:
        // personal data is always erased; the User row is physically removed
        // when nothing blocks it (typical for pending registrations), and
        // otherwise stays as an anonymized tombstone.
        await adminHardDeleteUser(prisma, userId);

        revalidatePath('/admin');

        return { success: true };
    } catch (error) {
        logActionError('Admin delete registration user error', error);
        return { success: false, error: await localizeActionMessage('admin.settings.deleteUserFailed') };
    }
}
