// Authentication utility functions
// JWT token generation and verification

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import prisma from '@/lib/prisma';
import { DAY_MS } from '@/lib/constants';
import { rateLimitAsync } from '@/lib/rate-limit';
import { getAccessTokenExpiry } from '@/lib/auth-token-policy';
import { isPendingRegistrationAccount } from '@/lib/registration-completion';

let _jwtSecret: string | null = null;
let _jwtRefreshSecret: string | null = null;

function getJwtSecret(): string {
  if (!_jwtSecret) {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET must be set');
    _jwtSecret = process.env.JWT_SECRET;
  }
  return _jwtSecret;
}

function getJwtRefreshSecret(): string {
  if (!_jwtRefreshSecret) {
    if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET must be set');
    _jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  }
  return _jwtRefreshSecret;
}

const REFRESH_TOKEN_EXPIRY = '7d';

export function _getJwtSecrets() {
  return { jwtSecret: getJwtSecret(), jwtRefreshSecret: getJwtRefreshSecret() };
}

export function _resetJwtSecrets() {
  _jwtSecret = null;
  _jwtRefreshSecret = null;
}

export interface TokenPayload {
    userId: string;
    email: string;
    profileType?: string;
    isAdmin?: boolean;
    isRegistrationPending?: boolean;
}

export interface RefreshTokenPayload extends TokenPayload {
    refreshTokenFamilyId?: string;
    jti?: string;
    iat?: number;
    exp?: number;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

/**
 * MFA-challenge token (AUDIT-20260613-041 #9).
 *
 * SECURITY BOUNDARY: when a user with 2FA enabled authenticates the first factor
 * (password / magic link), we DO NOT issue an access token. We issue this distinct,
 * short-lived token instead — it carries only `userId`, no role/profile claims, and
 * a `typ: 'mfa_challenge'` discriminator. It is signed with the same key for
 * convenience but `verifyAccessToken` HARD-REJECTS any token carrying this `typ`, so
 * a challenge token is never a valid session anywhere except the verify-2fa step. A
 * stolen password therefore yields nothing but the ability to be prompted for a code.
 */
export const MFA_CHALLENGE_TYP = 'mfa_challenge';
const MFA_CHALLENGE_EXPIRY = '10m';

export interface MfaChallengePayload {
    userId: string;
    typ: typeof MFA_CHALLENGE_TYP;
    iat?: number;
    exp?: number;
}

export function generateMfaChallengeToken(userId: string): string {
    return jwt.sign({ userId, typ: MFA_CHALLENGE_TYP }, getJwtSecret(), {
        algorithm: 'HS256',
        expiresIn: MFA_CHALLENGE_EXPIRY,
    });
}

export function verifyMfaChallengeToken(token: string): { userId: string } | null {
    try {
        const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as MfaChallengePayload;
        if (decoded?.typ !== MFA_CHALLENGE_TYP || typeof decoded.userId !== 'string' || !decoded.userId) {
            return null;
        }
        return { userId: decoded.userId };
    } catch {
        return null;
    }
}

const SALT_ROUNDS = process.env.NODE_ENV === 'test' ? 4 : 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Generate access and refresh tokens
 */
export function generateTokens(payload: TokenPayload, refreshTokenFamilyId: string = crypto.randomUUID()): AuthTokens {
    const accessToken = jwt.sign(payload, getJwtSecret(), {
        algorithm: 'HS256',
        expiresIn: getAccessTokenExpiry(),
    });

    const refreshToken = jwt.sign(
        { ...payload, refreshTokenFamilyId },
        getJwtRefreshSecret(),
        {
        algorithm: 'HS256',
        expiresIn: REFRESH_TOKEN_EXPIRY,
        jwtid: crypto.randomUUID(),
    });

    return { accessToken, refreshToken };
}

/**
 * Verify an access token
 */
const deniedAccessTokenHashes = new Map<string, number>();

function denyAccessToken(token: string): void {
    const decoded = jwt.decode(token) as (TokenPayload & { exp?: number }) | null;
    const expiresAtMs = typeof decoded?.exp === 'number' ? decoded.exp * 1000 : Date.now() + 15 * 60 * 1000;
    deniedAccessTokenHashes.set(hashRefreshToken(token), expiresAtMs);
}

function isAccessTokenDenied(token: string): boolean {
    const tokenHash = hashRefreshToken(token);
    const expiresAtMs = deniedAccessTokenHashes.get(tokenHash);
    if (!expiresAtMs) {
        return false;
    }

    if (expiresAtMs <= Date.now()) {
        deniedAccessTokenHashes.delete(tokenHash);
        return false;
    }

    return true;
}

export function verifyAccessToken(token: string): TokenPayload | null {
    try {
        if (isAccessTokenDenied(token)) {
            return null;
        }

        const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as TokenPayload & { typ?: string };
        // Defense in depth: an MFA-challenge token must never be accepted as an
        // access token, even if an attacker plants it in the accessToken cookie.
        if (decoded && (decoded as { typ?: string }).typ === MFA_CHALLENGE_TYP) {
            return null;
        }
        return decoded;
    } catch {
        return null;
    }
}

/**
 * Verify a refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
        const decoded = jwt.verify(token, getJwtRefreshSecret(), { algorithms: ['HS256'] }) as RefreshTokenPayload;
        return decoded;
    } catch {
        return null;
    }
}

export function hashRefreshToken(refreshToken: string): string {
    return crypto.createHash('sha256').update(refreshToken).digest('hex');
}

function getRefreshTokenExpiry(payload: RefreshTokenPayload): Date {
    if (typeof payload.exp === 'number') {
        return new Date(payload.exp * 1000);
    }

    return new Date(Date.now() + 7 * DAY_MS);
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens | null> {
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
        return null;
    }

    const rl = await rateLimitAsync(`refresh_${payload.userId}`, 5, 60000);
    if (!rl.success) {
        return null;
    }

    const tokenHash = hashRefreshToken(refreshToken);
    const familyId = payload.refreshTokenFamilyId ?? tokenHash;
    const now = new Date();
    const expiresAt = getRefreshTokenExpiry(payload);

    const nextTokens = generateTokens({
        userId: payload.userId,
        email: payload.email,
        profileType: payload.profileType,
        isAdmin: payload.isAdmin,
        isRegistrationPending: false,
    }, familyId);
    const nextTokenHash = hashRefreshToken(nextTokens.refreshToken);
    const nextPayload = verifyRefreshToken(nextTokens.refreshToken);
    if (!nextPayload) {
        return null;
    }

    try {
        const rotated = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: payload.userId },
                select: {
                    tokenInvalidatedAt: true,
                    isRegistrationPending: true,
                    name: true,
                    passwordHash: true,
                },
            });

            if (!user) {
                throw new Error('Refresh token user not found');
            }

            if (isPendingRegistrationAccount(user)) {
                await tx.refreshTokenSession.updateMany({
                    where: { familyId },
                    data: { revokedAt: now },
                });
                return false;
            }

            if (user.tokenInvalidatedAt && typeof payload.iat === 'number' && user.tokenInvalidatedAt.getTime() > payload.iat * 1000) {
                await tx.refreshTokenSession.updateMany({
                    where: { familyId },
                    data: { revokedAt: now },
                });
                return false;
            }

            const existing = await tx.refreshTokenSession.findUnique({
                where: { tokenHash },
                select: {
                    id: true,
                    familyId: true,
                    consumedAt: true,
                    revokedAt: true,
                    expiresAt: true,
                },
            });

            if (existing?.consumedAt || existing?.revokedAt || (existing && existing.expiresAt <= now)) {
                await tx.refreshTokenSession.updateMany({
                    where: { familyId: existing.familyId },
                    data: { revokedAt: now },
                });
                return false;
            }

            if (existing) {
                const consumed = await tx.refreshTokenSession.updateMany({
                    where: { tokenHash, consumedAt: null, revokedAt: null },
                    data: { consumedAt: now, replacedByHash: nextTokenHash },
                });

                if (consumed.count !== 1) {
                    await tx.refreshTokenSession.updateMany({
                        where: { familyId: existing.familyId },
                        data: { revokedAt: now },
                    });
                    return false;
                }
            } else {
                await tx.refreshTokenSession.create({
                    data: {
                        userId: payload.userId,
                        tokenHash,
                        familyId,
                        expiresAt,
                        consumedAt: now,
                        replacedByHash: nextTokenHash,
                    },
                });
            }

            await tx.refreshTokenSession.create({
                data: {
                    userId: payload.userId,
                    tokenHash: nextTokenHash,
                    familyId,
                    expiresAt: getRefreshTokenExpiry(nextPayload),
                },
            });

            return true;
        });

        if (!rotated) {
            return null;
        }

    } catch (error) {
        console.warn('[auth] Refresh token rotation rejected:', error);
        return null;
    }

    return nextTokens;
}
export async function revokeAuthTokens(refreshToken?: string, accessToken?: string): Promise<void> {
    if (accessToken) {
        denyAccessToken(accessToken);
    }

    if (!refreshToken) {
        return;
    }

    const payload = verifyRefreshToken(refreshToken);
    const tokenHash = hashRefreshToken(refreshToken);
    const now = new Date();

    await prisma.$transaction(async (tx) => {
        if (payload?.refreshTokenFamilyId) {
            await tx.refreshTokenSession.updateMany({
                where: { familyId: payload.refreshTokenFamilyId, revokedAt: null },
                data: { revokedAt: now },
            });
        } else {
            await tx.refreshTokenSession.updateMany({
                where: { tokenHash, revokedAt: null },
                data: { revokedAt: now },
            });
        }

        if (payload?.userId) {
            await tx.user.updateMany({
                where: { id: payload.userId },
                data: { tokenInvalidatedAt: now },
            });
        }
    });
}
