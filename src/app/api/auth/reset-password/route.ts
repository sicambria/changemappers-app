/**
 * GET /api/auth/reset-password?token=xxx
 * Verifies a password reset token and redirects to the reset password form.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashRefreshToken } from '@/lib/auth';
import { isPendingRegistrationAccount } from '@/lib/registration-completion';
import { logger } from '@/lib/logger';
import { shouldUseSecureAuthCookies } from '@/lib/auth-cookie-policy';

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

function resetRedirect(request: NextRequest, search: string): NextResponse {
  return NextResponse.redirect(new URL(`/reset-password${search}`, getForwardedPublicOrigin(request)));
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token || token.length < 64) {
    return resetRedirect(request, '?error=reset_invalid');
  }

  try {
    // SEC-H4: tokens stored as SHA-256 hashes; hash before lookup
    const tokenHash = hashRefreshToken(token);
    const user = await prisma.user.findUnique({
      where: { resetToken: tokenHash },
      select: { id: true, name: true, passwordHash: true, isRegistrationPending: true, resetTokenExpiry: true, resetTokenClaimedAt: true },
    });

    if (!user) {
      return resetRedirect(request, '?error=reset_invalid');
    }

    if (isPendingRegistrationAccount(user)) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: null, resetTokenExpiry: null, resetTokenClaimedAt: null },
      });
      return resetRedirect(request, '?error=reset_invalid');
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: null, resetTokenExpiry: null, resetTokenClaimedAt: null },
      });
      return resetRedirect(request, '?error=reset_expired');
    }

    if (user.resetTokenClaimedAt) {
      return resetRedirect(request, '?error=reset_invalid');
    }

    const claimed = await prisma.user.updateMany({
      where: { id: user.id, resetToken: tokenHash, resetTokenExpiry: { gt: new Date() }, resetTokenClaimedAt: null },
      data: { resetTokenClaimedAt: new Date() },
    });

    if (claimed.count !== 1) {
      return resetRedirect(request, '?error=reset_invalid');
    }

    const response = resetRedirect(request, '?ready=1');
    response.cookies.set('resetToken', token, {
      httpOnly: true,
      secure: shouldUseSecureAuthCookies(),
      sameSite: 'lax',
      maxAge: 60 * 60,
      path: '/',
    });
    return response;
  } catch (err) {
    logger.error({ msg: 'Password reset unexpected error', err: err instanceof Error ? err.message : String(err) });
    return resetRedirect(request, '?error=reset_server');
  }
}
