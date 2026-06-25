/**
 * Reversible encryption-at-rest for TOTP secrets (AUDIT-20260613-041 #9).
 *
 * A TOTP shared secret must be recoverable to verify codes, so it is *encrypted*
 * (AES-256-GCM), not hashed. This mirrors src/lib/high-risk-content-crypto.ts but
 * with two deliberate differences:
 *
 *  1. Its own key, `TOTP_ENCRYPTION_KEY` — never reuse JWT_SECRET or the
 *     high-risk-content key (key-separation convention, see startup-validation.ts).
 *  2. FAIL CLOSED in *every* environment: if the key is missing/short, encrypt and
 *     decrypt THROW. The high-risk-content helper silently returns plaintext outside
 *     production; copying that here would let TOTP secrets land in the DB unencrypted
 *     in dev/staging — itself a security finding on a security feature. Enrollment is
 *     refused without a real key.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const TOTP_CRYPTO_PREFIX = 'totpenc:v1';
const TOTP_SECRET_MIN_LENGTH = 32;
const TOTP_AAD = 'changemappers:totp-secret:v1';

export class TotpCryptoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TotpCryptoError';
  }
}

function getTotpEncryptionKey(env: NodeJS.ProcessEnv = process.env): string {
  const value = env.TOTP_ENCRYPTION_KEY?.trim();
  if (!value || value.length === 0) {
    throw new TotpCryptoError('TOTP_ENCRYPTION_KEY must be set to enable two-factor authentication');
  }
  if (value.length < TOTP_SECRET_MIN_LENGTH) {
    throw new TotpCryptoError(
      `TOTP_ENCRYPTION_KEY must be at least ${TOTP_SECRET_MIN_LENGTH} characters`,
    );
  }
  return value;
}

/** Non-throwing probe for callers/UI that need to know whether 2FA can be offered. */
export function isTotpEncryptionConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  try {
    getTotpEncryptionKey(env);
    return true;
  } catch {
    return false;
  }
}

/** Validation string for startup-validation.ts; null when configured correctly. */
export function validateTotpEncryptionConfig(env: NodeJS.ProcessEnv = process.env): string | null {
  try {
    getTotpEncryptionKey(env);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'TOTP_ENCRYPTION_KEY is invalid';
  }
}

function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret, 'utf8').digest();
}

export function isEncryptedTotpSecret(value: string): boolean {
  return value.startsWith(`${TOTP_CRYPTO_PREFIX}:`);
}

export function encryptTotpSecret(plaintext: string): string {
  if (plaintext.length === 0) {
    throw new TotpCryptoError('Cannot encrypt an empty TOTP secret');
  }
  const key = deriveKey(getTotpEncryptionKey());
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(TOTP_AAD, 'utf8'));
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    TOTP_CRYPTO_PREFIX,
    iv.toString('base64url'),
    tag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join(':');
}

export function decryptTotpSecret(value: string): string {
  const key = deriveKey(getTotpEncryptionKey());
  const parts = value.split(':');
  if (parts.length !== 5 || `${parts[0]}:${parts[1]}` !== TOTP_CRYPTO_PREFIX) {
    throw new TotpCryptoError('Invalid TOTP secret envelope');
  }
  const iv = Buffer.from(parts[2], 'base64url');
  const tag = Buffer.from(parts[3], 'base64url');
  const ciphertext = Buffer.from(parts[4], 'base64url');
  try {
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAAD(Buffer.from(TOTP_AAD, 'utf8'));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    throw new TotpCryptoError('TOTP secret authentication failed');
  }
}
