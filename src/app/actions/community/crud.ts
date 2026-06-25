'use server';

// Community create/update/delete actions.
import { logActionError } from '@/lib/action-logger';
import { localizeActionMessage, localizeActionZodError } from '@/lib/action-result-i18n';
import { z } from 'zod';
import prisma, { AuditAction } from '@/lib/prisma';
import { getCurrentUser } from '@/app/actions/auth';
import { revalidatePath } from 'next/cache';
import { createAuditLog } from '@/lib/audit';
import { canEditCommunity } from '@/lib/permissions';
import type { ApiResponse } from '@/types/common';
import { createCommunitySchema, type Community } from '@/lib/community-contracts';

/**
 * Create new community
 */
export async function createCommunityAction(
    userId: string,
    data: z.infer<typeof createCommunitySchema>
): Promise<ApiResponse<Community>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || currentUser.data?.user?.id !== userId) {
            return { success: false, error: await localizeActionMessage('common.unauthorized') };
        }

        const validated = createCommunitySchema.parse(data);

        // CommunityType mapping
        // Schema: ECOVILLAGE, TRANSITION_TOWN, PROJECT, NETWORK, COHOUSING, INTENTIONAL_COMMUNITY, OTHER
        const dbType = validated.type;

        const newCommunity = await prisma.$transaction(async (tx) => {
            const community = await tx.community.create({
                data: {
                    name: validated.name,
                    description: validated.description,
                    type: dbType,
city: validated.city,
        country: validated.country,
        latitude: validated.latitude,
        longitude: validated.longitude,
        foundingYear: validated.foundingYear,
                    website: validated.website,
                    contactEmail: validated.contactEmail,
                    contactPhone: validated.contactPhone,

                    acceptingMembers: validated.acceptingNewMembers ? 'ACCEPTING' : 'NOT_ACCEPTING',
                    targetMemberDescription: validated.targetMemberDescription,
                    membershipCost: validated.membershipCost,
                    joiningProcess: validated.joiningProcess,

                    seekingVolunteers: validated.seekingVolunteers,
                    volunteerDescription: validated.volunteerDescription,

                    vision: validated.vision,
                    principles: validated.principles,
                    houseRules: validated.houseRules,
                    annualGoals: validated.annualGoals,

                    coverImage: validated.coverImage,

                    ownerId: userId,
                    visibility: 'PUBLIC'
                }
            });

            if (validated.values?.length) {
                await tx.communityValue.createMany({
                    data: validated.values.map(v => ({
                        communityId: community.id,
                        value: v
                    }))
                });
            }

            if (validated.seekingVolunteers && validated.volunteerCapabilities?.length) {
                await tx.communityVolunteerCapability.createMany({
                    data: validated.volunteerCapabilities.map(v => ({
                        communityId: community.id,
                        capability: v
                    }))
                });
            }

            await tx.communityMember.create({
                data: {
                    communityId: community.id,
                    userId: userId,
                    role: 'OWNER'
                }
            });

            return community;
        });

        await createAuditLog({
            userId,
            action: AuditAction.CREATE,
            entityType: 'Community',
            entityId: newCommunity.id,
            newState: { name: newCommunity.name, type: newCommunity.type }
        });

        return {
            success: true,
            data: {
                id: newCommunity.id,
                name: newCommunity.name,
                slug: newCommunity.id,
                type: newCommunity.type,
                city: newCommunity.city || undefined,
                country: newCommunity.country || undefined,
                acceptingNewMembers: newCommunity.acceptingMembers === 'ACCEPTING',
                moderationStatus: newCommunity.moderationStatus,
                ownerId: userId,
                createdAt: newCommunity.createdAt,
                updatedAt: newCommunity.updatedAt,
                focusAreas: [],
                facilities: [],
                photoGallery: newCommunity.coverImage ? [newCommunity.coverImage] : [],
                values: validated.values || [],
                volunteerCapabilities: validated.volunteerCapabilities || [],
                verificationLevel: newCommunity.verificationLevel,
                visibility: newCommunity.visibility,
                searchable: true,
                seekingVolunteers: newCommunity.seekingVolunteers
            } as unknown as Community,
            message: await localizeActionMessage('community.created'),
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: await localizeActionZodError(error, 'common.invalidData') };
        }
        logActionError('Create community error', error);
        return { success: false, error: await localizeActionMessage('community.createFailed') };
    }
}

type CommunityUpdateInput = Partial<z.infer<typeof createCommunitySchema> & { coverImage?: string }>;

type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function updateCommunityRelations(
    tx: PrismaTx,
    communityId: string,
    data: CommunityUpdateInput,
): Promise<void> {
    if (data.values) {
        await tx.communityValue.deleteMany({ where: { communityId } });
        if (data.values.length > 0) {
            await tx.communityValue.createMany({
                data: data.values.map(v => ({ communityId, value: v }))
            });
        }
    }

    if (data.volunteerCapabilities) {
        await tx.communityVolunteerCapability.deleteMany({ where: { communityId } });
        if (data.volunteerCapabilities.length > 0) {
            await tx.communityVolunteerCapability.createMany({
                data: data.volunteerCapabilities.map(v => ({ communityId, capability: v }))
            });
        }
    }
}

function applyCommunityCoreFields(updateData: Record<string, unknown>, data: CommunityUpdateInput): void {
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type) updateData.type = data.type;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.foundingYear !== undefined) updateData.foundingYear = data.foundingYear;
}

function applyCommunityContactFields(updateData: Record<string, unknown>, data: CommunityUpdateInput): void {
    if (data.website !== undefined) updateData.website = data.website;
    if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail;
    if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone;
}

function applyCommunityMembershipFields(updateData: Record<string, unknown>, data: CommunityUpdateInput): void {
    if (data.acceptingNewMembers !== undefined) {
        updateData.acceptingMembers = data.acceptingNewMembers ? 'ACCEPTING' : 'NOT_ACCEPTING';
    }
    if (data.targetMemberDescription !== undefined) updateData.targetMemberDescription = data.targetMemberDescription;
    if (data.membershipCost !== undefined) updateData.membershipCost = data.membershipCost;
    if (data.joiningProcess !== undefined) updateData.joiningProcess = data.joiningProcess;
    if (data.seekingVolunteers !== undefined) updateData.seekingVolunteers = data.seekingVolunteers;
    if (data.volunteerDescription !== undefined) updateData.volunteerDescription = data.volunteerDescription;
}

function applyCommunityContentFields(updateData: Record<string, unknown>, data: CommunityUpdateInput): void {
    if (data.vision !== undefined) updateData.vision = data.vision;
    if (data.principles !== undefined) updateData.principles = data.principles;
    if (data.houseRules !== undefined) updateData.houseRules = data.houseRules;
    if (data.annualGoals !== undefined) updateData.annualGoals = data.annualGoals;
    if (data.coverImage) updateData.coverImage = data.coverImage;
}

function buildCommunityUpdateData(data: CommunityUpdateInput): Record<string, unknown> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    applyCommunityCoreFields(updateData, data);
    applyCommunityContactFields(updateData, data);
    applyCommunityMembershipFields(updateData, data);
    applyCommunityContentFields(updateData, data);
    return updateData;
}

/**
 * Update community
 */
export async function updateCommunityAction(
    userId: string,
    communityId: string,
    data: Partial<z.infer<typeof createCommunitySchema> & { coverImage?: string }>
): Promise<ApiResponse<Community>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || currentUser.data?.user?.id !== userId) {
            return { success: false, error: await localizeActionMessage('common.unauthorized') };
        }

        const community = await prisma.community.findUnique({ where: { id: communityId }, select: { id: true, ownerId: true, name: true } });

        if (!community || !(await canEditCommunity(currentUser.data.user, communityId))) {
            return { success: false, error: await localizeActionMessage('common.forbidden') };
        }

        const updateData = buildCommunityUpdateData(data);

        // Transaction for update + relation updates
        const updatedCommunity = await prisma.$transaction(async (tx) => {
            const community = await tx.community.update({
                where: { id: communityId },
                data: updateData,
                include: {
                    focusAreas: true,
                    facilities: true,
                    members: true
                }
            });

            await updateCommunityRelations(tx, communityId, data);

            return community;
        });


        await createAuditLog({
            userId,
            action: AuditAction.UPDATE,
            entityType: 'Community',
            entityId: updatedCommunity.id,
            newState: {
                name: updateData.name,
                type: updateData.type,
                city: updateData.city,
                country: updateData.country,
                acceptingMembers: updateData.acceptingMembers,
                seekingVolunteers: updateData.seekingVolunteers,
                visibility: updateData.visibility,
                updatedAt: updateData.updatedAt,
            }
        });

        revalidatePath(`/communities/${communityId}`);
        revalidatePath('/map');

        return {
            success: true,
            data: {
                id: updatedCommunity.id,
                name: updatedCommunity.name,
                slug: updatedCommunity.id,
                type: updatedCommunity.type,
                city: updatedCommunity.city || undefined,
                country: updatedCommunity.country || undefined,
                acceptingNewMembers: updatedCommunity.acceptingMembers === 'ACCEPTING',
                ownerId: updatedCommunity.ownerId,
                createdAt: updatedCommunity.createdAt,
                updatedAt: updatedCommunity.updatedAt,
                focusAreas: updatedCommunity.focusAreas.map((f: { focusArea: string }) => f.focusArea),
                facilities: updatedCommunity.facilities.map((f: { facility: string }) => f.facility),
                photoGallery: updatedCommunity.coverImage ? [updatedCommunity.coverImage] : [],
                values: [],
                verificationLevel: updatedCommunity.verificationLevel,
                visibility: updatedCommunity.visibility,
                description: updatedCommunity.description || undefined,
                website: updatedCommunity.website || undefined,
                moderationStatus: updatedCommunity.moderationStatus,
            } as unknown as Community,
            message: await localizeActionMessage('community.updated'),
        };

    } catch (error) {
        logActionError('Update community error', error);
        return { success: false, error: await localizeActionMessage('common.updateFailed') };
    }
}

/**
 * Delete community
 */
export async function deleteCommunityAction(
    userId: string,
    communityId: string
): Promise<ApiResponse<null>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || currentUser.data?.user?.id !== userId) {
            return { success: false, error: await localizeActionMessage('common.unauthorized') };
        }

        const community = await prisma.community.findUnique({ where: { id: communityId }, select: { id: true, ownerId: true, name: true } });
        const isAdmin = currentUser.data.user.isAdmin === true;

        if (!community || (community.ownerId !== userId && !isAdmin)) {
            return { success: false, error: await localizeActionMessage('common.forbidden') };
        }

        await prisma.community.delete({
            where: { id: communityId }
        });

        await createAuditLog({
            userId,
            action: AuditAction.DELETE,
            entityType: 'Community',
            entityId: communityId,
            previousState: { name: community.name }
        });

        revalidatePath('/map');
        return { success: true, data: null, message: await localizeActionMessage('community.deleted') };
    } catch (error) {
        logActionError('Delete community error', error);
        return { success: false, error: await localizeActionMessage('common.deleteFailed') };
    }
}
