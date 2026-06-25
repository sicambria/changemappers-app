/**
 * Server-side utility: get the currently authenticated user from cookies.
 *
 * This file intentionally has NO 'use server' directive so it can be called
 * as a plain function from both Server Actions and Server Components without
 * crossing a 'use server' module boundary (which can silently drop the
 * request-cookie context in Next.js 15/16 Turbopack builds).
 */

import { cache } from 'react';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyAccessToken, refreshAccessToken } from '@/lib/auth';
import { setAuthCookies } from '@/lib/set-auth-cookies';

export type CurrentUserCause = { id: string; title: string };

export interface CurrentUserData {
    id: string;
    email: string;
    name: string;
    displayName?: string;
    bio?: string;
    website?: string;
    didPublicKey?: string;
    socialLinks?: Record<string, string>;
    federationSettings?: unknown;
    federationConsentAt?: string;
    city?: string;
    country?: string;
    motto?: string;
    timezone?: string;
    latitude?: number;
    longitude?: number;
    organizationName?: string;
    organizationDescription?: string;
    isRemoteCapable: boolean;
    enjoyDoing?: string;
    currentIntention?: string;
    collaborationPreference: string[];
    constraints?: string;
    availabilityDetails?: unknown;
    mainCommunity?: string;
    rdgAreas: string[];
    archetypes: string[];
    changemakeLevel?: string;
    profileType?: string;
    isAdmin?: boolean;
    profileVisibility?: string;
    profilePhoto?: string;
    coverImage?: string;
    isEmailVerified: boolean;
    verificationLevel: string;
    uiLanguage?: string;
    skills?: unknown[];
    values?: unknown[];
    interests?: unknown[];
    mainCauses?: CurrentUserCause[];
    interestedCauses?: CurrentUserCause[];
    connectionCount?: number;
    cmapLevel?: number | null;
    featureVisibilityPreferences?: Record<string, boolean> | null;
    emailNotificationsEnabled?: boolean;
}

export type CurrentUserResult =
  | {
      success: true;
      data: { user: CurrentUserData };
      error?: never;
      message?: string;
    }
  | {
      success: false;
      data?: never;
      error: string;
      message?: string;
    };

const baseUserSelect = {
    id: true,
    email: true,
    name: true,
    displayName: true,
    bio: true,
    website: true,
    didPublicKey: true,
    socialLinks: true,
    city: true,
    country: true,
    motto: true,
    timezone: true,
    latitude: true,
    longitude: true,
    organizationName: true,
    organizationDescription: true,
    isRemoteCapable: true,
    enjoyDoing: true,
    currentIntention: true,
    collaborationPreference: true,
    constraints: true,
    availabilityDetails: true,
    mainCommunity: true,
    rdgAreas: true,
    archetypes: true,
    changemakeLevel: true,
    profileType: true,
    isAdmin: true,
    profileVisibility: true,
    profilePhoto: true,
    coverImage: true,
    isEmailVerified: true,
    verificationLevel: true,
    skills: true,
    values: true,
    interests: true,
    mainCauses: { select: { id: true, title: true } },
    interestedCauses: { select: { id: true, title: true } },
    uiLanguage: true,
    featureVisibilityPreferences: true,
    emailNotificationsEnabled: true,
    functionalProfile: { select: { cmapLevel: true } },
    _count: {
        select: {
            sentConnections: true,
            receivedConnections: true,
        }
    },
} as const;

let supportsFederationColumns: boolean | null = null;

function isMissingFederationSettingsColumn(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
        return false;
    }

    const candidate = error as { code?: string; message?: string };
    return candidate.code === 'P2022'
        && typeof candidate.message === 'string'
        && candidate.message.includes('User.federationSettings');
}

function canPersistRotatedAuthCookies(cookieStore: Awaited<ReturnType<typeof cookies>>): boolean {
    try {
        cookieStore.set('__auth_cookie_write_probe', '1', {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 0,
            path: '/',
        });
        return true;
    } catch {
        return false;
    }
}

/**
 * Resolves a verified access token payload from the cookie store, performing
 * refresh-rotation when the access token is expired but a refresh token exists
 * and cookies are writable. Returns null if no valid payload can be obtained.
 */
async function resolveAccessPayload(
    cookieStore: Awaited<ReturnType<typeof cookies>>,
    token: string | undefined,
    refreshTokenCookie: string | undefined,
): Promise<ReturnType<typeof verifyAccessToken>> {
    let payload = token ? verifyAccessToken(token) : null;

    if (!payload && refreshTokenCookie) {
        if (canPersistRotatedAuthCookies(cookieStore)) {
            const newTokens = await refreshAccessToken(refreshTokenCookie);
            if (newTokens) {
                await setAuthCookies(newTokens.accessToken, newTokens.refreshToken);
                payload = verifyAccessToken(newTokens.accessToken);
            }
        }
    }

    return payload;
}

/**
 * Fetches the user row by id with federation columns when the schema supports
 * them, falling back to base columns when the column-missing Prisma error
 * (P2022 / User.federationSettings) indicates the migration has not yet run.
 * The `supportsFederationColumns` module-level flag is updated on each call so
 * subsequent requests avoid the redundant try/catch.
 */
async function fetchUserWithFederationFallback(userId: string) {
    try {
        if (supportsFederationColumns === false) {
            return await prisma.user.findUnique({
                where: { id: userId },
                select: baseUserSelect,
            });
        } else {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    ...baseUserSelect,
                    federationSettings: true,
                    federationConsentAt: true,
                }
            });
            supportsFederationColumns = true;
            return user;
        }
    } catch (error) {
        if (!isMissingFederationSettingsColumn(error)) {
            throw error;
        }

        supportsFederationColumns = false;
        return await prisma.user.findUnique({
            where: { id: userId },
            select: baseUserSelect,
        });
    }
}

/**
 * Wrapped in React `cache()` so the user lookup (cookie verification + Prisma
 * query) runs at most once per request even when called from the root layout,
 * `getLocale()`, pages, and server actions in the same render pass
 * (AUDIT-20260613-013). `cache()` is request-scoped on the server (never
 * shared across users/requests); outside a React server request scope it is a
 * passthrough, so unit tests and scripts keep per-call semantics.
 */
export const getCurrentUserData = cache(async (): Promise<CurrentUserResult> => {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        const refreshTokenCookie = cookieStore.get('refreshToken')?.value;

        if (!token && !refreshTokenCookie) {
            return { success: false, error: 'No token' };
        }

        const payload = await resolveAccessPayload(cookieStore, token, refreshTokenCookie);

        if (!payload) {
            return { success: false, error: 'Invalid token' };
        }

        const user = await fetchUserWithFederationFallback(payload.userId);

  if (!user) {
    // User not found in DB - session is stale (e.g., after DB reset)
    // Clear the invalid session cookies
    console.warn('[getCurrentUser] User not found in DB for id:', payload.userId, '- clearing stale session');
    const cookieStore = await cookies();
    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');
    return { success: false, error: 'User not found' };
  }

        return {
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    displayName: user.displayName || undefined,
                    bio: user.bio || undefined,
                    website: user.website || undefined,
                    didPublicKey: user.didPublicKey || undefined,
                    socialLinks: (user.socialLinks as Record<string, string> | null) ?? undefined,
                    federationSettings: 'federationSettings' in user ? user.federationSettings ?? undefined : undefined,
                    federationConsentAt: 'federationConsentAt' in user
                        && user.federationConsentAt instanceof Date
                        ? user.federationConsentAt.toISOString()
                        : undefined,
                    city: user.city || undefined,
                    country: user.country || undefined,
                    motto: user.motto || undefined,
                    timezone: user.timezone || undefined,
                    latitude: user.latitude ?? undefined,
                    longitude: user.longitude ?? undefined,
                    organizationName: user.organizationName || undefined,
                    organizationDescription: user.organizationDescription || undefined,
                    isRemoteCapable: user.isRemoteCapable,
                    enjoyDoing: user.enjoyDoing || undefined,
                    currentIntention: user.currentIntention || undefined,
                    collaborationPreference: (user.collaborationPreference) || [],
                    constraints: user.constraints || undefined,
                    availabilityDetails: user.availabilityDetails,
                    mainCommunity: user.mainCommunity || undefined,
                    rdgAreas: (user.rdgAreas) || [],
                    archetypes: (user.archetypes as string[]) || [],
                    changemakeLevel: user.changemakeLevel || undefined,
                    profileType: user.profileType || 'GUEST',
                    isAdmin: user.isAdmin ?? false,
                    profileVisibility: user.profileVisibility,
                    profilePhoto: user.profilePhoto || undefined,
                    coverImage: user.coverImage || undefined,
                    isEmailVerified: user.isEmailVerified,
                    verificationLevel: user.verificationLevel,
                    uiLanguage: user.uiLanguage || 'hu',
                    skills: user.skills,
                    values: user.values,
                    interests: user.interests,
                    mainCauses: user.mainCauses.map((c: { id: string; title: string | null }) => ({ id: c.id, title: c.title || c.id })),
                    interestedCauses: user.interestedCauses.map((c: { id: string; title: string | null }) => ({ id: c.id, title: c.title || c.id })),
                    connectionCount: (user._count?.sentConnections ?? 0) + (user._count?.receivedConnections ?? 0),
                    cmapLevel: user.functionalProfile?.cmapLevel ?? null,
                    featureVisibilityPreferences: (user.featureVisibilityPreferences as Record<string, boolean> | null) ?? null,
                    emailNotificationsEnabled: user.emailNotificationsEnabled ?? true,
                }
            }
        };
    } catch (err) {
        if (err && typeof err === 'object' && 'digest' in err && err.digest === 'DYNAMIC_SERVER_USAGE') {
            throw err;
        }
        console.error('[getCurrentUser] Unexpected error:', err);
        return { success: false, error: 'Failed to get current user' };
    }
});

/**
 * Flattened helper for use in server actions.
 * Returns `{ success: true, data: CurrentUserData }` so actions can write
 * `auth.data.id` without the extra `.user` nesting.
 */
export async function getCurrentUser(): Promise<
  { success: true; data: CurrentUserData } | { success: false; data: null; error: string }
> {
    const result = await getCurrentUserData();
    if (!result.success) {
        return { success: false, data: null, error: result.error };
    }
    return { success: true, data: result.data.user };
}
