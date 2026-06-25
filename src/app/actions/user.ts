'use server';

import { logActionError } from '@/lib/action-logger';
import { localizeActionMessage } from '@/lib/action-result-i18n';
import { z } from 'zod';

import type { ApiResponse } from '@/types/common';

interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

interface UserProfile {
    id: string;
    name: string;
    displayName?: string;
    profilePhoto?: string;
    coverImage?: string;
    archetypes?: string[];
    bio?: string;
    city?: string;

    country?: string;
    verificationLevel?: string;
    profileVisibility?: string;
    website?: string;
    isRemoteCapable?: boolean;
    enjoyDoing?: string;
    currentIntention?: string;
    constraints?: string;
    availabilityDetails?: unknown;
    collaborationPreference?: string[];
    changemakeLevel?: string;
    skills?: string[];
    skillsOffered?: string[];
    supportNeeded?: string[];
    values?: string[];
    interests?: string[];
}

interface UserSearchResult {
    id: string;
    displayName?: string;
    profilePhoto?: string;
    coverImage?: string;
    archetypes?: string[];
    city?: string;
    matchScore?: number;
    isRecentlyActive?: boolean;
}

import { searchUsersSchema } from '@/lib/validations/user';
import { capExposedUserSearchTotal } from '@/lib/user-search/abuse';

import prisma, { AccountDeletionReason, Archetype, ConnectionStatus, Visibility, type Prisma } from '@/lib/prisma';
import { getHomepageRecentRegisteredUserWhereInput, getPublicMemberWhereInput, isEligibleVisibleMemberAccount } from '@/lib/public-member-eligibility';
import { getCurrentUser } from '@/app/actions/auth';
import { logger } from '@/lib/logger';
import { canExposeProfileField, getProfileExposureSettings, splitProfileSkills, toVisibleStringArray, type ProfileExposureSettings } from '@/lib/profile-exposure';
import { eraseUserPersonalData } from '@/lib/gdpr/user-data';
import { isRecentlyActive } from '@/lib/user-activity';
import { excludeBlockedUsersWhereInput, isBlockedBetween } from '@/lib/blocking';


type ProfileUser = {
    id: string;
    name: string;
    displayName: string | null;
    profilePhoto: string | null;
    coverImage: string | null;
    federationSettings: unknown;
    archetypes: unknown;
    bio: string | null;
    city: string | null;
    country: string | null;
    verificationLevel: string | null;
    profileVisibility: string;
    website: string | null;
    isRemoteCapable: boolean;
    enjoyDoing: string | null;
    currentIntention: string | null;
    constraints: string | null;
    availabilityDetails: unknown;
    collaborationPreference: string[];
    changemakeLevel: string | null;
    interests: { interest: string }[];
    values: { value: string }[];
    skills: { skill: string; skillType: string }[];
};

function buildUserProfileData(user: ProfileUser, canSeeProfileFields: boolean): UserProfile {
    const publicProfile = getProfileExposureSettings(user.federationSettings);
    const show = (field: keyof ProfileExposureSettings) => canExposeProfileField(publicProfile, field, canSeeProfileFields);
    const interests = show('showInterests') ? user.interests.map((i) => i.interest) : [];
    const values = show('showValues') ? user.values.map((v) => v.value) : [];
    const { skills, offers: skillsOffered, needs: supportNeeded } = splitProfileSkills(user.skills, publicProfile, canSeeProfileFields);
    return {
        id: user.id,
        name: user.name,
        displayName: user.displayName || user.name,
        profilePhoto: show('showAvatar') ? user.profilePhoto || undefined : undefined,
        coverImage: show('showCoverImage') ? user.coverImage || undefined : undefined,
        archetypes: toVisibleStringArray(user.archetypes, publicProfile, 'showArchetypes', canSeeProfileFields),
        bio: show('showBio') ? user.bio || undefined : undefined,
        city: show('showLocation') ? user.city || undefined : undefined,
        country: show('showLocation') ? user.country || undefined : undefined,
        verificationLevel: user.verificationLevel ?? undefined,
        profileVisibility: user.profileVisibility,
        values,
        interests,
        skills,
        skillsOffered,
        supportNeeded,
        website: show('showWebsite') ? user.website || undefined : undefined,
        isRemoteCapable: user.isRemoteCapable,
        enjoyDoing: show('showIntentions') ? user.enjoyDoing || undefined : undefined,
        currentIntention: show('showIntentions') ? user.currentIntention || undefined : undefined,
        constraints: show('showBoundaries') ? user.constraints || undefined : undefined,
        availabilityDetails: show('showIntentions') ? user.availabilityDetails : undefined,
        collaborationPreference: show('showIntentions') ? user.collaborationPreference : [],
        changemakeLevel: show('showChangemakerLevel') ? user.changemakeLevel || 'LEVEL_2' : undefined,
    };
}

async function resolveUserProfileCanView(
    viewer: { id: string; isAdmin?: boolean | null },
    user: { id: string; profileVisibility: string },
    isDiscoverableAccount: boolean,
): Promise<boolean> {
    if (viewer.id === user.id || viewer.isAdmin === true) return true;
    if (!isDiscoverableAccount) return false;
    // Symmetric block: a blocked party (either direction) cannot view the profile.
    // After owner/admin + eligibility gates so they short-circuit without a block query.
    if (await isBlockedBetween(viewer.id, user.id)) return false;
    if (user.profileVisibility === Visibility.PUBLIC || user.profileVisibility === Visibility.REGISTERED) return true;
    if (user.profileVisibility !== Visibility.CONNECTIONS) return false;

    const connection = await prisma.connection.findFirst({
        where: {
            status: ConnectionStatus.ACCEPTED,
            deletedAt: null,
            OR: [
                { senderId: viewer.id, receiverId: user.id },
                { senderId: user.id, receiverId: viewer.id },
            ],
        },
        select: { id: true },
    });
    return !!connection;
}

/**
 * Get user profile by ID
 */
export async function getUserProfileAction(
    userId: string
): Promise<ApiResponse<UserProfile>> {
    try {
        if (!userId) {
            return { success: false, error: await localizeActionMessage('user.idRequired') };
        }

        const currentUser = await getCurrentUser();
        const viewer = currentUser.data?.user;
        if (!currentUser.success || !viewer) {
            return { success: false, error: await localizeActionMessage('common.loginRequired') };
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                displayName: true,
                profilePhoto: true,
                coverImage: true,
                federationSettings: true,
                email: true,
                isAdmin: true,
                isEmailVerified: true,
                isRegistrationPending: true,
                processingRestricted: true,
                termsAcceptedAt: true,
                archetypes: true,
                bio: true,
                city: true,
                country: true,
                verificationLevel: true,
                website: true,
                isRemoteCapable: true,
                enjoyDoing: true,
                currentIntention: true,
                constraints: true,
                availabilityDetails: true,
                collaborationPreference: true,
                changemakeLevel: true,
                profileVisibility: true,
                deletedAt: true,
                isSuspended: true,
                interests: { select: { interest: true } },
                values: { select: { value: true } },
                skills: { select: { skill: true, skillType: true } },
                onboardingState: { select: { lastStageCompleted: true } },
            },
        });

        if (!user || user.deletedAt || user.isSuspended) {
            return { success: false, error: await localizeActionMessage('user.notFound') };
        }

        const isOwner = viewer.id === user.id;
        const isAdmin = viewer.isAdmin === true;
        const isDiscoverableAccount = isEligibleVisibleMemberAccount(user);
        const canView = await resolveUserProfileCanView(viewer, user, isDiscoverableAccount);

        if (!canView) {
            return { success: false, error: await localizeActionMessage('profile.notAvailable') };
        }

        const canSeeProfileFields = isOwner || isAdmin;
        return { success: true, data: buildUserProfileData(user, canSeeProfileFields) };
    } catch (error) {
        logActionError('Profile fetch error', error);
        return { success: false, error: await localizeActionMessage('profile.loadFailed') };
    }
}

/**
 * Search users with filters
 */
export async function searchUsersAction(
    params: z.infer<typeof searchUsersSchema>
): Promise<ApiResponse<PaginatedResponse<UserSearchResult>>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || !currentUser.data?.user) {
            return { success: false, error: await localizeActionMessage('common.loginRequired') };
        }

        const { query, archetypes, city, page, pageSize } = searchUsersSchema.parse(params);

        const searchFilters: Prisma.UserWhereInput = {};

        if (query) {
            searchFilters.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { displayName: { contains: query, mode: 'insensitive' } },
            ];
        }

        if (archetypes?.length) {
            const archetypeValues = new Set<string>(Object.values(Archetype));
            const validArchetypes = archetypes.filter((value): value is Archetype => archetypeValues.has(value));
            if (validArchetypes.length) searchFilters.archetypes = { hasSome: validArchetypes };
        }
        if (city) searchFilters.city = { contains: city, mode: 'insensitive' };
        // Symmetric block: blocked-either-direction users never appear in search results.
        const where = getPublicMemberWhereInput({
            AND: [searchFilters, excludeBlockedUsersWhereInput(currentUser.data.user.id)],
        });

        const skip = (page - 1) * pageSize;
        const hasPrivacySensitiveFieldFilter = Boolean(archetypes?.length || city);
        const [users, rawTotal] = await Promise.all([
            prisma.user.findMany({
                where,
                skip: hasPrivacySensitiveFieldFilter ? undefined : skip,
                take: hasPrivacySensitiveFieldFilter ? 500 : pageSize,
                select: {
                    id: true,
                    displayName: true,
                    name: true,
                    profilePhoto: true,
                    coverImage: true,
                    federationSettings: true,
                    archetypes: true,
                    city: true,
                    lastActiveAt: true,
                },
            }),
            hasPrivacySensitiveFieldFilter ? Promise.resolve(null) : prisma.user.count({ where }),
        ]);

        const visibleResults = users
            .map((u) => {
                const publicProfile = getProfileExposureSettings(u.federationSettings);
                const visibleArchetypes = toVisibleStringArray(u.archetypes, publicProfile, 'showArchetypes');
                const visibleCity = canExposeProfileField(publicProfile, 'showLocation') ? u.city || undefined : undefined;

                return {
                    id: u.id,
                    displayName: u.displayName || u.name,
                    profilePhoto: canExposeProfileField(publicProfile, 'showAvatar') ? u.profilePhoto || undefined : undefined,
                    coverImage: canExposeProfileField(publicProfile, 'showCoverImage') ? u.coverImage || undefined : undefined,
                    archetypes: visibleArchetypes.length > 0 ? visibleArchetypes : undefined,
                    city: visibleCity,
                    matchScore: 80,
                    isRecentlyActive: isRecentlyActive(u.lastActiveAt),
                };
            })
            .filter((u) => {
                if (archetypes?.length && !archetypes.some((archetype) => u.archetypes?.includes(archetype))) return false;
                if (city && !u.city) return false;
                return true;
            });

        const pagedResults = hasPrivacySensitiveFieldFilter ? visibleResults.slice(skip, skip + pageSize) : visibleResults;
        const total = rawTotal ?? visibleResults.length;

        const exposedTotal = capExposedUserSearchTotal(total);

        return {
            success: true,
            data: {
                data: pagedResults,
                total: exposedTotal,
                page,
                pageSize,
                hasMore: total > exposedTotal || skip + pagedResults.length < total,
            },
        };
    } catch (error) {
        logActionError('Search error', error);
        return { success: false, error: await localizeActionMessage('common.searchFailed') };
    }
}


/**
 * Block a user
 */
export async function blockUserAction(
    userId: string,
    targetUserId: string
): Promise<ApiResponse<null>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || currentUser.data?.user.id !== userId) {
            return { success: false, error: await localizeActionMessage('common.unauthorized') };
        }

        await prisma.connection.upsert({
            where: {
                senderId_receiverId: {
                    senderId: userId,
                    receiverId: targetUserId
                }
            },
            update: { status: 'BLOCKED' },
            create: {
                senderId: userId,
                receiverId: targetUserId,
                type: 'GENERAL',
                status: 'BLOCKED'
            }
        });

        return { success: true, data: null, message: await localizeActionMessage('user.blocked') };
    } catch {
        return { success: false, error: await localizeActionMessage('user.blockFailed') };
    }
}

/**
 * Export user data (GDPR)
 */
export async function exportUserDataAction(
    userId: string
): Promise<ApiResponse<{ downloadUrl: string }>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || currentUser.data?.user.id !== userId) {
            return { success: false, error: await localizeActionMessage('common.unauthorized') };
        }

    const data = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        sentConnections: { select: { id: true } },
        receivedConnections: { select: { id: true } },
        hostedEvents: { select: { id: true } },
        eventRsvps: { select: { id: true } },
        communityMemberships: { select: { id: true } }
      }
    });

        // In real app: Write to file/S3 and return URL
        // Here we just return mock URL but verify data fetch worked
        if (!data) throw new Error('User not found');

        return {
            success: true,
            data: { downloadUrl: '/api/gdpr/export' },
            message: await localizeActionMessage('user.exportReady'),
        };
    } catch {
        return { success: false, error: await localizeActionMessage('user.exportFailed') };
    }
}

/**
 * Delete user account (GDPR)
 *
 * Personal data is anonymized. Created content (events, communities, etc.)
 * is kept as open-source but its author reference becomes anonymous.
 * A soft-delete timestamp is set and personal fields are cleared.
 */
export async function deleteAccountAction(
    userId: string,
    confirmation: string
): Promise<ApiResponse<null>> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser.success || currentUser.data?.user.id !== userId) {
            return { success: false, error: await localizeActionMessage('common.unauthorized') };
        }

        if (confirmation !== 'T\u00d6RL\u00c9S' && confirmation.toUpperCase() !== 'DELETE') {
            return { success: false, error: await localizeActionMessage('user.invalidConfirmation') };
        }

        await eraseUserPersonalData(prisma, userId);

        return { success: true, data: null, message: await localizeActionMessage('user.accountDeleted') };
    } catch {
        return { success: false, error: await localizeActionMessage('user.deleteFailed') };
    }
}

type RecentUserEntry = {
    id: string;
    name: string;
    displayName: string | null;
    profilePhoto: string | null;
    coverImage: string | null;
    archetypes: string[];
    bio: string | null;
    isRecentlyActive: boolean;
};

/**
 * Get recently registered users for the homepage
 */
export async function getRecentUsersAction(limit: number = 6): Promise<ApiResponse<RecentUserEntry[]>> {
    try {
        const normalizedLimit = Number.isFinite(limit) ? Math.trunc(limit) : 6;
        const safeLimit = Math.min(Math.max(normalizedLimit, 0), 6);
        if (safeLimit === 0) {
            return { success: true, data: [] };
        }

        const users = await prisma.user.findMany({
            where: getHomepageRecentRegisteredUserWhereInput(),
            orderBy: {
                createdAt: 'desc'
            },
            take: safeLimit,
            select: {
                id: true,
                name: true,
                displayName: true,
                profilePhoto: true,
                coverImage: true,
                archetypes: true,
                bio: true,
                lastActiveAt: true,
            }
        });

        return {
            success: true,
            data: users.map((user) => ({
                id: user.id,
                name: user.name,
                displayName: user.displayName,
                profilePhoto: user.profilePhoto,
                coverImage: user.coverImage,
                archetypes: user.archetypes,
                bio: user.bio,
                isRecentlyActive: isRecentlyActive(user.lastActiveAt),
            })),
        };
    } catch (error) {
        logger.error({ msg: 'Recent users fetch error', err: error instanceof Error ? error.message : String(error) });
        return { success: false, error: await localizeActionMessage('user.recentFetchFailed') };
    }
}

// ---------------------------------------------------------------------------
// GDPR Art. 17 — Right to erasure: schedule account deletion with grace period
// ---------------------------------------------------------------------------

const DELETION_GRACE_DAYS = 30;

export async function scheduleAccountDeletionAction(
    userId: string,
    confirmation: string
): Promise<ApiResponse<{ scheduledAt: string }>> {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || currentUser.data?.user.id !== userId) {
        return { success: false, error: await localizeActionMessage('common.unauthorized') };
    }

    if (confirmation !== 'T\u00d6RL\u00c9S' && confirmation.toUpperCase() !== 'DELETE') {
        return { success: false, error: await localizeActionMessage('user.invalidConfirmation') };
    }

    try {
        const scheduledAt = new Date();
        scheduledAt.setDate(scheduledAt.getDate() + DELETION_GRACE_DAYS);

        await prisma.user.update({
            where: { id: userId },
            data: { scheduledDeletionAt: scheduledAt, scheduledDeletionReason: AccountDeletionReason.USER_REQUESTED },
        });

        logger.info({ msg: 'Account deletion scheduled', userId, scheduledAt });
        return {
            success: true,
            data: { scheduledAt: scheduledAt.toISOString() },
            message: await localizeActionMessage('user.deletionScheduled', { days: DELETION_GRACE_DAYS }),
        };
    } catch (error) {
        logger.error({ msg: 'scheduleAccountDeletion error', err: error instanceof Error ? error.message : String(error) });
        return { success: false, error: await localizeActionMessage('user.deletionScheduleFailed') };
    }
}

export async function cancelScheduledDeletionAction(
    userId: string
): Promise<ApiResponse<null>> {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || currentUser.data?.user.id !== userId) {
        return { success: false, error: await localizeActionMessage('common.unauthorized') };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { scheduledDeletionAt: null, scheduledDeletionReason: null },
        });

        logger.info({ msg: 'Account deletion cancelled', userId });
        return { success: true, data: null, message: await localizeActionMessage('user.deletionCancelled') };
    } catch (error) {
        logger.error({ msg: 'cancelScheduledDeletion error', err: error instanceof Error ? error.message : String(error) });
        return { success: false, error: await localizeActionMessage('user.cancelFailed') };
    }
}

// ---------------------------------------------------------------------------
// GDPR Art. 18 — Right to restrict processing
// ---------------------------------------------------------------------------

export async function toggleProcessingRestrictedAction(
    userId: string,
    restricted: boolean
): Promise<ApiResponse<null>> {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || currentUser.data?.user.id !== userId) {
        return { success: false, error: await localizeActionMessage('common.unauthorized') };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { processingRestricted: restricted },
        });

        logger.info({ msg: 'Processing restriction toggled', userId, restricted });
        return {
            success: true,
            data: null,
            message: restricted
                ? await localizeActionMessage('user.processingRestricted')
                : await localizeActionMessage('user.processingRestrictionLifted'),
        };
    } catch (error) {
        logger.error({ msg: 'toggleProcessingRestricted error', err: error instanceof Error ? error.message : String(error) });
        return { success: false, error: await localizeActionMessage('common.settingSaveFailed') };
    }
}

// ---------------------------------------------------------------------------
// GDPR Art. 22 — Right to object to automated decision-making
// ---------------------------------------------------------------------------

export async function withdrawSpecialCategoryConsentAction(
    userId: string
): Promise<ApiResponse<null>> {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || currentUser.data?.user.id !== userId) {
        return { success: false, error: await localizeActionMessage('common.unauthorized') };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                allowSensitiveMatching: false,
                specialCategoryConsentWithdrawnAt: new Date(),
                declineAlgorithmicMatching: true,
            },
        });

        logger.info({ msg: 'Special-category matching consent withdrawn', userId });
        return { success: true, data: null, message: await localizeActionMessage('user.sensitiveMatchingDisabled') };
    } catch (error) {
        logger.error({ msg: 'withdrawSpecialCategoryConsent error', err: error instanceof Error ? error.message : String(error) });
        return { success: false, error: await localizeActionMessage('common.settingSaveFailed') };
    }
}

export async function toggleAlgorithmicMatchingAction(
    userId: string,
    decline: boolean
): Promise<ApiResponse<null>> {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || currentUser.data?.user.id !== userId) {
        return { success: false, error: await localizeActionMessage('common.unauthorized') };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { declineAlgorithmicMatching: decline },
        });

        logger.info({ msg: 'Algorithmic matching preference updated', userId, decline });
        return {
            success: true,
            data: null,
            message: decline
                ? await localizeActionMessage('user.algorithmicMatchingDisabled')
                : await localizeActionMessage('user.algorithmicMatchingEnabled'),
        };
    } catch (error) {
        logger.error({ msg: 'toggleAlgorithmicMatching error', err: error instanceof Error ? error.message : String(error) });
        return { success: false, error: await localizeActionMessage('common.settingSaveFailed') };
    }
}
