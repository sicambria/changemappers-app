/**
 * TOTP + backup-code primitives (AUDIT-20260613-041 #9).
 *
 * Pure functions only — no Prisma, no cookies — so the verification/replay logic
 * is trivially unit-testable. Encryption-at-rest lives in totp-crypto.ts; the
 * atomic backup-code consumption (DB) lives in the twofa server actions.
 */
import { authenticator } from 'otplib';
import { createHash, randomInt } from 'node:crypto';

export const TOTP_ISSUER = 'Changemappers';
const TOTP_PERIOD_SECONDS = 30;
const TOTP_WINDOW = 1; // accept ±1 time-step for client/server clock skew
export const BACKUP_CODE_COUNT = 10;
// Crockford-ish alphabet without ambiguous glyphs (0/O, 1/I/L).
const BACKUP_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const BACKUP_CODE_RAW_LENGTH = 10;

// Single shared configuration for generation + verification.
authenticator.options = { window: TOTP_WINDOW, step: TOTP_PERIOD_SECONDS };

/** Generate a fresh base32 TOTP shared secret. */
export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

/** Build the otpauth:// URI an authenticator app scans (also rendered as a QR). */
export function buildOtpAuthUri(accountName: string, secret: string): string {
  return authenticator.keyuri(accountName, TOTP_ISSUER, secret);
}

export interface TotpVerifyResult {
  ok: boolean;
  /** The time-step counter that matched; persist as `totpLastUsedStep` to block replay. */
  step?: number;
}

/**
 * Verify a 6-digit TOTP code against the secret, rejecting replay: a code whose
 * matched time-step is `<= lastUsedStep` is refused even if otherwise valid, so a
 * code already used within its ±1-step window cannot be replayed.
 */
export function verifyTotpCode(
  secret: string,
  code: string,
  lastUsedStep: number | null,
): TotpVerifyResult {
  const normalized = code.replaceAll(/\s+/g, '');
  if (!/^\d{6}$/.test(normalized)) {
    return { ok: false };
  }

  let delta: number | null;
  try {
    delta = authenticator.checkDelta(normalized, secret);
  } catch {
    return { ok: false };
  }
  if (delta === null) {
    return { ok: false };
  }

  const currentStep = Math.floor(Date.now() / 1000 / TOTP_PERIOD_SECONDS);
  const matchedStep = currentStep + delta;
  if (lastUsedStep !== null && matchedStep <= lastUsedStep) {
    return { ok: false };
  }
  return { ok: true, step: matchedStep };
}

/** Generate N human-friendly one-time backup codes (formatted `XXXXX-XXXXX`). */
export function generateBackupCodes(count = BACKUP_CODE_COUNT): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i += 1) {
    let raw = '';
    for (let j = 0; j < BACKUP_CODE_RAW_LENGTH; j += 1) {
      raw += BACKUP_CODE_ALPHABET[randomInt(BACKUP_CODE_ALPHABET.length)];
    }
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  return codes;
}

/** Strip formatting/whitespace and upper-case so display variants hash identically. */
export function normalizeBackupCode(code: string): string {
  return code.trim().toUpperCase().replaceAll(/[^A-Z0-9]/g, '');
}

/** SHA-256 hash of the normalized code — only the hash is ever stored. */
export function hashBackupCode(code: string): string {
  return createHash('sha256').update(normalizeBackupCode(code)).digest('hex');
}
