/**
 * Lean registration cookie signing/verification.
 * Uses HMAC-SHA256 to sign a userId for the HttpOnly `lean_reg_uid` cookie.
 * NOT a 'use server' file — importable by both server components and actions.
 */
import crypto from 'node:crypto';

const DEV_FALLBACK_SIGNING_KEY = crypto.randomBytes(32).toString('hex');
export const LEAN_REG_CONTINUATION_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60;
const SIG_LEN = 64; // hex chars (full 256-bit HMAC-SHA256 output)

function getLeanRegSigningKey(): string {
    const envValue = process.env.LEAN_REG_SIGNING_SECRET;
    if (envValue) {
        return envValue;
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error('LEAN_REG_SIGNING_SECRET must be set to sign lean registration cookies in production');
    }

    return DEV_FALLBACK_SIGNING_KEY;
}

function createSignature(userId: string): Buffer {
    return crypto
        .createHmac('sha256', getLeanRegSigningKey())
        .update(userId)
        .digest();
}

export function signLeanRegCookie(userId: string): string {
    return `${userId}.${createSignature(userId).toString('hex')}`;
}

export function signFullRegCookie(userId: string): string {
    return signLeanRegCookie(userId);
}

export function verifyLeanRegCookie(signed: string): string | null {
    const dotIndex = signed.lastIndexOf('.');
    if (dotIndex === -1) return null;
    const userId = signed.slice(0, dotIndex);
    const sig = signed.slice(dotIndex + 1);
    if (!userId || sig.length !== SIG_LEN) return null;
    if (!/^[0-9a-f]+$/i.test(sig)) return null;

    const actualSig = Buffer.from(sig, 'hex');
    const expectedSig = createSignature(userId);

    if (actualSig.length !== expectedSig.length) return null;

    return crypto.timingSafeEqual(actualSig, expectedSig) ? userId : null;
}

export function verifyFullRegCookie(signed: string): string | null {
    return verifyLeanRegCookie(signed);
}
