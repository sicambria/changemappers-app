'use server';

import { logActionError } from '@/lib/action-logger';
import { localizeActionMessage } from '@/lib/action-result-i18n';
import prisma from '@/lib/prisma';
import type { ProfileType } from '@/lib/featureAccess';
import { getCurrentUser } from './auth';
import { revalidatePath } from 'next/cache';

// Response type
type ActionResponse<T = null> = {
    success: boolean;
    error?: string;
    message?: string;
    data?: T;
};

// Change ProfileType — admin can set any profileType on any non-self user
export async function changeProfileTypeAction(
    userId: string,
    profileType: ProfileType
): Promise<ActionResponse> {
    try {
        const auth = await getCurrentUser();
        if (!auth.success || !auth.data?.user.isAdmin) {
            return { success: false, error: await localizeActionMessage('common.unauthorized') };
        }

        if (auth.data.user.id === userId) {
            return { success: false, error: await localizeActionMessage('admin.cannotSuspendSelf') };
        }

        const validTypes: ProfileType[] = ['GUEST', 'COMMUNITY_SEEKER', 'CHANGEMAPPER'];
        if (!validTypes.includes(profileType)) {
            return { success: false, error: await localizeActionMessage('common.operationFailed') };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { profileType },
        });

        revalidatePath(`/profile/${userId}`);

        return { success: true, message: await localizeActionMessage('admin.profileTypeChanged') };
    } catch (error) {
        logActionError('Change profile type error', error);
        return { success: false, error: await localizeActionMessage('common.operationFailed') };
    }
}

// Toggle Entity Status - DISABLED UNTIL SCHEMA UPDATE
export async function toggleEntityStatusAction(
    _type: 'community' | 'event',
    _entityId: string,
    _status: 'APPROVED' | 'HIDDEN' | 'PENDING_REVIEW'
): Promise<ActionResponse> {
    // Placeholder until schema supports moderationStatus
    return { success: false, error: await localizeActionMessage('admin.featureUnavailable') };
}

// Approve Registration — unsuspends the user and upgrades GUEST → COMMUNITY_SEEKER
export async function approveRegistrationAction(userId: string): Promise<ActionResponse> {
    try {
        const auth = await getCurrentUser();
        if (!auth.success || !auth.data?.user.isAdmin) {
            return { success: false, error: await localizeActionMessage('common.unauthorized') };
        }

        if (auth.data.user.id === userId) {
            return { success: false, error: await localizeActionMessage('admin.cannotSuspendSelf') };
        }

        const current = await prisma.user.findUnique({
            where: { id: userId },
            select: { profileType: true },
        });

        await prisma.user.update({
            where: { id: userId },
            data: {
                isSuspended: false,
                ...(current?.profileType === 'GUEST' && { profileType: 'COMMUNITY_SEEKER' as ProfileType }),
            },
        });

        revalidatePath(`/profile/${userId}`);

        return { success: true, message: await localizeActionMessage('admin.userRestored') };
    } catch (error) {
        logActionError('Approve registration error', error);
        return { success: false, error: await localizeActionMessage('common.operationFailed') };
    }
}

// Toggle User Suspension
export async function toggleUserSuspensionAction(
    userId: string,
    isSuspended: boolean
): Promise<ActionResponse> {
    try {
        const auth = await getCurrentUser();
        if (!auth.success || !auth.data?.user.isAdmin) {
            return { success: false, error: await localizeActionMessage('common.unauthorized') };
        }

        // Prevent self-suspension
        if (auth.data.user.id === userId) {
            return { success: false, error: await localizeActionMessage('admin.cannotSuspendSelf') };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { isSuspended }
        });

        revalidatePath(`/profile/${userId}`);

        return { success: true, message: isSuspended ? await localizeActionMessage('admin.userSuspended') : await localizeActionMessage('admin.userRestored') };
    } catch (error) {
        logActionError('Suspension error', error);
        return { success: false, error: await localizeActionMessage('common.operationFailed') };
    }
}
