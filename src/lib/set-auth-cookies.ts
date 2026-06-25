/**
 * Shared cookie setter for auth tokens.
 *
 * NO 'use server' directive — can be imported from both Server Actions and
 * the get-current-user utility without crossing module boundaries.
 */

import { cookies } from 'next/headers';
import { shouldUseSecureAuthCookies } from '@/lib/auth-cookie-policy';
import { getAccessTokenMaxAgeSeconds } from '@/lib/auth-token-policy';

/** Cookie holding the short-lived MFA-challenge token (AUDIT-20260613-041 #9). */
export const MFA_CHALLENGE_COOKIE = 'mfaChallenge';
const MFA_CHALLENGE_MAX_AGE_SECONDS = 10 * 60; // matches MFA_CHALLENGE_EXPIRY in auth.ts

export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
    const cookieStore = await cookies();
    const secure = shouldUseSecureAuthCookies();

    cookieStore.set('accessToken', accessToken, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        maxAge: getAccessTokenMaxAgeSeconds(),
        path: '/',
    });

    cookieStore.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
    });
}

/**
 * Set auth cookies on a NextResponse (for use in Route Handlers).
 * Route Handlers cannot use cookies().set() reliably; this sets cookies
 * directly on the response object instead.
 */
export function setAuthCookiesOnResponse(
    response: { cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void } },
    accessToken: string,
    refreshToken: string,
): void {
    const secure = shouldUseSecureAuthCookies();

    response.cookies.set('accessToken', accessToken, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        maxAge: getAccessTokenMaxAgeSeconds(),
        path: '/',
    });

    response.cookies.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60,
        path: '/',
    });
}

/** Server Action / Server Component flavor: set the MFA-challenge cookie. */
export async function setMfaChallengeCookie(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(MFA_CHALLENGE_COOKIE, token, {
        httpOnly: true,
        secure: shouldUseSecureAuthCookies(),
        sameSite: 'lax',
        maxAge: MFA_CHALLENGE_MAX_AGE_SECONDS,
        path: '/',
    });
}

/** Server Action / Server Component flavor: clear the MFA-challenge cookie. */
export async function clearMfaChallengeCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(MFA_CHALLENGE_COOKIE, '', {
        httpOnly: true,
        secure: shouldUseSecureAuthCookies(),
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
    });
}

/** Route Handler flavor: set the MFA-challenge cookie on a NextResponse. */
export function setMfaChallengeCookieOnResponse(
    response: { cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void } },
    token: string,
): void {
    response.cookies.set(MFA_CHALLENGE_COOKIE, token, {
        httpOnly: true,
        secure: shouldUseSecureAuthCookies(),
        sameSite: 'lax',
        maxAge: MFA_CHALLENGE_MAX_AGE_SECONDS,
        path: '/',
    });
}
