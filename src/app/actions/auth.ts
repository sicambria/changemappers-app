'use server';

import { logActionError } from '@/lib/action-logger';
import { DAY_MS } from '@/lib/constants';
import { z } from 'zod';
import type { ApiResponse } from '@/types/common';
import {
    loginSchema,
    registerSchema,
    passwordSchema,
    registerNeutralResponse,
    isPrismaUniqueConstraintError,
    type LoginCredentials,
    type RegisterData,
} from '@/lib/auth-schemas';


import crypto from 'node:crypto';
import { cookies, headers } from 'next/headers';
import prisma, { PendingRegistrationMode, ProfileType, InviteStatus } from '@/lib/prisma';
import { hashPassword, verifyPassword, revokeAuthTokens, hashRefreshToken } from '@/lib/auth';
import { parseInviteCodeProfileType } from '@/lib/featureAccess';
import { getCurrentUserData } from '@/lib/get-current-user';
import { issueSession } from '@/lib/issue-session';
import { sendLeanVerificationEmail } from '@/lib/email';
import { sendPendingRegistrationContinueEmail } from '@/lib/pending-registration-maintenance';
import { isPendingRegistrationAccount } from '@/lib/registration-completion';
import { shouldUseSecureAuthCookies } from '@/lib/auth-cookie-policy';
import { rateLimitAsync } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { buildAbsoluteUrl } from '@/lib/site-url';
import { getLocale } from '@/lib/get-locale';
import { appendLanguageParam, authMessage, authT } from '@/lib/auth-localization';
import { getClientIp } from '@/lib/request-ip';
import { LEGAL_VERSIONS } from '@/lib/legal-versions';
import { markUserActivity } from '@/lib/user-activity';
import { createAuditLog } from '@/lib/audit';
import { registerFailedAttempt } from '@/lib/auth-lockout';
import { evaluatePreAuthLoginGate, evaluatePostAuthLoginGate } from '@/lib/auth/login-gates';



/**
 * Helper: Get current user from cookies.
 * Delegates to the non-'use server' utility so this Server Action file's
 * boundary does not interfere with cookie context propagation.
 */
export async function getCurrentUser() {
    return getCurrentUserData();
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse<null>> {
  const lang = await getLocale();
  try {
    const currentUserResult = await getCurrentUserData();
    if (!currentUserResult.success || !currentUserResult.data?.user.id) {
      return { success: false, error: authT(lang, 'server.errors.notAuthenticated') };
    }

    passwordSchema.parse(newPassword);

    const user = await prisma.user.findUnique({
      where: { id: currentUserResult.data.user.id },
      select: { id: true, name: true, passwordHash: true, isRegistrationPending: true, deletedAt: true, isSuspended: true },
    });

    if (!user || user.deletedAt || user.isSuspended || isPendingRegistrationAccount(user)) {
      return { success: false, error: 'Authentication required' };
    }

    if (!user.passwordHash) {
      return { success: false, error: authT(lang, 'server.errors.passwordLoginDisabled') };
    }

    const currentIsValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!currentIsValid) {
      return { success: false, error: authT(lang, 'server.errors.currentPasswordIncorrect') };
    }

    const samePassword = await verifyPassword(newPassword, user.passwordHash);
    if (samePassword) {
      return { success: false, error: authT(lang, 'server.errors.differentNewPassword') };
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        tokenInvalidatedAt: new Date(),
      },
      select: { id: true },
    });

    return { success: true, data: null, message: authT(lang, 'server.errors.passwordChanged') };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: authMessage(lang, error.issues[0]?.message, 'server.errors.invalidPassword') };
    }
    return { success: false, error: authT(lang, 'server.errors.passwordChangeFailed') };
  }
}

/** Authenticated user record shape used by the login I/O helpers below. */
type LoginUserRecord = {
    id: string;
    email: string;
    name: string;
    profileType: ProfileType;
    isAdmin: boolean;
    isTotpEnabled: boolean;
    failedLoginAttempts: number;
    lockedUntil: Date | null;
};

/**
 * Records a failed login attempt at the account level and locks with exponential
 * backoff once the threshold is crossed (AUDIT-20260613-041). Persists the new
 * counter/lock, writes a LOGIN_FAILED audit log, and a one-shot ACCOUNT_LOCKED
 * audit log on the transition attempt. The caller returns the generic message.
 */
async function handleFailedLoginAttempt(user: Pick<LoginUserRecord, 'id' | 'email' | 'failedLoginAttempts'>): Promise<void> {
    const lockout = registerFailedAttempt(user.failedLoginAttempts);
    await prisma.user.update({
        where: { id: user.id },
        data: {
            failedLoginAttempts: lockout.failedLoginAttempts,
            lockedUntil: lockout.lockedUntil,
        },
        select: { id: true },
    });
    await createAuditLog({
        userId: user.id,
        userEmail: user.email,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        metadata: { failedLoginAttempts: lockout.failedLoginAttempts },
    });
    if (lockout.justLocked) {
        await createAuditLog({
            userId: user.id,
            userEmail: user.email,
            action: 'ACCOUNT_LOCKED',
            entityType: 'User',
            entityId: user.id,
            metadata: {
                failedLoginAttempts: lockout.failedLoginAttempts,
                lockedUntil: lockout.lockedUntil?.toISOString(),
            },
        });
    }
}

/**
 * On a correct password, clears any accumulated brute-force counter / stale lock.
 * No-ops when the account had no counter or lock to clear.
 */
async function clearFailedLoginCounter(user: Pick<LoginUserRecord, 'id' | 'failedLoginAttempts' | 'lockedUntil'>): Promise<void> {
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
        await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
            select: { id: true },
        });
    }
}

/**
 * Issues the session through the single chokepoint and assembles the success
 * response. When 2FA is enabled, `issueSession` mints ONLY a short-lived
 * MFA-challenge cookie (no access token) and the client must complete the
 * second factor at /verify-2fa — the LOGIN audit + activity marking happen there
 * once the full session is granted, so they are skipped on the MFA-required path.
 */
async function finalizeLogin(
    user: LoginUserRecord,
    lang: string,
): Promise<ApiResponse<{ user: { id: string; email: string; name: string } }> & { mfaRequired?: boolean }> {
    const session = await issueSession({
        id: user.id,
        email: user.email,
        profileType: user.profileType,
        isAdmin: user.isAdmin,
        isTotpEnabled: user.isTotpEnabled,
    });

    const userData = { id: user.id, email: user.email, name: user.name };

    if (session.status === 'mfa_required') {
        return {
            success: true,
            mfaRequired: true,
            data: { user: userData },
            message: authT(lang, 'server.errors.twoFactorRequired'),
        };
    }

    await markUserActivity(user.id, { login: true });

    await createAuditLog({
        userId: user.id,
        userEmail: user.email,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
    });

    return {
        success: true,
        data: { user: userData },
        message: authT(lang, 'server.errors.loginSuccess'),
    };
}

/**
 * Login action - authenticates user with email/password
 */
export async function loginAction(
    credentials: LoginCredentials
): Promise<ApiResponse<{ user: { id: string; email: string; name: string } }> & { mfaRequired?: boolean }> {
    const lang = await getLocale();
    try {
        const headerList = await headers();
        const ip = getClientIp(headerList);
        const rl = await rateLimitAsync(`login_${ip}`, 5, 60000);
        if (!rl.success) {
            return { success: false, error: authT(lang, 'server.errors.tooManyLogin') };
        }

        const validated = loginSchema.parse(credentials);

const user = await prisma.user.findUnique({
      where: { email: validated.email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        profileType: true,
        isAdmin: true,
        deletedAt: true,
        isSuspended: true,
        isEmailVerified: true,
        isRegistrationPending: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        isTotpEnabled: true,
      },
    });

        // Pre-authentication rejection gates (no passwordHash, pending, soft-deleted,
        // account-level brute-force lockout — AUDIT-20260613-041). All return the SAME
        // generic credentials error (no enumeration oracle) and run BEFORE the password
        // is verified, so a correct password is still rejected during the lock window.
        const preAuthGate = evaluatePreAuthLoginGate(user);
        if (preAuthGate) {
            return { success: false, error: authT(lang, preAuthGate) };
        }
        // A passing pre-auth gate guarantees `user` is non-null with a passwordHash
        // (the first gate rejects `!user?.passwordHash`); narrow for the typechecker.
        const authedUser = user as NonNullable<typeof user> & { passwordHash: string };

        const isValid = await verifyPassword(validated.password, authedUser.passwordHash);

        if (!isValid) {
            await handleFailedLoginAttempt(authedUser);
            return {
                success: false,
                error: authT(lang, 'server.errors.invalidCredentials'),
            };
        }

        // Correct password: clear any accumulated brute-force counter / stale lock.
        await clearFailedLoginCounter(authedUser);

        // Post-authentication rejection gates (suspended, unverified email) run only
        // AFTER the password is verified so the distinct messages cannot be used as a
        // user-enumeration oracle (AUDIT-20260613-005).
        const postAuthGate = evaluatePostAuthLoginGate(authedUser);
        if (postAuthGate) {
            return { success: false, error: authT(lang, postAuthGate) };
        }

        return await finalizeLogin(authedUser, lang);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const issues = error.issues || [];
            return {
                success: false,
                error: authMessage(lang, issues[0]?.message, 'server.errors.invalidData'),
            };
        }

        logActionError('[auth] loginAction failed after credential submission', error);

        return {
            success: false,
            error: authT(lang, 'server.errors.loginFailed'),
        };
    }
}

type ExistingRegisterUser = {
    id: string;
    email: string;
    name: string | null;
    isRegistrationPending: boolean | null;
    isEmailVerified: boolean;
    deletedAt: Date | null;
    isSuspended: boolean;
    createdAt: Date;
    uiLanguage: string | null;
    pendingRegistrationMode: PendingRegistrationMode | null;
};

// Side-effect handler for the "email already exists" branch of registerAction:
// resends a continuation or verification email when appropriate. The caller always
// returns the neutral response afterward, so this returns void. Branch ordering and
// the active/non-deleted/non-suspended guard are preserved exactly from the inline code.
async function notifyExistingRegisterAccount(
    existingUser: ExistingRegisterUser,
    normalizedEmail: string,
    lang: string,
): Promise<void> {
    if (existingUser.deletedAt || existingUser.isSuspended) return;
    if (isPendingRegistrationAccount(existingUser)) {
        await sendPendingRegistrationContinueEmail(existingUser, { reminder: false, language: lang });
        return;
    }
    if (existingUser.isEmailVerified) return;
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
        where: { id: existingUser.id },
        data: {
            verificationToken: hashRefreshToken(token),
            verificationTokenExpiry: new Date(Date.now() + DAY_MS),
        },
        select: { id: true },
    });
    await sendLeanVerificationEmail(normalizedEmail, appendLanguageParam(buildAbsoluteUrl(`/verify-email?token=${token}`), lang), lang);
}

type RegisterResolvedInvite = {
    invitedByUserId?: string;
    inviteRecordId?: string;
    assignedProfileType?: ProfileType;
    exactDirectInviteBypassEmailVerification: boolean;
};

// Atomically claim the invitation code (if any) and resolve invite metadata, with a
// legacy user.invitationCode fallback. Returns an error response when a provided code
// is invalid/used, or the resolved metadata. Mirrors the inline claim → record-lookup
// → legacy-fallback ordering exactly.
async function resolveRegisterInvite(
    invitationCode: string,
    normalizedEmail: string,
    lang: string,
): Promise<{ error: ApiResponse<{ user: { id: string; email: string } }> } | { error: null; invite: RegisterResolvedInvite }> {
    const hasInviteCode = invitationCode.trim().length > 0;

    const claimed = hasInviteCode ? await prisma.invite.updateMany({
        where: {
            code: invitationCode,
            OR: [{ recipientEmail: null }, { recipientEmail: normalizedEmail }],
            status: { in: [InviteStatus.CREATED, InviteStatus.SENT, InviteStatus.OPENED] },
            expiresAt: { gt: new Date() },
        },
        data: { status: InviteStatus.ACCEPTED, acceptedAt: new Date(), lastActivityAt: new Date() },
    }) : { count: 0 };

    if (claimed.count > 0) {
        const inviteRecord = await prisma.invite.findUnique({
            where: { code: invitationCode },
            select: { id: true, createdById: true, isDirect: true, profileType: true, recipientEmail: true },
        });
        return {
            error: null,
            invite: {
                invitedByUserId: inviteRecord?.createdById ?? undefined,
                inviteRecordId: inviteRecord?.id,
                assignedProfileType: inviteRecord?.profileType ?? undefined,
                exactDirectInviteBypassEmailVerification: Boolean(inviteRecord?.isDirect && inviteRecord.recipientEmail?.trim().toLowerCase() === normalizedEmail),
            },
        };
    }

    if (hasInviteCode) {
        // Fallback: check legacy user.invitationCode field.
        const inviter = await prisma.user.findUnique({
            where: { invitationCode },
            select: { id: true },
        });
        if (!inviter) {
            return { error: { success: false, error: authT(lang, 'server.errors.inviteInvalidUsed') } };
        }
        return { error: null, invite: { invitedByUserId: inviter.id, exactDirectInviteBypassEmailVerification: false } };
    }

    return { error: null, invite: { exactDirectInviteBypassEmailVerification: false } };
}

// Maps a registerAction failure to its ApiResponse. Extracted module-scope so the
// catch block's error-type branching doesn't count toward registerAction's
// cognitive complexity (S3776). Behavior identical to the inline catch.
function mapRegisterError(
    error: unknown,
    lang: Awaited<ReturnType<typeof getLocale>>,
): ApiResponse<{ user: { id: string; email: string } }> {
    if (error instanceof z.ZodError) {
        const issues = error.issues || [];
        return {
            success: false,
            error: authMessage(lang, issues[0]?.message, 'server.errors.invalidData'),
        };
    }
    if (isPrismaUniqueConstraintError(error)) {
        return registerNeutralResponse(lang) as unknown as ApiResponse<{ user: { id: string; email: string } }>;
    }
    logger.error({ msg: 'Registration error', err: error instanceof Error ? error.message : String(error) });
    return {
        success: false,
        error: authT(lang, 'server.errors.registrationFailed'),
    };
}

/**
 * Register action - creates new user account
 */
export async function registerAction(
    data: RegisterData
): Promise<ApiResponse<{ user: { id: string; email: string } }>> {
    const lang = await getLocale();
    try {
        const headerList = await headers();
        const ip = getClientIp(headerList);
        const rl = await rateLimitAsync(`register_${ip}`, 3, 3600000);
        if (!rl.success) {
            return { success: false, error: authT(lang, 'server.errors.tooManyRegistration') };
        }

        const validated = registerSchema.parse(data);
        const normalizedEmail = validated.email.trim().toLowerCase();

        // Check if email exists
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
                id: true,
                email: true,
                name: true,
                passwordHash: true,
                isRegistrationPending: true,
                isEmailVerified: true,
                deletedAt: true,
                isSuspended: true,
                createdAt: true,
                uiLanguage: true,
                pendingRegistrationMode: true,
            },
        });

        if (existingUser) {
            await notifyExistingRegisterAccount(existingUser, normalizedEmail, lang);
            return registerNeutralResponse(lang) as unknown as ApiResponse<{ user: { id: string; email: string } }>;
        }

        const resolvedInvite = await resolveRegisterInvite(validated.invitationCode, normalizedEmail, lang);
        if (resolvedInvite.error) return resolvedInvite.error;
        const invitedByUserId: string | undefined = resolvedInvite.invite.invitedByUserId;
        const inviteRecordId: string | undefined = resolvedInvite.invite.inviteRecordId;
        const assignedProfileType: ProfileType | undefined = resolvedInvite.invite.assignedProfileType;
        const exactDirectInviteBypassEmailVerification = resolvedInvite.invite.exactDirectInviteBypassEmailVerification;

        // Hash password
        const passwordHash = await hashPassword(validated.password);

        // Determine profile type from invite code prefix
        const hasValidInvite = Boolean(invitedByUserId);
        const inviteBypassesEmailVerification = exactDirectInviteBypassEmailVerification;
        const profileType = assignedProfileType ?? parseInviteCodeProfileType(validated.invitationCode || '');
        const verificationToken = inviteBypassesEmailVerification ? null : crypto.randomBytes(32).toString('hex');
        const verificationTokenHash = verificationToken ? hashRefreshToken(verificationToken) : null;
        const verificationTokenExpiry = inviteBypassesEmailVerification ? null : new Date(Date.now() + DAY_MS);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                email: normalizedEmail,
                passwordHash,
                name: validated.name,
                displayName: validated.displayName,
                profileType: profileType as ProfileType,
                primaryLanguage: validated.primaryLanguage || 'hu',
                spokenLanguages: validated.spokenLanguages || ['hu'],
                uiLanguage: validated.primaryLanguage || 'hu',
                termsAcceptedAt: new Date(),
                termsVersion: LEGAL_VERSIONS.terms,
                privacyVersion: LEGAL_VERSIONS.privacy,
                // G3 (Art. 8): persist the validated self-declaration, not a
                // hardcoded literal — registerSchema enforces z.literal(true), so
                // this is true, but tying it to the validated input means a future
                // weakening of the schema can never silently mark users confirmed.
                confirmedAge16Plus: validated.confirmedAge16Plus,
                confirmedAge16PlusAt: new Date(),
                isRegistrationPending: false,
                profileVisibility: 'REGISTERED',
                profileCompleteness: 10, // Rises as onboarding stages complete
                isEmailVerified: inviteBypassesEmailVerification,
                isSuspended: !hasValidInvite,
                invitedById: invitedByUserId,
                didPublicKey: validated.didPublicKey,
                verificationToken: verificationTokenHash,
                verificationTokenExpiry,
            },
            select: {
                id: true,
                email: true,
                profileType: true,
            },
        });

        // Bootstrap onboarding state and functional profile records
        await prisma.$transaction([
            prisma.userOnboardingState.create({
                data: {
                    userId: newUser.id,
                    lastStageCompleted: 1,
                    stage1CompletedAt: new Date(),
                },
            }),
            prisma.userFunctionalProfile.create({
                data: {
                    userId: newUser.id,
                    energisingFunctions: [],
                    drainingFunctions: [],
                },
            }),
        ]);

        // Set recipientId now that the user exists; status/acceptedAt already set atomically above.
        if (inviteRecordId) {
            await prisma.invite.update({
                where: { id: inviteRecordId },
                data: {
                    recipientId: newUser.id,
                    lastActivityAt: new Date(),
                },
            });
        }
        if (!inviteBypassesEmailVerification) {
            if (verificationToken) {
                await sendLeanVerificationEmail(
                    normalizedEmail,
                    appendLanguageParam(buildAbsoluteUrl(`/verify-email?token=${verificationToken}`), lang),
                    lang
                );
            }
            return {
                success: true,
                data: { user: { id: newUser.id, email: newUser.email } },
                message: hasValidInvite
                    ? authT(lang, 'server.errors.registrationVerificationRequired')
                    : authT(lang, 'server.errors.registrationVerificationAndApprovalRequired'),
                pendingApproval: true,
            };
        }

        // Newly created accounts cannot have 2FA enabled yet, but route through the
        // same chokepoint so full-session issuance always flows through one place.
        await issueSession({
            id: newUser.id,
            email: newUser.email,
            profileType: newUser.profileType,
            isAdmin: false,
            isTotpEnabled: false,
        });
        await markUserActivity(newUser.id, { login: true });

        return {
            success: true,
            data: {
                user: {
                    id: newUser.id,
                    email: newUser.email,
                },
            },
            message: authT(lang, 'server.errors.registrationSuccess'),
        };
    } catch (error) {
        return mapRegisterError(error, lang);
    }
}

/**
 * Logout action - invalidates user session
 */
export async function logoutAction(): Promise<ApiResponse<null>> {
    const lang = await getLocale();
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('accessToken')?.value;
        const refreshToken = cookieStore.get('refreshToken')?.value;
        const cookieOptions = {
            path: '/',
            sameSite: 'lax' as const,
            secure: shouldUseSecureAuthCookies(),
        };

        try {
            await revokeAuthTokens(refreshToken, accessToken);
        } catch (e) {
            logger.error({ msg: 'logoutAction token revocation error', err: e instanceof Error ? e.message : String(e) });
        }

        cookieStore.set('accessToken', '', {
            ...cookieOptions,
            maxAge: 0,
        });
        cookieStore.set('refreshToken', '', {
            ...cookieOptions,
            maxAge: 0,
        });
        cookieStore.delete({ name: 'accessToken', ...cookieOptions });
        cookieStore.delete({ name: 'refreshToken', ...cookieOptions });

        return {
            success: true,
            data: null,
            message: authT(lang, 'server.errors.logoutSuccess'),
        };
    } catch (e) {
        logger.error({ msg: 'logoutAction error', err: e instanceof Error ? e.message : String(e) });
        return {
            success: false,
            error: authT(lang, 'server.errors.logoutFailed'),
        };
    }
}
