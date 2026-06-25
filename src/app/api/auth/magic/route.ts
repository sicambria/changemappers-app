/**
 * GET /api/auth/magic?token=xxx
 * Verifies a magic link token, issues JWT cookies, and redirects to dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashRefreshToken } from '@/lib/auth';
import { issueSessionOnResponse } from '@/lib/issue-session';
import { rateLimitAsync } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request-ip';
import { logger } from '@/lib/logger';
import { isPendingRegistrationAccount } from '@/lib/registration-completion';
import { markUserActivity } from '@/lib/user-activity';

function getForwardedPublicOrigin(request: NextRequest) {
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const host = forwardedHost?.split(',')[0]?.trim();
    const proto = forwardedProto?.split(',')[0]?.trim();

    if (host && (proto === 'https' || proto === 'http')) {
        return `${proto}://${host}`;
    }

    return new URL(request.url).origin;
}

function magicRedirect(request: NextRequest, path: string): NextResponse {
    return NextResponse.redirect(new URL(path, getForwardedPublicOrigin(request)));
}

export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('token');

    if (!token || token.length < 64) {
        return magicRedirect(request, '/login?error=magic_invalid');
    }

    // Rate-limit magic link redemption (SEC-H2)
    const ip = getClientIp(request.headers);
    const rl = await rateLimitAsync(`magic_redeem_${ip}`, 5, 60_000);
    if (!rl.success) {
        return magicRedirect(request, '/login?error=magic_rate_limited');
    }

    try {
        // SEC-H4: tokens are stored as SHA-256 hashes in the DB
        const tokenHash = hashRefreshToken(token);

        // Step 1: Find user by token hash
        const user = await prisma.user.findUnique({
            where: { magicLinkToken: tokenHash },
            select: {
                id: true,
                email: true,
                profileType: true,
                isAdmin: true,
                name: true,
                passwordHash: true,
                isRegistrationPending: true,
                magicLinkTokenExpiry: true,
                deletedAt: true,
                isSuspended: true,
                isTotpEnabled: true,
            },
        });

        if (!user) {
            return magicRedirect(request, '/login?error=magic_invalid');
        }

        if (!user.magicLinkTokenExpiry || user.magicLinkTokenExpiry < new Date()) {
            await prisma.user.update({
                where: { id: user.id },
                data: { magicLinkToken: null, magicLinkTokenExpiry: null },
                select: { id: true },
            });
            return magicRedirect(request, '/login?error=magic_expired');
        }

        if (user.deletedAt || user.isSuspended) {
            return magicRedirect(request, '/login?error=account_suspended');
        }

        if (isPendingRegistrationAccount(user)) {
            await prisma.user.update({
                where: { id: user.id },
                data: { magicLinkToken: null, magicLinkTokenExpiry: null },
                select: { id: true },
            });
            return magicRedirect(request, '/login?error=magic_invalid');
        }

        // Step 2: Atomically consume the token — prevents TOCTOU race (SEC-M1)
        // updateMany with token in WHERE acts as an optimistic lock:
        // only the first concurrent request will match; subsequent ones get count 0.
        const consumed = await prisma.user.updateMany({
            where: {
                id: user.id,
                magicLinkToken: tokenHash,
                magicLinkTokenExpiry: { gt: new Date() },
            },
            data: {
                magicLinkToken: null,
                magicLinkTokenExpiry: null,
                isEmailVerified: true,

            },
        });

        if (consumed.count !== 1) {
            return magicRedirect(request, '/login?error=magic_invalid');
        }

        // If 2FA is enabled, issue only the MFA challenge and bounce to /verify-2fa;
        // otherwise issue the full session and land on the dashboard. markUserActivity
        // for 2FA users is deferred to the verify step.
        if (user.isTotpEnabled) {
            const response = magicRedirect(request, '/verify-2fa');
            issueSessionOnResponse(response, {
                id: user.id,
                email: user.email,
                profileType: user.profileType,
                isAdmin: user.isAdmin,
                isTotpEnabled: true,
            });
            return response;
        }

        await markUserActivity(user.id, { login: true });
        const response = magicRedirect(request, '/dashboard');
        issueSessionOnResponse(response, {
            id: user.id,
            email: user.email,
            profileType: user.profileType,
            isAdmin: user.isAdmin,
            isTotpEnabled: false,
        });
        return response;

    } catch (err) {
        logger.error({ msg: 'Magic link unexpected error', err: err instanceof Error ? err.message : String(err) });
        return magicRedirect(request, '/login?error=magic_server');
    }
}
