/**
 * Mandatory-2FA enrollment gate for privileged accounts (AUDIT-20260613-041 #9).
 *
 * Admins and moderators MUST have TOTP enrolled. This gate runs in the proxy for a
 * fully-authenticated request and, if the user is privileged but not yet enrolled,
 * redirects them to the profile Security tab to enroll. It is distinct from the
 * MFA-challenge boundary (auth.ts): this is a UX nudge on an already-valid session,
 * so a middleware redirect is appropriate. The login-time security boundary is
 * enforced separately by verifyAccessToken rejecting challenge tokens.
 *
 * Fails OPEN: a DB hiccup must never lock a privileged user out of the whole app
 * (the worst case is they reach the app without being nudged this request). Contrast
 * with registration-gate, which fails closed because it guards access itself.
 *
 * NOT a 'use server' file and free of next/server imports — importable by the proxy
 * and tests alike.
 */

/** Where un-enrolled privileged users are sent (profile Security tab). */
export const TWO_FACTOR_ENROLLMENT_TARGET = '/profile?tab=security';

export type TwoFactorGatePayload = {
  userId?: string;
} | null;

/**
 * Allowed destinations while un-enrolled, so the redirect can't loop: the profile
 * page itself (where the enrollment UI lives). API routes are handled earlier in the
 * proxy and never reach this gate.
 */
function isEnrollmentAllowedPath(pathname: string): boolean {
  return pathname === '/profile' || pathname.startsWith('/profile/');
}

export async function get2faEnrollmentResumeTarget(
  payload: TwoFactorGatePayload,
  pathname: string,
): Promise<typeof TWO_FACTOR_ENROLLMENT_TARGET | null> {
  if (!payload?.userId) return null;
  if (isEnrollmentAllowedPath(pathname)) return null;

  try {
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { isAdmin: true, isModerator: true, isTotpEnabled: true },
    });
    if (!user) return null;

    const privileged = user.isAdmin === true || user.isModerator === true;
    if (!privileged || user.isTotpEnabled === true) return null;

    return TWO_FACTOR_ENROLLMENT_TARGET;
  } catch (error) {
    console.error('[2fa-enrollment-gate] failed open:', error);
    return null;
  }
}
