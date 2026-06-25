/**
 * Single session-issuance chokepoint (AUDIT-20260613-041 #9).
 *
 * Every interactive login path (password, magic link, registration auto-login)
 * routes through here instead of calling generateTokens + setAuthCookies directly.
 * This guarantees ONE place decides whether a successful first factor yields a full
 * session or an MFA challenge — no individual path can forget the 2FA check.
 *
 *   - 2FA disabled  → mint full access/refresh tokens, set the auth cookies.
 *   - 2FA enabled   → mint ONLY a short-lived MFA-challenge token (own cookie); the
 *                     caller must route the user to /verify-2fa. No access token is
 *                     issued until the second factor is verified.
 *
 * `issueFullSession*` is the post-verification path used by the verify-2fa step,
 * which has already proven the second factor and must always issue a full session.
 */
import { generateTokens, generateMfaChallengeToken, type TokenPayload } from '@/lib/auth';
import {
  setAuthCookies,
  setAuthCookiesOnResponse,
  setMfaChallengeCookie,
  setMfaChallengeCookieOnResponse,
} from '@/lib/set-auth-cookies';

export interface SessionUser {
  id: string;
  email: string;
  profileType?: string | null;
  isAdmin?: boolean | null;
  isTotpEnabled?: boolean | null;
}

export type SessionResult = { status: 'full' } | { status: 'mfa_required' };

type ResponseLike = {
  cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void };
};

function fullPayload(user: SessionUser): TokenPayload {
  return {
    userId: user.id,
    email: user.email,
    profileType: user.profileType ?? undefined,
    isAdmin: user.isAdmin ?? undefined,
    isRegistrationPending: false,
  };
}

/** Server Action / Server Component flavor (cookies via next/headers). */
export async function issueSession(user: SessionUser): Promise<SessionResult> {
  if (user.isTotpEnabled) {
    await setMfaChallengeCookie(generateMfaChallengeToken(user.id));
    return { status: 'mfa_required' };
  }
  const tokens = generateTokens(fullPayload(user));
  await setAuthCookies(tokens.accessToken, tokens.refreshToken);
  return { status: 'full' };
}

/** Route Handler flavor (cookies set on a NextResponse). */
export function issueSessionOnResponse(response: ResponseLike, user: SessionUser): SessionResult {
  if (user.isTotpEnabled) {
    setMfaChallengeCookieOnResponse(response, generateMfaChallengeToken(user.id));
    return { status: 'mfa_required' };
  }
  const tokens = generateTokens(fullPayload(user));
  setAuthCookiesOnResponse(response, tokens.accessToken, tokens.refreshToken);
  return { status: 'full' };
}

/**
 * Post-verification full session — ALWAYS issues access/refresh tokens, bypassing
 * the 2FA branch because the second factor has just been verified. Used only by the
 * verify-2fa action.
 */
export async function issueFullSession(user: SessionUser): Promise<void> {
  const tokens = generateTokens(fullPayload(user));
  await setAuthCookies(tokens.accessToken, tokens.refreshToken);
}
