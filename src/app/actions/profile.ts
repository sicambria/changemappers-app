'use server';

import { logActionError } from '@/lib/action-logger';
import { localizeActionMessage } from '@/lib/action-result-i18n';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUserData } from '@/lib/get-current-user';
import { cookies } from 'next/headers';
import { revalidatePath, revalidateTag } from 'next/cache';
import { updateFullProfileSchema } from '@/lib/validations/profile';
import { normalizeUploadedImageDataUrl, UploadedImageNormalizationError } from '@/lib/uploaded-images';
import { Archetype, ChangemakerLevel, ConnectionStatus, SkillType, Visibility, LocationPrecision, type Prisma } from '@/lib/prisma';
import { normalizeCoordinatesForPrecision } from '@/lib/location-precision';
import { isRecentlyActive } from '@/lib/user-activity';
import { isBlockedBetween } from '@/lib/blocking';
import { canExposeProfileField, splitProfileSkills, toVisibleStringArray, type ProfileExposureSettings } from '@/lib/profile-exposure';
import {
    FEDIVERSE_CONSENT_VERSION,
    normalizeFediverseSettings,
    withFediverseConsent,
} from '@/lib/federation/settings';

async function resolveCauseIds(causeIds: string[]): Promise<string[]> {
  const results = await Promise.all(
    causeIds.map(async (c) => {
      const found = await prisma.socialCause.findFirst({
        where: { OR: [{ id: c }, { slug: c }] },
        select: { id: true },
      });
      return found?.id ?? null;
    })
  );
  return results.filter((id): id is string => id !== null);
}

// Base archetype IDs (functional role, mandatory, user-selected).
// EXTRA/quiz archetypes are set by saveArchetypeAction and preserved on profile update.
// Must stay in sync with prisma/schema.prisma Archetype enum BASE values.
const BASE_ARCHETYPE_IDS = new Set([
    'LOCAL_PRACTITIONER', 'NETWORK_WEAVER', 'INSTITUTIONAL_CHANGEMAKER', 'GLOBAL_AMPLIFIER',
    'RESOURCE_MOBILIZER', 'INNOVATION_CATALYST', 'SYSTEM_DISRUPTOR', 'STRATEGIC_ADVISOR',
]);

const privacyVisibilitySchema = z.enum(['PUBLIC', 'REGISTERED', 'CONNECTIONS', 'PRIVATE']);
const profileLocationPrecisionSchema = z.enum(['COUNTRY', 'CITY', 'EXACT']);

const updatePrivacySettingsSchema = z.object({
    profileVisibility: privacyVisibilitySchema,
    locationVisibility: privacyVisibilitySchema,
    locationPrecision: profileLocationPrecisionSchema.optional(),
    emailVisibility: privacyVisibilitySchema.optional(),
    showOnMap: z.boolean().optional(),
    allowConnectionRequests: z.boolean().optional(),
    allowMessages: z.boolean().optional(),
});

function toPersistedVisibility(value: z.infer<typeof privacyVisibilitySchema>): Visibility {
    return value === 'PRIVATE' ? Visibility.CONNECTIONS : value;
}

// Normalize avatar + cover image data URLs in place on the validated payload.
// Returns an error ActionResponse when normalization rejects the input, or null
// when both images are valid (or absent). Extracted from updateProfileAction to
// keep its cognitive complexity under budget (S3776); behavior is preserved exactly.
async function normalizeProfileImages(
    validated: { profilePhoto?: string; coverImage?: string },
): Promise<{ success: false; error: string } | null> {
    try {
        validated.profilePhoto = await normalizeUploadedImageDataUrl(validated.profilePhoto, 'avatar');
        validated.coverImage = await normalizeUploadedImageDataUrl(validated.coverImage, 'cover');
        return null;
    } catch (error) {
        if (error instanceof UploadedImageNormalizationError) {
            return { success: false, error: error.message };
        }
        throw error;
    }
}

// Merge the form's BASE archetype selections with the user's existing EXTRA (quiz)
// archetypes preserved in the DB. Returns undefined when no archetypes were submitted
// (leaving the field untouched), mirroring the original inline logic exactly.
async function mergeProfileArchetypes(
    targetUserId: string,
    submitted: string[] | undefined,
): Promise<string[] | undefined> {
    if (submitted === undefined) return undefined;
    const currentDbUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { archetypes: true },
    });
    const existingExtra = (currentDbUser?.archetypes ?? []).filter(
        a => !BASE_ARCHETYPE_IDS.has(a as string)
    );
    const validBase = submitted.filter(a => BASE_ARCHETYPE_IDS.has(a));
    return [...new Set([...validBase, ...existingExtra])];
}

// Build the skills relation deleteMany/create prep from the raw form data.
// Returns the two arrays the caller folds into the prisma update payload.
function buildSkillUpdates(data: Record<string, unknown>): {
    skillDeletes: { skillType: SkillType }[];
    skillCreates: { skill: string; skillType: SkillType }[];
} {
    const skillDeletes: { skillType: SkillType }[] = [];
    const skillCreates: { skill: string; skillType: SkillType }[] = [];
    const skillsArray = (arr: unknown): string[] => Array.isArray(arr) ? arr as string[] : [];

    if (data.skills !== undefined) {
        skillDeletes.push({ skillType: SkillType.EXPERIENCE });
        skillCreates.push(...skillsArray(data.skills).map((s) => ({ skill: s, skillType: SkillType.EXPERIENCE })));
    }
    if (data.offers !== undefined) {
        skillDeletes.push({ skillType: SkillType.OFFERED });
        skillCreates.push(...skillsArray(data.offers).map((s) => ({ skill: s, skillType: SkillType.OFFERED })));
    }
    if (data.needs !== undefined) {
        skillDeletes.push({ skillType: SkillType.SEEKING });
        skillCreates.push(...skillsArray(data.needs).map((s) => ({ skill: s, skillType: SkillType.SEEKING })));
    }
    return { skillDeletes, skillCreates };
}

// Assemble the prisma user.update `data` payload for updateProfileAction. Each
// conditional field mirrors the original inline ternaries exactly (same undefined /
// null defaults, same relation set/deleteMany shapes, same ordering). Extracted to
// keep updateProfileAction under the cognitive-complexity budget (S3776).
async function buildProfileUpdateData(
    validated: z.infer<typeof updateFullProfileSchema>,
    normalizedCoordinates: { latitude: number | null | undefined; longitude: number | null | undefined },
    mergedArchetypes: string[] | undefined,
    relationUpdates: {
        skillDeletes: { skillType: SkillType }[];
        skillCreates: { skill: string; skillType: SkillType }[];
        valueUpdate: { deleteMany: object; create: { value: string }[] } | undefined;
    },
): Promise<Prisma.UserUpdateInput> {
    const { skillDeletes, skillCreates, valueUpdate } = relationUpdates;
    return {
        displayName: validated.displayName,
        bio: validated.bio,
        city: validated.city,
        country: validated.country,
        latitude: normalizedCoordinates.latitude,
        longitude: normalizedCoordinates.longitude,
        isRemoteCapable: validated.isRemoteCapable,
        seekingLocalEcoCommunity: validated.seekingLocalEcoCommunity,
        seekingIntentionalCommunity: validated.seekingIntentionalCommunity,
        highStakesProjectHelp: validated.highStakesProjectHelp,
        strictNoRomance: validated.strictNoRomance,

        enjoyDoing: validated.enjoyDoing,
        currentIntention: validated.currentIntention,
        collaborationPreference: validated.collaborationPreference,
        constraints: validated.constraints,
        availabilityDetails: validated.availabilityDetails,

        // mergedArchetypes: base archetypes from form + preserved EXTRA (quiz) archetypes.
        // Already validated and filtered to known enum values in the merge step above.
        archetypes: mergedArchetypes !== undefined ? (mergedArchetypes as Archetype[]) : undefined,
        changemakeLevel: validated.changemakeLevel ? validated.changemakeLevel as ChangemakerLevel : undefined,
        rdgAreas: validated.rdgAreas ?? undefined,
        profilePhoto: validated.profilePhoto,
        coverImage: validated.coverImage,
        mainCommunity: validated.mainCommunity,

        // Relations
        interests: validated.interests ? {
            deleteMany: {},
            create: validated.interests.map((i: string) => ({ interest: i }))
        } : undefined,

        skills: (skillDeletes.length > 0 || skillCreates.length > 0) ? {
            deleteMany: { OR: skillDeletes },
            create: skillCreates
        } : undefined,

        values: valueUpdate,

        mainCauses: validated.mainCauses ? {
            set: (await resolveCauseIds(validated.mainCauses)).map(id => ({ id }))
        } : undefined,
        interestedCauses: validated.interestedCauses ? {
            set: (await resolveCauseIds(validated.interestedCauses)).map(id => ({ id }))
        } : undefined,

        website: validated.website === '' ? null : validated.website,
        socialLinks: validated.socialLinks ?? undefined,
        federationSettings: validated.federationSettings
            ? (validated.federationSettings as unknown as Prisma.InputJsonValue)
            : undefined,
        federationConsentAt: validated.federationSettings && normalizeFediverseSettings(validated.federationSettings).consentVersion === FEDIVERSE_CONSENT_VERSION
            ? new Date()
            : undefined,
    };
}

async function resolveProfileCanView(
    viewer: { id: string; isAdmin?: boolean } | null | undefined,
    user: { id: string; profileVisibility: string },
): Promise<boolean> {
    if (!viewer) return user.profileVisibility === Visibility.PUBLIC;
    if (viewer.id === user.id || viewer.isAdmin === true) return true;
    // Symmetric block: a blocked party (either direction) cannot view the profile.
    // Must run AFTER the owner/admin short-circuit so they retain access.
    if (await isBlockedBetween(viewer.id, user.id)) return false;
    if (user.profileVisibility === Visibility.PUBLIC) return true;
    if (user.profileVisibility === Visibility.REGISTERED) return true;
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

// Field-exposure shaping for getPublicProfile, split into cohesive groups so no
// single helper carries the full ternary load (S3776). Each returns a partial of
// the shaped user; defaults (null / [] / false) are preserved exactly per field.
// `canExpose` is canExposeProfileField bound to (publicProfile, canSeeAllFields).
type CanExpose = (key: keyof ProfileExposureSettings) => boolean;

// The public user row as returned by the getPublicProfile findUnique select, covering
// all fields read by the three shapeProfile* helpers below.
type PublicProfileUser = {
    coverImage: string | null;
    profilePhoto: string | null;
    bio: string | null;
    website: string | null;
    socialLinks: unknown;
    city: string | null;
    country: string | null;
    changemakeLevel: string | null;
    enjoyDoing: string | null;
    currentIntention: string | null;
    collaborationPreference: string[];
    constraints: string | null;
    availabilityDetails: unknown;
    seekingLocalEcoCommunity: boolean;
    seekingIntentionalCommunity: boolean;
    highStakesProjectHelp: boolean;
    strictNoRomance: boolean;
    archetypes: string[];
    rdgAreas: string[];
    values: { value: string }[];
    interests: { interest: string }[];
    mainCauses: { id: string; title: string }[];
    interestedCauses: { id: string; title: string }[];
};

function shapeProfileMediaFields(user: PublicProfileUser, canExpose: CanExpose) {
    return {
        coverImage: canExpose('showCoverImage') ? user.coverImage : null,
        profilePhoto: canExpose('showAvatar') ? user.profilePhoto : null,
        bio: canExpose('showBio') ? user.bio : null,
        website: canExpose('showWebsite') ? user.website : null,
        socialLinks: canExpose('showSocialLinks') ? user.socialLinks : null,
        city: canExpose('showLocation') ? user.city : null,
        country: canExpose('showLocation') ? user.country : null,
    };
}

function shapeProfileIntentionFields(user: PublicProfileUser, canExpose: CanExpose) {
    return {
        changemakeLevel: canExpose('showChangemakerLevel') ? user.changemakeLevel : null,
        enjoyDoing: canExpose('showIntentions') ? user.enjoyDoing : null,
        currentIntention: canExpose('showIntentions') ? user.currentIntention : null,
        collaborationPreference: canExpose('showIntentions') ? user.collaborationPreference : [],
        constraints: canExpose('showBoundaries') ? user.constraints : null,
        availabilityDetails: canExpose('showIntentions') ? user.availabilityDetails : null,
        seekingLocalEcoCommunity: canExpose('showIntentions') ? user.seekingLocalEcoCommunity : false,
        seekingIntentionalCommunity: canExpose('showIntentions') ? user.seekingIntentionalCommunity : false,
        highStakesProjectHelp: canExpose('showIntentions') ? user.highStakesProjectHelp : false,
        strictNoRomance: canExpose('showBoundaries') ? user.strictNoRomance : false,
    };
}

function shapeProfileTaxonomyFields(user: PublicProfileUser, publicProfile: ProfileExposureSettings, canSeeAllFields: boolean) {
    const canExpose: CanExpose = (key) => canExposeProfileField(publicProfile, key, canSeeAllFields);
    return {
        archetypes: toVisibleStringArray(user.archetypes, publicProfile, 'showArchetypes', canSeeAllFields),
        rdgAreas: toVisibleStringArray(user.rdgAreas, publicProfile, 'showRdgAreas', canSeeAllFields),
        values: canExpose('showValues') ? user.values.map((v: { value: string }) => v.value) : [],
        interests: canExpose('showInterests') ? user.interests.map((i: { interest: string }) => i.interest) : [],
        mainCauses: canExpose('showCauses') ? user.mainCauses : [],
        interestedCauses: canExpose('showCauses') ? user.interestedCauses : [],
    };
}

export async function getPublicProfile(userId: string) {
    try {
        const viewerResult = await getCurrentUserData();
        const viewer = viewerResult.success ? viewerResult.data?.user : null;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                displayName: true,
                bio: true,
                profilePhoto: true,
                coverImage: true,
                website: true,
                socialLinks: true,
                federationSettings: true,
                archetypes: true,
                rdgAreas: true,
                changemakeLevel: true,
                verificationLevel: true,
                isEmailVerified: true,
                createdAt: true,
                lastActiveAt: true,
                city: true,
                country: true,
                isRemoteCapable: true,
                profileVisibility: true,

                enjoyDoing: true,
                currentIntention: true,
                collaborationPreference: true,
                constraints: true,
                availabilityDetails: true,

                seekingLocalEcoCommunity: true,
                seekingIntentionalCommunity: true,
                highStakesProjectHelp: true,
                strictNoRomance: true,

                skills: {
                    select: { skill: true, skillType: true }
                },
                values: {
                    select: { value: true }
                },
                interests: {
                    select: { interest: true }
                },
                mainCauses: {
                    select: { id: true, title: true }
                },
                interestedCauses: {
                    select: { id: true, title: true }
                },

                _count: {
                    select: {
                        receivedConnections: true,
                        hostedEvents: true,
                        ownedCommunities: true,
                    }
                }
            }
        });

        if (!user) {
            return { success: false, error: 'User not found' };
        }

        const canView = await resolveProfileCanView(viewer, user);

        if (!canView) {
            return { success: false, error: 'Profile not available' };
        }

        const isOwner = viewer?.id === user.id;
        const isAdmin = viewer?.isAdmin === true;
        const federationSettings = normalizeFediverseSettings(user.federationSettings);

        const publicProfile = federationSettings.publicProfile;
        const canSeeAllFields = isOwner || isAdmin;
        const splitSkills = splitProfileSkills(user.skills, publicProfile, canSeeAllFields);

        // Reshape for frontend. Partial-shape helpers come AFTER `...user` so their
        // exposure-gated values override the raw columns; skills/offers/needs come
        // from splitSkills. Field-by-field defaults are preserved in the helpers.
        const canExpose: CanExpose = (key) => canExposeProfileField(publicProfile, key, canSeeAllFields);
        const shapedUser = {
            ...user,
            federationSettings,
            isRecentlyActive: isRecentlyActive(user.lastActiveAt),
            ...shapeProfileMediaFields(user, canExpose),
            ...shapeProfileIntentionFields(user, canExpose),
            ...shapeProfileTaxonomyFields(user, publicProfile, canSeeAllFields),
            skills: splitSkills.skills,
            offers: splitSkills.offers,
            needs: splitSkills.needs,
        };

        return { success: true, data: shapedUser };
    } catch (error) {
        logActionError('Error fetching public profile', error);
        return { success: false, error: 'Failed to fetch profile' };
    }
}

export async function updateProfileAction(data: Record<string, unknown>) {
    try {
        const userResult = await getCurrentUserData();
        if (!userResult.success || !userResult.data?.user) {
            return { success: false, error: await localizeActionMessage('profile.notLoggedInForAction') };
        }

        const currentUser = userResult.data.user;
        const targetUserId = (data.userId as string | undefined) || currentUser.id;

        const isOwner = currentUser.id === targetUserId;
        const isAdmin = currentUser.isAdmin === true;

        if (!isOwner && !isAdmin) {
            return { success: false, error: await localizeActionMessage('profile.notAllowedForAction') };
        }

        const validationResult = updateFullProfileSchema.safeParse(data);
        if (!validationResult.success) {
            return { success: false, error: validationResult.error.issues[0].message };
        }
        const validated = validationResult.data;
        const normalizedCoordinates = normalizeCoordinatesForPrecision(validated.latitude, validated.longitude);

        const imageError = await normalizeProfileImages(validated);
        if (imageError) return imageError;

        // Merge base archetypes from the form with existing EXTRA (quiz) archetypes in DB.
        // The ProfileEditForm only sends BASE archetype selections; quiz archetypes must be preserved.
        const mergedArchetypes = await mergeProfileArchetypes(targetUserId, validated.archetypes);

        // Prepare Skill Updates
        const { skillDeletes, skillCreates } = buildSkillUpdates(data);

        const skillsArray = (arr: unknown): string[] => Array.isArray(arr) ? arr as string[] : [];

        // Prepare Value Updates
        // If data.values is present, replace all.
        // UserValue is just { value: string }.
        const valueUpdate = data.values !== undefined ? {
            deleteMany: {},
            create: skillsArray(data.values).map((v) => ({ value: v }))
        } : undefined;

        await prisma.user.update({
            where: { id: targetUserId },
            data: await buildProfileUpdateData(
                validated,
                normalizedCoordinates,
                mergedArchetypes,
                { skillDeletes, skillCreates, valueUpdate },
            ),
        });

        // Revalidate profile page
        revalidatePath('/profile');
        revalidatePath(`/profile/${targetUserId}`);

        return { success: true, message: 'Profile updated successfully' };
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logActionError('Error updating profile', msg);
        return { success: false, error: 'Failed to update profile' };
    }
}

export async function saveQuizArchetypesAction(userId: string, archetypes: string[]) {
    const userResult = await getCurrentUserData();
    if (!userResult.success || !userResult.data?.user) {
        return { success: false, error: await localizeActionMessage('profile.notLoggedInForAction') };
    }
    const currentUser = userResult.data.user;
    if (currentUser.id !== userId && !currentUser.isAdmin) {
        return { success: false, error: await localizeActionMessage('profile.notAllowedForAction') };
    }
    const validArchetypes = Object.values(Archetype) as string[];
    const validNew = archetypes.filter(a => validArchetypes.includes(a));
    const existing = await prisma.user.findUnique({ where: { id: userId }, select: { archetypes: true } });
    const existingBase = (existing?.archetypes ?? []).filter(a => BASE_ARCHETYPE_IDS.has(a as string));
    const merged = [...new Set([...existingBase, ...validNew])];
    await prisma.user.update({ where: { id: userId }, data: { archetypes: merged as Archetype[] } });
    revalidatePath('/profile');
    return { success: true };
}

export async function updateFediverseSettingsAction(rawSettings: unknown) {
    try {
        const userResult = await getCurrentUserData();
        if (!userResult.success || !userResult.data?.user) {
            return { success: false, error: 'Not authenticated' };
        }

        const current = await prisma.user.findUnique({
            where: { id: userResult.data.user.id },
            select: {
                federationSettings: true,
                federationConsentAt: true,
            },
        });

        const nextSettings = normalizeFediverseSettings(rawSettings);
        const currentSettings = normalizeFediverseSettings(current?.federationSettings);
        const isEnablingActivityPub = !currentSettings.activityPub.enabled && nextSettings.activityPub.enabled;

        if (isEnablingActivityPub && nextSettings.consentVersion !== FEDIVERSE_CONSENT_VERSION) {
            return {
                success: false,
                error: 'Explicit consent is required before enabling ActivityPub sharing.',
            };
        }

        const settingsToStore = nextSettings.consentVersion === FEDIVERSE_CONSENT_VERSION
            ? withFediverseConsent(nextSettings)
            : nextSettings;

        await prisma.user.update({
            where: { id: userResult.data.user.id },
            data: {
                federationSettings: settingsToStore as unknown as Prisma.InputJsonValue,
                federationConsentAt: settingsToStore.consentVersion === FEDIVERSE_CONSENT_VERSION
                    ? (current?.federationConsentAt ?? new Date())
                    : current?.federationConsentAt ?? undefined,
            },
        });

        revalidatePath('/profile');
        revalidatePath(`/profile/${userResult.data.user.id}`);
        revalidatePath(`/.well-known/webfinger`);

        return { success: true };
    } catch (error) {
        logActionError('Error updating fediverse settings', error);
        return { success: false, error: 'Failed to update fediverse settings' };
    }
}

export async function updateChangemakerLevelAction(userId: string, level: string) {
    try {
        const userResult = await getCurrentUserData();
        if (!userResult.success || !userResult.data?.user) {
            return { success: false, error: await localizeActionMessage('profile.notLoggedInForAction') };
        }

        const currentUser = userResult.data.user;
        const targetUserId = userId || currentUser.id;

        const isOwner = currentUser.id === targetUserId;
        const isAdmin = currentUser.isAdmin === true;

        if (!isOwner && !isAdmin) {
            return { success: false, error: await localizeActionMessage('profile.notAllowedForAction') };
        }

        await prisma.user.update({
            where: { id: targetUserId },
            data: { changemakeLevel: level as ChangemakerLevel }
        });

        revalidatePath('/profile');
        revalidatePath(`/profile/${targetUserId}`);

        return { success: true, message: await localizeActionMessage('profile.levelUpdated') };
    } catch (error) {
        logActionError('Error updating changemaker level', error);
        return { success: false, error: await localizeActionMessage('profile.levelUpdateFailed') };
    }
}

export async function updateRouteOverridesAction(overrides: Record<string, boolean>) {
    try {
        const userResult = await getCurrentUserData();
        if (!userResult.success || !userResult.data?.user) {
            return { success: false, error: 'Not authenticated' };
        }

        await prisma.user.update({
            where: { id: userResult.data.user.id },
            data: { routeOverrides: overrides },
        });

        return { success: true };
    } catch (error) {
        logActionError('Error updating route overrides', error);
        return { success: false, error: 'Failed to update route overrides' };
    }
}

export async function updatePrivacySettingsAction(rawSettings: unknown) {
    try {
        const userResult = await getCurrentUserData();
        if (!userResult.success || !userResult.data?.user) {
            return { success: false, error: 'Not authenticated' };
        }

        const settings = updatePrivacySettingsSchema.parse(rawSettings);

        const showOnMap = settings.showOnMap ?? true;
        const effectiveLocationVisibility = toPersistedVisibility(settings.locationVisibility);

        await prisma.user.update({
            where: { id: userResult.data.user.id },
            data: {
                profileVisibility: toPersistedVisibility(settings.profileVisibility),
                locationVisibility: effectiveLocationVisibility,
                locationPrecision: settings.locationPrecision ? settings.locationPrecision as LocationPrecision : undefined,
                showOnMap,
            },
            select: { id: true },
        });

        revalidatePath('/profile');
        revalidatePath(`/profile/${userResult.data.user.id}`);
        revalidateTag('map', 'default');

        return { success: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0]?.message ?? 'Invalid privacy settings' };
        }
        logActionError('Error updating privacy settings', error);
        return { success: false, error: 'Failed to update privacy settings' };
    }
}

export async function updateEmailNotificationsAction(enabled: boolean): Promise<{ success: boolean; error?: string }> {
    try {
        const userResult = await getCurrentUserData();
        if (!userResult.success || !userResult.data?.user) {
            return { success: false, error: 'Not authenticated' };
        }
        await prisma.user.update({
            where: { id: userResult.data.user.id },
            data: { emailNotificationsEnabled: enabled },
        });
        revalidatePath('/profile');
        return { success: true };
    } catch (error) {
        logActionError('updateEmailNotificationsAction', error);
        return { success: false, error: 'Failed to update email notification preference' };
    }
}

export async function updateUiLanguageAction(language: string) {
    try {
        const allowed = ['hu', 'en', 'es'];
        if (!allowed.includes(language)) {
            return { success: false, error: 'Invalid language' };
        }

        // Set cookie for guest & authenticated users alike
        const cookieStore = await cookies();
        cookieStore.set('cm_ui_language', language, {
            path: '/',
            maxAge: 365 * 24 * 60 * 60, // 1 year
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        });

        const userResult = await getCurrentUserData();
        if (userResult.success && userResult.data?.user) {
            await prisma.user.update({
                where: { id: userResult.data.user.id },
                data: { uiLanguage: language },
            });
        }

        return { success: true };
    } catch (error) {
        logActionError('Error updating UI language', error);
        return { success: false, error: 'Failed to update language' };
    }
}
