'use server';

import { logActionError } from '@/lib/action-logger';
import { isValidDidKey } from '@/lib/did';
import { isHttpUrl } from '@/lib/url-safety';
import crypto from 'node:crypto';
import { z } from 'zod';
import { cookies, headers } from 'next/headers';
import prisma, { InviteStatus, PendingRegistrationMode, ProfileType } from '@/lib/prisma';
import { normalizeCoordinatesForPrecision } from '@/lib/location-precision';
import { hashPassword, hashRefreshToken } from '@/lib/auth';
import { issueSession } from '@/lib/issue-session';
import { parseInviteCodeProfileType } from '@/lib/featureAccess';
import { rateLimitAsync } from '@/lib/rate-limit';
import { LEAN_REG_CONTINUATION_COOKIE_MAX_AGE_SECONDS, signLeanRegCookie, verifyLeanRegCookie } from '@/lib/lean-reg-token';
import { getCurrentUser } from './auth';
import { sendLeanVerificationEmail } from '@/lib/email';
import { getClientIp } from '@/lib/request-ip';
import {
    deleteAbandonedPendingRegistrations,
    isPendingRegistrationDeletable,
    PENDING_REGISTRATION_NAME,
    sendPendingRegistrationContinueEmail,
} from '@/lib/pending-registration-maintenance';
import { isPendingRegistrationAccount } from '@/lib/registration-completion';
import { LEGAL_VERSIONS } from '@/lib/legal-versions';
import { evaluateMatchingReadiness } from '@/lib/lean-register/matching-readiness';
import { markUserActivity } from '@/lib/user-activity';
import { getLocale } from '@/lib/get-locale';
import { appendLanguageParam, authMessage, authT } from '@/lib/auth-localization';
import { buildAbsoluteUrl } from '@/lib/site-url';
import { isUploadedImageDataUrl } from '@/lib/uploaded-images';
import { isRegistrationCountry, isRegistrationTimezone } from '@/lib/registration-location-options';

// ──────────────────────────────────────────────
// Schemas
// ──────────────────────────────────────────────

const initiateSchema = z.object({
    email: z.email('server.errors.invalidEmail'),
    inviteCode: z.string().optional(),
    termsAccepted: z.literal(true, { error: 'server.errors.termsRequired' }),
    confirmedAge16Plus: z.literal(true, { error: 'server.errors.ageRequired' }),
});

const passwordSchema = z
    .string()
    .min(12, 'server.errors.passwordMin')
    .regex(/[A-Z]/, 'server.errors.passwordUppercase')
    .regex(/[a-z]/, 'server.errors.passwordLowercase')
    .regex(/\d/, 'server.errors.passwordNumber')
    .regex(/[^A-Za-z0-9]/, 'server.errors.passwordSpecial');

const completeStep3Schema = z
    .object({
        name: z.string().min(2, 'server.errors.nameMin').max(100),
        displayName: z.string().optional(),
        password: passwordSchema,
        confirmPassword: z.string(),
        primaryLanguage: z.string().min(2, 'server.errors.chooseLanguage'),
        spokenLanguages: z.array(z.string()).min(1, 'server.errors.chooseSpokenLanguage'),
        country: z.string().min(1, 'onboarding.errors.countryRequired').refine(isRegistrationCountry, 'onboarding.errors.countryRequired'),
        city: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        timezone: z.string().optional().refine((value) => !value || isRegistrationTimezone(value), 'server.errors.timezoneInvalid'),
        didPublicKey: z.string().refine(isValidDidKey, 'server.errors.didInvalid').optional(),
    })
    .refine((d) => d.password === d.confirmPassword, { // SAFE: Server-side password confirmation
        message: 'server.errors.passwordsMismatch',
        path: ['confirmPassword'],
    })
    .refine((d) => Boolean(d.city?.trim()) || Boolean(d.timezone?.trim()), {
        message: 'onboarding.errors.timezoneRequired',
        path: ['timezone'],
    });


const socialLinksSchema = z.record(z.string(), z.string().trim().url('server.errors.invalidUrl').refine((value) => isHttpUrl(value), 'server.errors.invalidUrl').or(z.literal(''))).optional();

const leanProfileTrustSchema = z.object({
    profilePhoto: z.string().min(1, 'server.errors.profilePhotoRequired').refine(isUploadedImageDataUrl, 'server.errors.profilePhotoRequired'),
    bio: z.string().trim().min(20, 'server.errors.bioMin20').max(500, 'server.errors.bioMax500'),
    organizationName: z.string().trim().max(120).optional(),
    organizationDescription: z.string().trim().max(500).optional(),
    website: z.string().trim().url('server.errors.invalidUrl').refine((value) => isHttpUrl(value), 'server.errors.invalidUrl').or(z.literal('')).optional(),
    socialLinks: socialLinksSchema,
}).refine((data) => {
    const hasOrganization = Boolean(data.organizationName?.trim());
    const hasWebsite = Boolean(data.website?.trim());
    const hasSocial = Object.values(data.socialLinks ?? {}).some((value) => value.trim().length > 0);
    return hasOrganization || hasWebsite || hasSocial;
}, {
    message: 'server.errors.contextSignalRequired',
    path: ['organizationName'],
});

// ──────────────────────────────────────────────
// Step 1: Initiate lean registration
// Validates invite code, creates a pending user, sends verification email
// ──────────────────────────────────────────────

type InitiateResult = { success: true; directReady?: boolean } | { success: false; error: string };

type ExistingLeanUser = {
    id: string;
    email: string;
    name: string | null;
    passwordHash: string | null;
    isEmailVerified: boolean;
    isRegistrationPending: boolean | null;
    createdAt: Date;
    uiLanguage: string | null;
    pendingRegistrationMode: string | null;
};

// Handle an already-existing account for lean-registration initiation. Returns a
// terminal response when the existing account dictates the outcome (recoverable
// pending account branches, or email-already-registered), or null when the email
// is free to continue with a fresh registration. Side effects (DB updates, cookie,
// continuation email) and branch ordering are preserved exactly from the inline code.
async function handleExistingLeanAccount(
    existing: ExistingLeanUser,
    lang: string,
): Promise<InitiateResult | null> {
    if (!isPendingRegistrationAccount(existing)) {
        return { success: false, error: authT(lang, 'server.errors.emailAlreadyRegistered') };
    }
    if (isPendingRegistrationDeletable(existing.createdAt)) {
        await deleteAbandonedPendingRegistrations();
        return null;
    }
    if (existing.isEmailVerified) {
        const cookieStore = await cookies();
        await prisma.user.update({
            where: { id: existing.id },
            data: { pendingRegistrationMode: PendingRegistrationMode.LEAN },
            select: { id: true },
        });
        cookieStore.set('lean_reg_uid', signLeanRegCookie(existing.id), {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: LEAN_REG_CONTINUATION_COOKIE_MAX_AGE_SECONDS,
            path: '/',
        });
        return { success: true, directReady: true };
    }
    await prisma.user.update({
        where: { id: existing.id },
        data: { pendingRegistrationMode: PendingRegistrationMode.LEAN },
        select: { id: true },
    });
    await sendPendingRegistrationContinueEmail({ ...existing, pendingRegistrationMode: PendingRegistrationMode.LEAN }, { reminder: false, language: lang });
    return { success: true };
}

type ResolvedInvite = {
    invitedByUserId?: string;
    inviteRecordId?: string;
    assignedProfileType?: ProfileType;
};

// Atomically claim/validate the provided invite code. Returns an error response
// when the code is expired/invalid, or the resolved invite metadata on success.
// Mirrors the original claim → lookup → fallback ordering exactly.
async function resolveLeanInvite(
    inviteCode: string,
    normalizedEmail: string,
    lang: string,
): Promise<{ error: InitiateResult } | { error: null; invite: ResolvedInvite }> {
    const claimed = await prisma.invite.updateMany({
        where: {
            code: inviteCode,
            OR: [{ recipientEmail: null }, { recipientEmail: normalizedEmail }],
            status: { in: [InviteStatus.CREATED, InviteStatus.SENT, InviteStatus.OPENED] },
            expiresAt: { gt: new Date() },
        },
        data: {
            status: InviteStatus.ACCEPTED,
            acceptedAt: new Date(),
            lastActivityAt: new Date(),
        },
    });

    if (claimed.count > 0) {
        const inviteRecord = await prisma.invite.findUnique({
            where: { code: inviteCode },
            select: { id: true, createdById: true, isDirect: true, profileType: true, recipientEmail: true },
        });
        return {
            error: null,
            invite: {
                invitedByUserId: inviteRecord?.createdById ?? undefined,
                inviteRecordId: inviteRecord?.id,
                assignedProfileType: inviteRecord?.profileType ?? undefined,
            },
        };
    }

    const existingInvite = await prisma.invite.findUnique({
        where: { code: inviteCode },
        select: { status: true, expiresAt: true },
    });

    if (existingInvite) {
        if (existingInvite.expiresAt < new Date()) {
            return { error: { success: false, error: authT(lang, 'server.errors.inviteExpired') } };
        }
        return { error: { success: false, error: authT(lang, 'server.errors.inviteInvalidUsed') } };
    }

    const inviter = await prisma.user.findUnique({
        where: { invitationCode: inviteCode },
        select: { id: true },
    });
    if (!inviter) return { error: { success: false, error: authT(lang, 'server.errors.inviteInvalid') } };
    return { error: null, invite: { invitedByUserId: inviter.id } };
}

export async function initiateRegistrationAction(
    email: string,
    inviteCode: string,
    termsAccepted: boolean = false,
    confirmedAge16Plus: boolean = false
): Promise<{ success: true; directReady?: boolean } | { success: false; error: string }> {
    const lang = await getLocale();
    try {
        const headerList = await headers();
        const ip = getClientIp(headerList);
        const rl = await rateLimitAsync(`lean_init_${ip}`, 3, 3_600_000);
        if (!rl.success) {
            return { success: false, error: authT(lang, 'server.errors.tooManyOneHour') };
        }

        const validated = initiateSchema.parse({ email, inviteCode, termsAccepted, confirmedAge16Plus });
        const normalizedEmail = validated.email.trim().toLowerCase();

        // Check email not already taken. Incomplete lean registrations are recoverable
        // until the day-7 cleanup window, so users are not stranded by expired cookies.
        const existing = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
                id: true,
                email: true,
                name: true,
                passwordHash: true,
                isEmailVerified: true,
                isRegistrationPending: true,
                createdAt: true,
                uiLanguage: true,
                pendingRegistrationMode: true,
            },
        });
        if (existing) {
            const existingOutcome = await handleExistingLeanAccount(existing, lang);
            if (existingOutcome) return existingOutcome;
        }

        // Validate invite code when provided. No-code signups are allowed, but remain suspended until admin approval.
        let invitedByUserId: string | undefined;
        let inviteRecordId: string | undefined;
        let assignedProfileType: ProfileType | undefined;

        if (validated.inviteCode) {
            const resolved = await resolveLeanInvite(validated.inviteCode, normalizedEmail, lang);
            if (resolved.error) return resolved.error;
            invitedByUserId = resolved.invite.invitedByUserId;
            inviteRecordId = resolved.invite.inviteRecordId;
            assignedProfileType = resolved.invite.assignedProfileType;
        }

        // Create minimal pending user (no password, name placeholder)
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenHash = hashRefreshToken(verificationToken);
        const profileType = assignedProfileType ?? parseInviteCodeProfileType(validated.inviteCode || '');
        const hasValidInvite = Boolean(invitedByUserId);

        const newUser = await prisma.user.create({
            data: {
                email: normalizedEmail,
                name: PENDING_REGISTRATION_NAME,
                isRegistrationPending: true,
                isEmailVerified: false,
                pendingRegistrationMode: PendingRegistrationMode.LEAN,
                verificationToken: verificationTokenHash,
                verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
                profileType: profileType as ProfileType,
                primaryLanguage: lang,
                spokenLanguages: [],
                uiLanguage: lang,
                termsAcceptedAt: new Date(),
                termsVersion: LEGAL_VERSIONS.terms,
                privacyVersion: LEGAL_VERSIONS.privacy,
                // G3 (Art. 8): persist the validated self-declaration — initiateSchema
                // enforces z.literal(true), so this is true, but tying it to the
                // validated value prevents a future schema change silently confirming.
                confirmedAge16Plus: validated.confirmedAge16Plus,
                confirmedAge16PlusAt: new Date(),
                profileCompleteness: 0,
                invitedById: invitedByUserId,
                usedInviteCode: validated.inviteCode || null,
                isSuspended: !hasValidInvite,
            },
            select: {
                id: true,
                email: true,
            },
        });

        // Bootstrap onboarding state and functional profile
        await prisma.$transaction([
            prisma.userOnboardingState.create({
                data: { userId: newUser.id, lastStageCompleted: 0 },
            }),
            prisma.userFunctionalProfile.create({
                data: { userId: newUser.id, energisingFunctions: [], drainingFunctions: [] },
            }),
        ]);

        // Link the accepted invite to the created user.
        if (inviteRecordId) {
            await prisma.invite.update({
                where: { id: inviteRecordId },
                data: { recipientId: newUser.id, lastActivityAt: new Date() },
            });
        }

        // Send verification email (links to /api/register/verify route handler)
        await sendLeanVerificationEmail(
            normalizedEmail,
            appendLanguageParam(buildAbsoluteUrl(`/api/register/verify?token=${verificationToken}`), lang),
            lang
        );

        return { success: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: authMessage(lang, error.issues[0]?.message, 'server.errors.invalidData') };
        }
        if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002') {
            return { success: false, error: authT(lang, 'server.errors.emailAlreadyRegistered') };
        }
        logActionError('Lean registration initiate error', error);
        return { success: false, error: authT(lang, 'server.errors.genericTryAgain') };
    }
}

// ──────────────────────────────────────────────
// Step 3: Complete identity (name, password, language)
// Reads lean_reg_uid cookie set by the email verify route
// ──────────────────────────────────────────────

export async function completeRegistrationAction(data: {
    name: string;
    displayName?: string;
    password: string;
    confirmPassword: string;
    primaryLanguage: string;
    spokenLanguages: string[];
    country: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    didPublicKey?: string;
    timezone?: string;
}): Promise<{ success: true; userId: string; pendingApproval?: boolean } | { success: false; error: string; code?: 'session-expired' }> {
    const lang = await getLocale();
    try {
        // Verify lean_reg_uid cookie
        const cookieStore = await cookies();
        const signedCookie = cookieStore.get('lean_reg_uid')?.value;
        if (!signedCookie) {
            // Mid-session expiry: the continuation cookie lapsed while Step 3 was open.
            // The stable `code` lets the client surface the self-service recovery form
            // instead of a dead-end error string (AUDIT-20260613-027). Deliberately not
            // set on the invalid-cookie (restart) branch below — that is a different flow.
            return {
                success: false,
                error: authT(lang, 'server.errors.sessionExpiredContinue'),
                code: 'session-expired',
            };
        }

        const userId = verifyLeanRegCookie(signedCookie);
        if (!userId) {
            return {
                success: false,
                error: authT(lang, 'server.errors.invalidSessionRestart'),
            };
        }

        const validated = completeStep3Schema.parse(data);
        const normalizedCoordinates = normalizeCoordinatesForPrecision(validated.latitude, validated.longitude);
        const normalizedTimezone = validated.timezone?.trim() || null;

        // Guard: find pending user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                isEmailVerified: true,
                passwordHash: true,
                isRegistrationPending: true,
                profileType: true,
                isSuspended: true,
            },
        });

        if (!user) return { success: false, error: authT(lang, 'server.errors.userNotFound') };
        if (!user.isEmailVerified) {
            return { success: false, error: authT(lang, 'server.errors.emailNotVerified') };
        }
        if (user.passwordHash) {
            return { success: false, error: authT(lang, 'server.errors.accountAlreadySetup') };
        }

        const passwordHash = await hashPassword(validated.password);

        // Account finalize + onboarding-state write must be atomic (AUDIT-20260613-030).
        await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: userId },
                data: {
                    name: validated.name,
                    displayName: validated.displayName || null,
                    passwordHash,
                    isRegistrationPending: false,
                    pendingRegistrationMode: null,
                    primaryLanguage: validated.primaryLanguage,
                    spokenLanguages: validated.spokenLanguages,
                    uiLanguage: validated.primaryLanguage,
                    country: validated.country,
                    city: validated.city || null,
                    latitude: normalizedCoordinates.latitude,
                    longitude: normalizedCoordinates.longitude,
                    timezone: normalizedTimezone,
                    didPublicKey: validated.didPublicKey,
                    profileCompleteness: 15,
                    verificationToken: null,
                    verificationTokenExpiry: null,
                },
                select: { id: true },
            });

            // Update onboarding state
            await tx.userOnboardingState.upsert({
                where: { userId },
                create: { userId, lastStageCompleted: 1, stage1CompletedAt: new Date() },
                update: { lastStageCompleted: 1, stage1CompletedAt: new Date() },
            });
        });

        if (user.isSuspended) {
            cookieStore.delete('lean_reg_uid');
            return { success: true, userId, pendingApproval: true };
        }

        // Newly created accounts cannot have 2FA enabled; route through the single
        // session chokepoint so full-session issuance always flows through one place.
        await issueSession({
            id: userId,
            email: user.email,
            profileType: user.profileType,
            isTotpEnabled: false,
        });
        await markUserActivity(userId, { login: true });

        // Clear the lean registration session cookie
        cookieStore.delete('lean_reg_uid');

        return { success: true, userId };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: authMessage(lang, error.issues[0]?.message, 'server.errors.invalidData') };
        }
        logActionError('Lean registration complete step3 error', error);
        return { success: false, error: authT(lang, 'server.errors.genericTryAgain') };
    }
}

// ──────────────────────────────────────────────
// Step 4: Save lean profile trust fields
// ──────────────────────────────────────────────

export async function saveLeanProfileTrustAction(
    userId: string,
    data: {
        profilePhoto: string;
        bio: string;
        organizationName?: string;
        organizationDescription?: string;
        website?: string;
        socialLinks?: Record<string, string>;
    },
): Promise<{ success: true } | { success: false; error: string }> {
    const lang = await getLocale();
    try {
        const res = await getCurrentUser();
        if (!res.success || !res.data?.user) {
            return { success: false, error: authT(lang, 'server.errors.notAuthenticated') };
        }

        const currentUser = res.data.user;
        if (currentUser.id !== userId && currentUser.isAdmin !== true) {
            return { success: false, error: authT(lang, 'server.errors.notAuthorized') };
        }

        const validated = leanProfileTrustSchema.parse(data);
        const cleanedSocialLinks = Object.fromEntries(
            Object.entries(validated.socialLinks ?? {})
                .map(([key, value]) => [key, value.trim()] as const)
                .filter(([, value]) => value.length > 0),
        );
        const now = new Date();

        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: {
                    profilePhoto: validated.profilePhoto,
                    bio: validated.bio,
                    organizationName: validated.organizationName?.trim() || null,
                    organizationDescription: validated.organizationDescription?.trim() || null,
                    website: validated.website?.trim() || null,
                    socialLinks: Object.keys(cleanedSocialLinks).length > 0 ? cleanedSocialLinks : undefined,
                    profileCompleteness: 25,
                },
                select: { id: true },
            }),
            prisma.userOnboardingState.upsert({
                where: { userId },
                create: { userId, lastStageCompleted: 2, stage2CompletedAt: now },
                update: { lastStageCompleted: { set: 2 }, stage2CompletedAt: now },
            }),
        ]);

        return { success: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: authMessage(lang, error.issues[0]?.message, 'server.errors.invalidData') };
        }
        return { success: false, error: authT(lang, 'server.errors.genericTryAgain') };
    }
}

// ──────────────────────────────────────────────
// Step 6: Mark matching activation complete
// ──────────────────────────────────────────────

export async function completeMatchingActivationAction(
    userId: string,
    specialCategoryConsent: boolean = false
): Promise<{ success: true } | { success: false; error: string }> {
    const lang = await getLocale();
    try {
        const res = await getCurrentUser();
        if (!res.success || !res.data?.user) {
            return { success: false, error: authT(lang, 'server.errors.notAuthenticated') };
        }

        const currentUser = res.data.user;
        if (currentUser.id !== userId && currentUser.isAdmin !== true) {
            return { success: false, error: authT(lang, 'server.errors.notAuthorized') };
        }

        if (specialCategoryConsent !== true) {
            return { success: false, error: authT(lang, 'server.errors.explicitConsentRequired') };
        }

        const readiness = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                archetypes: true,
                skills: { select: { skill: true, skillType: true } },
                mainCauses: { select: { id: true }, take: 1 },
                onboardingState: { select: { charterVersion: true, lastStageCompleted: true } },
                profilePhoto: true,
                bio: true,
                organizationName: true,
                website: true,
                socialLinks: true,
                functionalProfile: {
                    select: {
                        availabilityMode: true,
                        contributionSeedType: true,
                        contributionSeedText: true,
                        rdgMain: true,
                        rdgInterested: true,
                    },
                },
            },
        });
        const readinessError = evaluateMatchingReadiness(readiness);
        if (readinessError) {
            return { success: false, error: authT(lang, readinessError) };
        }

        const now = new Date();
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: {
                    profileCompleteness: 55,
                    allowSensitiveMatching: true,
                    specialCategoryConsentAt: now,
                    specialCategoryConsentVersion: LEGAL_VERSIONS.privacy,
                    specialCategoryConsentSource: 'lean_matching_activation',
                    specialCategoryConsentWithdrawnAt: null,
                },
                select: { id: true },
            }),
            prisma.userOnboardingState.upsert({
                where: { userId },
                create: { userId, lastStageCompleted: 6, stage6CompletedAt: now },
                update: { lastStageCompleted: 6, stage6CompletedAt: now },
            }),
        ]);

        return { success: true };
    } catch {
        return { success: false, error: authT(lang, 'server.errors.matchingActivationFailed') };
    }
}
// ──────────────────────────────────────────────
// Dashboard: Dismiss the welcome onboarding banner
// ──────────────────────────────────────────────

export async function dismissOnboardingBannerAction(): Promise<{ success: boolean }> {
    try {
        const res = await getCurrentUser();
        if (!res.success || !res.data) return { success: false };
        const userId = res.data.user.id;

        await prisma.userOnboardingState.upsert({
            where: { userId },
            create: { userId, orientationSeenAt: new Date() },
            update: { orientationSeenAt: new Date() },
        });

        return { success: true };
    } catch {
        return { success: false };
    }
}
