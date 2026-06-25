'use server';

import crypto from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { hashPassword, hashRefreshToken } from '@/lib/auth';
import { sendMagicLinkEmail, sendPasswordResetEmail, sendLeanVerificationEmail } from '@/lib/email';
import { sendPendingRegistrationContinueEmail } from '@/lib/pending-registration-maintenance';
import { isPendingRegistrationAccount } from '@/lib/registration-completion';
import { rateLimitAsync } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { buildAbsoluteUrl } from '@/lib/site-url';
import { getLocale } from '@/lib/get-locale';
import { appendLanguageParam, authMessage, authT } from '@/lib/auth-localization';
import { getClientIp } from '@/lib/request-ip';
import { DAY_MS } from '@/lib/constants';
import type { ApiResponse } from '@/types/common';
import { passwordSchema } from '@/lib/auth-schemas';

/**
 * Verify email action
 */
export async function verifyEmailAction(
    token: string
): Promise<ApiResponse<null>> {
    const lang = await getLocale();
    try {
        if (!token) {
            return {
                success: false,
                error: authT(lang, 'server.errors.invalidToken'),
            };
        }

        // SEC-H3: rate-limit verification attempts per IP
        const headerList = await headers();
        const ip = getClientIp(headerList);
        const rl = await rateLimitAsync(`verify_email_${ip}`, 5, 60_000);
        if (!rl.success) {
            return { success: false, error: authT(lang, 'server.errors.tooManyLogin') };
        }

        const tokenHash = hashRefreshToken(token);
        const user = await prisma.user.findUnique({
            where: { verificationToken: tokenHash },
            select: {
                id: true,
                verificationTokenExpiry: true,
                verificationLevel: true,
            },
        });

        if (!user) {
            return { success: false, error: authT(lang, 'server.errors.invalidExpiredToken') };
        }

        if (user.verificationTokenExpiry != null && user.verificationTokenExpiry < new Date()) {
            // SEC-M5: clear expired token so it doesn't linger in DB
            await prisma.user.update({
                where: { id: user.id },
                data: { verificationToken: null, verificationTokenExpiry: null },
                select: { id: true },
            });
            return { success: false, error: authT(lang, 'server.errors.tokenExpired') };
        }

        // Atomically consume the token (TOCTOU protection)
        const consumed = await prisma.user.updateMany({
            where: { id: user.id, verificationToken: tokenHash },
            data: {
                isEmailVerified: true,
                verificationToken: null,
                verificationTokenExpiry: null,
                verificationLevel: user.verificationLevel === 'SELF_DECLARED' ? 'PEER_VOUCHED' : user.verificationLevel,
            },
        });

        if (consumed.count !== 1) {
            return { success: false, error: authT(lang, 'server.errors.invalidExpiredToken') };
        }

        return {
            success: true,
            data: null,
            message: authT(lang, 'server.errors.emailVerified'),
        };
    } catch (e) {
        logger.error({ msg: 'verifyEmailAction error', err: e instanceof Error ? e.message : String(e) });
        return {
            success: false,
            error: authT(lang, 'server.errors.emailVerifyFailed'),
        };
    }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmailAction(
  email: string
): Promise<ApiResponse<null>> {
  const lang = await getLocale();
  try {
    const headerList = await headers();
    const ip = getClientIp(headerList);
    const rl = await rateLimitAsync(`resend_verify_${ip}`, 3, 5 * 60 * 1000);
    if (!rl.success) {
        return { success: false, error: authT(lang, 'server.errors.tooManyFiveMinutes') };
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true, isRegistrationPending: true, isEmailVerified: true, uiLanguage: true, pendingRegistrationMode: true },
    });

        if (!user) {
            return { success: false, error: authT(lang, 'server.errors.userNotFound') };
        }

        if (isPendingRegistrationAccount(user)) {
            await sendPendingRegistrationContinueEmail(user, { reminder: false, language: lang });
            return { success: true, data: null, message: authT(lang, 'server.errors.verificationResent') };
        }

        if (user.isEmailVerified) {
            return { success: true, data: null, message: authT(lang, 'server.errors.emailAlreadyVerified') };
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + DAY_MS);

	await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: hashRefreshToken(token),
        verificationTokenExpiry: expiry
      },
      select: { id: true },
    });

  const verifyUrl = buildAbsoluteUrl(`/verify-email?token=${token}`);
  await sendLeanVerificationEmail(email, appendLanguageParam(verifyUrl, lang), lang);

    return { success: true, data: null, message: authT(lang, 'server.errors.verificationResent') };
    } catch (e) {
        logger.error({ msg: 'resendVerificationEmailAction error', err: e instanceof Error ? e.message : String(e) });
        return { success: false, error: authT(lang, 'server.errors.emailSendError') };
    }
}

/**
 * Request password reset
 */
export async function requestPasswordResetAction(
  email: string
): Promise<ApiResponse<null>> {
  const lang = await getLocale();
  const ALWAYS_SUCCESS = {
    success: true as const,
    data: null,
    message: authT(lang, 'server.errors.resetAlwaysSuccess'),
  };

  try {
    const headerList = await headers();
    const ip = getClientIp(headerList);
    const rl = await rateLimitAsync(`reset_${ip}`, 3, 5 * 60 * 1000);
    if (!rl.success) {
      return ALWAYS_SUCCESS;
    }

z.email().parse(email);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, deletedAt: true, isSuspended: true, email: true, name: true, passwordHash: true, isRegistrationPending: true },
  });

    if (!user || user.deletedAt || user.isSuspended || isPendingRegistrationAccount(user)) {
      return ALWAYS_SUCCESS;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    // SEC-H4: store SHA-256 hash; raw token goes in the email link only
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashRefreshToken(token), resetTokenExpiry: expiry, resetTokenClaimedAt: null },
      select: { id: true },
    });

    const resetUrl = buildAbsoluteUrl(`/api/auth/reset-password?token=${token}`);
    try {
      await sendPasswordResetEmail(user.email, appendLanguageParam(resetUrl, lang), lang);
    } catch (error) {
      logger.error({ msg: 'password reset email send failed', ...(process.env.NODE_ENV !== 'production' && { detail: error instanceof Error ? error.message : String(error) }) });
    }

    return ALWAYS_SUCCESS;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: authT(lang, 'server.errors.invalidEmailFormat') };
    }
    return ALWAYS_SUCCESS;
  }
}

// Null out the reset-token fields for a user (rejected pending account / expired token).
async function invalidateResetToken(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { resetToken: null, resetTokenExpiry: null, resetTokenClaimedAt: null },
    select: { id: true },
  });
}

export async function resetPasswordAction(
  token: string,
  newPassword: string
): Promise<ApiResponse<null>> {
  const lang = await getLocale();
  try {
    const cookieStore = await cookies();
    const effectiveToken = token || cookieStore.get('resetToken')?.value || '';
    if (!effectiveToken || effectiveToken.length < 64) {
      return { success: false, error: authT(lang, 'server.errors.invalidExpiredToken') };
    }

    passwordSchema.parse(newPassword);

  // SEC-H4: DB stores hash; hash the received token before lookup
  const tokenHash = hashRefreshToken(effectiveToken);
  const user = await prisma.user.findUnique({
    where: { resetToken: tokenHash },
    select: { id: true, name: true, passwordHash: true, isRegistrationPending: true, resetTokenExpiry: true, resetTokenClaimedAt: true },
  });

    if (!user) {
      return { success: false, error: authT(lang, 'server.errors.invalidExpiredToken') };
    }

    if (isPendingRegistrationAccount(user)) {
      await invalidateResetToken(user.id);
      cookieStore.delete('resetToken');
      return { success: false, error: authT(lang, 'server.errors.invalidExpiredToken') };
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      await invalidateResetToken(user.id);
      cookieStore.delete('resetToken');
      return { success: false, error: authT(lang, 'server.errors.resetExpired') };
    }

    if (!user.resetTokenClaimedAt) {
      return { success: false, error: authT(lang, 'server.errors.invalidExpiredToken') };
    }

    const now = new Date();
    const passwordHash = await hashPassword(newPassword);

    const updated = await prisma.user.updateMany({
      where: { id: user.id, resetToken: tokenHash, resetTokenExpiry: { gt: now }, resetTokenClaimedAt: { not: null } },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        resetTokenClaimedAt: null,
        isEmailVerified: true,
        tokenInvalidatedAt: now,
        // A completed password reset proves control of the account's email, so it must
        // also clear any active login lockout — otherwise a user who triggered the
        // failed-attempt lockout cannot log in even after a valid reset. Cleared
        // atomically with the password change. See auth-lockout.ts / loginAction
        // (which clears these on a successful password login).
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    if (updated.count !== 1) {
      cookieStore.delete('resetToken');
      return { success: false, error: authT(lang, 'server.errors.invalidExpiredToken') };
    }

    await prisma.refreshTokenSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: now },
    });

    cookieStore.delete('resetToken');
    return {
      success: true,
      data: null,
      message: authT(lang, 'server.errors.passwordChanged'),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues || [];
      return {
        success: false,
        error: authMessage(lang, issues[0]?.message, 'server.errors.invalidPassword'),
      };
    }
    return { success: false, error: authT(lang, 'server.errors.resetFailed') };
  }
}

/**
 * Send a magic link login email.
 * Always returns success to prevent email enumeration.
 */
export async function sendMagicLinkAction(
    email: string
): Promise<ApiResponse<null>> {
    const lang = await getLocale();
    const ALWAYS_SUCCESS = {
        success: true as const,
        data: null,
        message: authT(lang, 'server.errors.magicAlwaysSuccess'),
    };

    try {
        const headerList = await headers();
        const ip = getClientIp(headerList);
        const rl = await rateLimitAsync(`magic_${ip}`, 3, 5 * 60 * 1000);
        if (!rl.success) {
            return ALWAYS_SUCCESS; // Don't leak rate limit info
        }

z.email().parse(email);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, deletedAt: true, isSuspended: true, email: true, name: true, passwordHash: true, isRegistrationPending: true, magicLinkTokenExpiry: true },
  });

  if (!user || user.deletedAt || user.isSuspended || isPendingRegistrationAccount(user)) {
    return ALWAYS_SUCCESS;
  }

        if (user.magicLinkTokenExpiry && user.magicLinkTokenExpiry > new Date()) {
            return ALWAYS_SUCCESS;
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        // SEC-H4: store SHA-256 hash; raw token goes in the email link only
        await prisma.user.update({
            where: { id: user.id },
            data: { magicLinkToken: hashRefreshToken(token), magicLinkTokenExpiry: expiry },
            select: { id: true },
        });

        const magicUrl = buildAbsoluteUrl(`/api/auth/magic?token=${token}`);
        try {
            await sendMagicLinkEmail(user.email, appendLanguageParam(magicUrl, lang), lang);
        } catch (error) {
            // GDPR-M5: do not log PII (email/token) in production
            logger.error({ msg: 'magic link send failed', ...(process.env.NODE_ENV !== 'production' && { detail: error instanceof Error ? error.message : String(error) }) });
        }

        return ALWAYS_SUCCESS;
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: authT(lang, 'server.errors.invalidEmailFormat') };
        }
        return ALWAYS_SUCCESS;
    }
}
