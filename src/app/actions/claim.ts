'use server';

import { logActionError } from '@/lib/action-logger';
import prisma, { EntitySource, ClaimStatus } from '@/lib/prisma';
import { getCurrentUser } from '@/app/actions/auth';
import { revalidatePath } from 'next/cache';

// Simple response type for actions
type ActionResponse = {
    success: boolean;
    message?: string;
    error?: string;
};

// Shared claim-eligibility guard for the request flow — returns an error
// ActionResponse when the entity cannot be claimed, or null when it is eligible.
// Extracted so requestClaimAction stays under the cognitive-complexity budget (S3776).
function validateClaimEligibility(
    entity: { source: EntitySource; claimStatus: ClaimStatus } | null,
    noun: 'Community' | 'Event',
): ActionResponse | null {
    if (!entity) return { success: false, error: `${noun} not found` };
    if (entity.source !== EntitySource.IMPORT) {
        const plural = noun === 'Community' ? 'communities' : 'events';
        return { success: false, error: `Only imported ${plural} can be claimed` };
    }
    if (entity.claimStatus !== ClaimStatus.UNCLAIMED) {
        return { success: false, error: `${noun} already claimed or pending` };
    }
    return null;
}

// 1. Request Claim
export async function requestClaimAction(
    entityType: 'COMMUNITY' | 'EVENT',
    entityId: string
): Promise<ActionResponse> {
    const response = await getCurrentUser();
    if (!response.success || !response.data?.user) {
        return { success: false, error: 'Authorization required' };
    }
    const user = response.data.user;

    try {
        if (entityType === 'COMMUNITY') {
            const community = await prisma.community.findUnique({ where: { id: entityId }, select: { source: true, claimStatus: true } });
            const invalid = validateClaimEligibility(community, 'Community');
            if (invalid) return invalid;
            await prisma.community.update({ where: { id: entityId }, data: { claimStatus: ClaimStatus.PENDING, claimRequestById: user.id } });
        } else {
            const event = await prisma.event.findUnique({ where: { id: entityId }, select: { source: true, claimStatus: true } });
            const invalid = validateClaimEligibility(event, 'Event');
            if (invalid) return invalid;
            await prisma.event.update({ where: { id: entityId }, data: { claimStatus: ClaimStatus.PENDING, claimRequestById: user.id } });
        }
        revalidatePath(`/${entityType.toLowerCase()}/${entityId}`);
        return { success: true, message: 'Claim request submitted' };
    } catch (error) {
        logActionError('Claim request error', error);
        return { success: false, error: 'Failed to submit claim request' };
    }
}

// 2. Approve Claim (Admin Only)
export async function approveClaimAction(
    entityType: 'COMMUNITY' | 'EVENT',
    entityId: string
): Promise<ActionResponse> {
    const response = await getCurrentUser();
    if (!response.success || !response.data) {
        return { success: false, error: 'Admin authorization required' };
    }
    const user = response.data.user;

    if (!user.isAdmin) {
        return { success: false, error: 'Admin authorization required' };
    }

    try {
    if (entityType === 'COMMUNITY') {
      const community = await prisma.community.findUnique({ where: { id: entityId }, select: { claimRequestById: true } });
      if (!community?.claimRequestById) { return { success: false, error: 'Invalid claim request' }; }

            await prisma.community.update({
                where: { id: entityId },
                data: {
                    ownerId: community.claimRequestById,
                    source: EntitySource.USER, // Convert to user-owned
                    claimStatus: ClaimStatus.CLAIMED,
                    claimRequestById: null, // Clear request
                },
            });
    } else {
      const event = await prisma.event.findUnique({ where: { id: entityId }, select: { claimRequestById: true } });
      if (!event?.claimRequestById) { return { success: false, error: 'Invalid claim request' }; }

            await prisma.event.update({
                where: { id: entityId },
                data: {
                    hostId: event.claimRequestById,
                    source: EntitySource.USER,
                    claimStatus: ClaimStatus.CLAIMED,
                    claimRequestById: null,
                },
            });
        }

        revalidatePath('/admin/claims');
        return { success: true, message: 'Claim approved' };

    } catch (error) {
        logActionError('Claim approval error', error);
        return { success: false, error: 'Failed to approve claim' };
    }
}

// 3. Reject Claim (Admin Only)
export async function rejectClaimAction(
    entityType: 'COMMUNITY' | 'EVENT',
    entityId: string
): Promise<ActionResponse> {
    const response = await getCurrentUser();
    if (!response.success || !response.data) {
        return { success: false, error: 'Admin authorization required' };
    }
    const user = response.data.user;

    if (!user.isAdmin) {
        return { success: false, error: 'Admin authorization required' };
    }

    try {
        if (entityType === 'COMMUNITY') {
            await prisma.community.update({
                where: { id: entityId },
                data: {
                    claimStatus: ClaimStatus.REJECTED,
                    claimRequestById: null, // Clear request or keep for record? Clearing for now to allow re-claim
                },
            });
        } else {
            await prisma.event.update({
                where: { id: entityId },
                data: {
                    claimStatus: ClaimStatus.REJECTED,
                    claimRequestById: null,
                },
            });
        }

        revalidatePath('/admin/claims');
        return { success: true, message: 'Claim rejected' };

    } catch (error) {
        logActionError('Claim rejection error', error);
        return { success: false, error: 'Failed to reject claim' };
    }
}
