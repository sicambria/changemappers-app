'use server';

/**
 * TOTP two-factor server actions (AUDIT-20260613-041 #9).
 *
 *  - verifyTwoFactorAction: second-factor step of login. Consumes the MFA-challenge
 *    cookie, verifies a TOTP code OR a one-time backup code, then issues the full
 *    session. Rate-limited and anti-enumeration (generic errors).
 *  - start/confirm/disable enrollment + regenerate backup codes: management surface
 *    for an already-authenticated user (profile → Security).
 *
 * Secrets are encrypted at rest (totp-crypto, fail-closed). Backup codes are stored
 * only as hashes and consumed atomically.
 */
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import type { ApiResponse } from '@/types/common';
import { getLocale } from '@/lib/get-locale';
import { authT } from '@/lib/auth-localization';
import { rateLimitAsync } from '@/lib/rate-limit';
import { createAuditLog } from '@/lib/audit';
import { markUserActivity } from '@/lib/user-activity';
import { getCurrentUser } from '@/lib/get-current-user';
import { logger } from '@/lib/logger';
import { verifyMfaChallengeToken } from '@/lib/auth';
import { issueFullSession } from '@/lib/issue-session';
import { MFA_CHALLENGE_COOKIE, clearMfaChallengeCookie } from '@/lib/set-auth-cookies';
import {
  generateTotpSecret,
  buildOtpAuthUri,
  verifyTotpCode,
  generateBackupCodes,
  hashBackupCode,
  normalizeBackupCode,
} from '@/lib/totp';
import {
  encryptTotpSecret,
  decryptTotpSecret,
  isTotpEncryptionConfigured,
} from '@/lib/totp-crypto';
import QRCode from 'qrcode';

const codeSchema = z
  .string()
  .min(1)
  .max(64)
  .transform((v) => v.trim());

type SecondFactorUser = {
  id: string;
  totpSecretEncrypted: string | null;
  totpLastUsedStep: bigint | null;
};

/**
 * Verify a TOTP code or one-time backup code for `user`. Returns whether it matched
 * and (for TOTP) the matched time-step so the caller can persist replay protection.
 * Backup-code consumption is atomic (updateMany ... where usedAt: null).
 */
async function verifySecondFactor(
  user: SecondFactorUser,
  code: string,
): Promise<{ ok: true; viaBackup: boolean; step?: number } | { ok: false }> {
  // Try TOTP first.
  if (user.totpSecretEncrypted) {
    let secret: string | null = null;
    try {
      secret = decryptTotpSecret(user.totpSecretEncrypted);
    } catch {
      secret = null;
    }
    if (secret) {
      const result = verifyTotpCode(
        secret,
        code,
        user.totpLastUsedStep === null ? null : Number(user.totpLastUsedStep),
      );
      if (result.ok) {
        return { ok: true, viaBackup: false, step: result.step };
      }
    }
  }

  // Fall back to a one-time backup code (only if it looks like one).
  const normalized = normalizeBackupCode(code);
  if (normalized.length >= 8) {
    const consumed = await prisma.twoFactorBackupCode.updateMany({
      where: { userId: user.id, codeHash: hashBackupCode(code), usedAt: null },
      data: { usedAt: new Date() },
    });
    if (consumed.count === 1) {
      return { ok: true, viaBackup: true };
    }
  }

  return { ok: false };
}

/**
 * Login second factor. Reads ONLY the MFA-challenge cookie (never an access token),
 * verifies the code, and on success issues the full session.
 */
export async function verifyTwoFactorAction(
  input: { code: string },
): Promise<ApiResponse<{ user: { id: string; email: string; name: string } }>> {
  const lang = await getLocale();
  try {
    const cookieStore = await cookies();
    const challenge = cookieStore.get(MFA_CHALLENGE_COOKIE)?.value;
    const claim = challenge ? verifyMfaChallengeToken(challenge) : null;
    if (!claim) {
      await clearMfaChallengeCookie();
      return { success: false, error: authT(lang, 'server.errors.twoFactorChallengeExpired') };
    }

    const parsed = codeSchema.safeParse(input.code);
    if (!parsed.success) {
      return { success: false, error: authT(lang, 'server.errors.twoFactorInvalidCode') };
    }

    // Rate-limit per user (security-sensitive): 5 attempts / 5 minutes.
    const rl = await rateLimitAsync(`totp_verify_${claim.userId}`, 5, 5 * 60_000);
    if (!rl.success) {
      return { success: false, error: authT(lang, 'server.errors.twoFactorTooManyAttempts') };
    }

    const user = await prisma.user.findUnique({
      where: { id: claim.userId },
      select: {
        id: true,
        email: true,
        name: true,
        profileType: true,
        isAdmin: true,
        isTotpEnabled: true,
        totpSecretEncrypted: true,
        totpLastUsedStep: true,
        deletedAt: true,
        isSuspended: true,
      },
    });

    if (!user || !user.isTotpEnabled || user.deletedAt || user.isSuspended) {
      await clearMfaChallengeCookie();
      return { success: false, error: authT(lang, 'server.errors.twoFactorChallengeExpired') };
    }

    const verification = await verifySecondFactor(user, parsed.data);
    if (!verification.ok) {
      await createAuditLog({
        userId: user.id,
        userEmail: user.email,
        action: 'TWO_FACTOR_FAILED',
        entityType: 'User',
        entityId: user.id,
      });
      return { success: false, error: authT(lang, 'server.errors.twoFactorInvalidCode') };
    }

    // Persist replay protection for TOTP (backup codes are already consumed).
    if (!verification.viaBackup && typeof verification.step === 'number') {
      await prisma.user.update({
        where: { id: user.id },
        data: { totpLastUsedStep: BigInt(verification.step) },
        select: { id: true },
      });
    }

    await clearMfaChallengeCookie();
    await issueFullSession({
      id: user.id,
      email: user.email,
      profileType: user.profileType,
      isAdmin: user.isAdmin,
    });
    await markUserActivity(user.id, { login: true });

    await createAuditLog({
      userId: user.id,
      userEmail: user.email,
      action: 'TWO_FACTOR_VERIFIED',
      entityType: 'User',
      entityId: user.id,
      metadata: { viaBackup: verification.viaBackup },
    });
    if (verification.viaBackup) {
      await createAuditLog({
        userId: user.id,
        userEmail: user.email,
        action: 'TWO_FACTOR_BACKUP_CODE_USED',
        entityType: 'User',
        entityId: user.id,
      });
    }
    await createAuditLog({
      userId: user.id,
      userEmail: user.email,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user.id,
    });

    return {
      success: true,
      data: { user: { id: user.id, email: user.email, name: user.name } },
      message: authT(lang, 'server.errors.loginSuccess'),
    };
  } catch (error) {
    logger.error({ msg: '[twofa] verifyTwoFactorAction failed', err: error instanceof Error ? error.message : String(error) });
    return { success: false, error: authT(lang, 'server.errors.twoFactorInvalidCode') };
  }
}

/** Current 2FA state for the authenticated user (drives the Security tab UI). */
export async function getTwoFactorStatusAction(): Promise<
  ApiResponse<{ isTotpEnabled: boolean; available: boolean }>
> {
  const lang = await getLocale();
  const auth = await getCurrentUser();
  if (!auth.success) {
    return { success: false, error: authT(lang, 'server.errors.unauthorized') };
  }
  const user = await prisma.user.findUnique({
    where: { id: auth.data.id },
    select: { isTotpEnabled: true },
  });
  return {
    success: true,
    data: { isTotpEnabled: user?.isTotpEnabled ?? false, available: isTotpEncryptionConfigured() },
  };
}

/**
 * Begin enrollment: generate + persist an (encrypted) secret without enabling 2FA,
 * and return the otpauth URI, a QR data-URL, and the manual-entry secret (shown once).
 */
export async function startTotpEnrollmentAction(): Promise<
  ApiResponse<{ secret: string; otpauthUri: string; qrDataUrl: string }>
> {
  const lang = await getLocale();
  const auth = await getCurrentUser();
  if (!auth.success) {
    return { success: false, error: authT(lang, 'server.errors.unauthorized') };
  }

  if (!isTotpEncryptionConfigured()) {
    return { success: false, error: authT(lang, 'server.errors.twoFactorUnavailable') };
  }

  try {
    const rl = await rateLimitAsync(`totp_enroll_${auth.data.id}`, 5, 60_000);
    if (!rl.success) {
      return { success: false, error: authT(lang, 'server.errors.twoFactorTooManyAttempts') };
    }

    const existing = await prisma.user.findUnique({
      where: { id: auth.data.id },
      select: { isTotpEnabled: true, email: true },
    });
    if (!existing) {
      return { success: false, error: authT(lang, 'server.errors.unauthorized') };
    }
    if (existing.isTotpEnabled) {
      return { success: false, error: authT(lang, 'server.errors.twoFactorAlreadyEnabled') };
    }

    const secret = generateTotpSecret();
    await prisma.user.update({
      where: { id: auth.data.id },
      data: { totpSecretEncrypted: encryptTotpSecret(secret) },
      select: { id: true },
    });

    const otpauthUri = buildOtpAuthUri(existing.email, secret);
    const qrDataUrl = await QRCode.toDataURL(otpauthUri, { margin: 1, width: 240 });

    return { success: true, data: { secret, otpauthUri, qrDataUrl } };
  } catch (error) {
    logger.error({ msg: '[twofa] startTotpEnrollmentAction failed', err: error instanceof Error ? error.message : String(error) });
    return { success: false, error: authT(lang, 'server.errors.twoFactorUnavailable') };
  }
}

/**
 * Confirm enrollment: verify a live code against the pending secret, enable 2FA, and
 * return freshly-generated backup codes (shown once; stored hashed).
 */
export async function confirmTotpEnrollmentAction(
  input: { code: string },
): Promise<ApiResponse<{ backupCodes: string[] }>> {
  const lang = await getLocale();
  const auth = await getCurrentUser();
  if (!auth.success) {
    return { success: false, error: authT(lang, 'server.errors.unauthorized') };
  }

  try {
    const parsed = codeSchema.safeParse(input.code);
    if (!parsed.success) {
      return { success: false, error: authT(lang, 'server.errors.twoFactorInvalidCode') };
    }

    const rl = await rateLimitAsync(`totp_enroll_${auth.data.id}`, 5, 60_000);
    if (!rl.success) {
      return { success: false, error: authT(lang, 'server.errors.twoFactorTooManyAttempts') };
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.data.id },
      select: { id: true, email: true, isTotpEnabled: true, totpSecretEncrypted: true },
    });
    if (!user?.totpSecretEncrypted) {
      return { success: false, error: authT(lang, 'server.errors.twoFactorNotStarted') };
    }
    if (user.isTotpEnabled) {
      return { success: false, error: authT(lang, 'server.errors.twoFactorAlreadyEnabled') };
    }

    let secret: string;
    try {
      secret = decryptTotpSecret(user.totpSecretEncrypted);
    } catch {
      return { success: false, error: authT(lang, 'server.errors.twoFactorUnavailable') };
    }

    const result = verifyTotpCode(secret, parsed.data, null);
    if (!result.ok) {
      return { success: false, error: authT(lang, 'server.errors.twoFactorInvalidCode') };
    }

    const backupCodes = generateBackupCodes();

    await prisma.$transaction(async (tx) => {
      await tx.twoFactorBackupCode.deleteMany({ where: { userId: user.id } });
      await tx.twoFactorBackupCode.createMany({
        data: backupCodes.map((code) => ({ userId: user.id, codeHash: hashBackupCode(code) })),
      });
      await tx.user.update({
        where: { id: user.id },
        data: {
          isTotpEnabled: true,
          totpEnrolledAt: new Date(),
          totpLastUsedStep: typeof result.step === 'number' ? BigInt(result.step) : null,
        },
        select: { id: true },
      });
    });

    await createAuditLog({
      userId: user.id,
      userEmail: user.email,
      action: 'TWO_FACTOR_ENABLED',
      entityType: 'User',
      entityId: user.id,
    });

    return { success: true, data: { backupCodes } };
  } catch (error) {
    logger.error({ msg: '[twofa] confirmTotpEnrollmentAction failed', err: error instanceof Error ? error.message : String(error) });
    return { success: false, error: authT(lang, 'server.errors.twoFactorUnavailable') };
  }
}

/** Disable 2FA — requires a current TOTP code or a backup code as re-authentication. */
export async function disableTotpAction(input: { code: string }): Promise<ApiResponse<null>> {
  const lang = await getLocale();
  const auth = await getCurrentUser();
  if (!auth.success) {
    return { success: false, error: authT(lang, 'server.errors.unauthorized') };
  }

  try {
    const parsed = codeSchema.safeParse(input.code);
    if (!parsed.success) {
      return { success: false, error: authT(lang, 'server.errors.twoFactorInvalidCode') };
    }

    const rl = await rateLimitAsync(`totp_verify_${auth.data.id}`, 5, 5 * 60_000);
    if (!rl.success) {
      return { success: false, error: authT(lang, 'server.errors.twoFactorTooManyAttempts') };
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.data.id },
      select: { id: true, email: true, isTotpEnabled: true, totpSecretEncrypted: true, totpLastUsedStep: true },
    });
    if (!user?.isTotpEnabled) {
      return { success: false, error: authT(lang, 'server.errors.twoFactorNotEnabled') };
    }

    const verification = await verifySecondFactor(user, parsed.data);
    if (!verification.ok) {
      await createAuditLog({
        userId: user.id,
        userEmail: user.email,
        action: 'TWO_FACTOR_FAILED',
        entityType: 'User',
        entityId: user.id,
      });
      return { success: false, error: authT(lang, 'server.errors.twoFactorInvalidCode') };
    }

    await prisma.$transaction(async (tx) => {
      await tx.twoFactorBackupCode.deleteMany({ where: { userId: user.id } });
      await tx.user.update({
        where: { id: user.id },
        data: {
          isTotpEnabled: false,
          totpSecretEncrypted: null,
          totpEnrolledAt: null,
          totpLastUsedStep: null,
        },
        select: { id: true },
      });
    });

    await createAuditLog({
      userId: user.id,
      userEmail: user.email,
      action: 'TWO_FACTOR_DISABLED',
      entityType: 'User',
      entityId: user.id,
    });

    return { success: true, data: null, message: authT(lang, 'server.errors.twoFactorDisabledSuccess') };
  } catch (error) {
    logger.error({ msg: '[twofa] disableTotpAction failed', err: error instanceof Error ? error.message : String(error) });
    return { success: false, error: authT(lang, 'server.errors.twoFactorUnavailable') };
  }
}

/** Regenerate backup codes — requires a current TOTP/backup code; invalidates old codes. */
export async function regenerateBackupCodesAction(
  input: { code: string },
): Promise<ApiResponse<{ backupCodes: string[] }>> {
  const lang = await getLocale();
  const auth = await getCurrentUser();
  if (!auth.success) {
    return { success: false, error: authT(lang, 'server.errors.unauthorized') };
  }

  try {
    const parsed = codeSchema.safeParse(input.code);
    if (!parsed.success) {
      return { success: false, error: authT(lang, 'server.errors.twoFactorInvalidCode') };
    }

    const rl = await rateLimitAsync(`totp_verify_${auth.data.id}`, 5, 5 * 60_000);
    if (!rl.success) {
      return { success: false, error: authT(lang, 'server.errors.twoFactorTooManyAttempts') };
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.data.id },
      select: { id: true, email: true, isTotpEnabled: true, totpSecretEncrypted: true, totpLastUsedStep: true },
    });
    if (!user?.isTotpEnabled) {
      return { success: false, error: authT(lang, 'server.errors.twoFactorNotEnabled') };
    }

    const verification = await verifySecondFactor(user, parsed.data);
    if (!verification.ok) {
      return { success: false, error: authT(lang, 'server.errors.twoFactorInvalidCode') };
    }

    const backupCodes = generateBackupCodes();
    await prisma.$transaction(async (tx) => {
      await tx.twoFactorBackupCode.deleteMany({ where: { userId: user.id } });
      await tx.twoFactorBackupCode.createMany({
        data: backupCodes.map((code) => ({ userId: user.id, codeHash: hashBackupCode(code) })),
      });
      // A consumed TOTP step must not be replayable for the regenerate path either.
      if (!verification.viaBackup && typeof verification.step === 'number') {
        await tx.user.update({
          where: { id: user.id },
          data: { totpLastUsedStep: BigInt(verification.step) },
          select: { id: true },
        });
      }
    });

    return { success: true, data: { backupCodes } };
  } catch (error) {
    logger.error({ msg: '[twofa] regenerateBackupCodesAction failed', err: error instanceof Error ? error.message : String(error) });
    return { success: false, error: authT(lang, 'server.errors.twoFactorUnavailable') };
  }
}
