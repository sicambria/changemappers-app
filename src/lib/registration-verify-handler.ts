/**
 * Shared GET/POST handler factory for the two registration email-verification
 * routes (`/api/register/verify` and `/api/register/full/verify`). The two
 * routes were 223-line byte-twins differing only by a closed set of mode
 * parameters (cookie name/signer/max-age, rate-limit key, redirect targets,
 * pending-registration-mode enum, confirmation-page props, log label) — true
 * duplication per docs/testing/reports/2026-06/2026-06-20-code-duplication-analysis.md.
 * Each route now supplies a {@link RegisterVerifyConfig} and re-exports the
 * factory's GET/POST. Auth/cookie/rate-limit semantics are preserved verbatim.
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma, { PendingRegistrationMode } from '@/lib/prisma';
import { rateLimitAsync } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request-ip';
import { logger } from '@/lib/logger';
import { shouldUseSecureAuthCookies } from '@/lib/auth-cookie-policy';
import { hashRefreshToken } from '@/lib/auth';
import { renderRegistrationConfirmationPage, setLanguageCookie, withLanguage } from '@/lib/registration-confirmation-page';
import { resolveAuthLanguage } from '@/lib/auth-localization';

const SEE_OTHER = 303;

type VerifyUser = {
  id: string;
  verificationTokenExpiry: Date | null;
  isEmailVerified: boolean;
  isRegistrationPending: boolean;
  passwordHash: string | null;
  pendingRegistrationMode: PendingRegistrationMode | null;
};

type RegisterError = 'invalid-token' | 'rate-limited' | 'server' | 'token-expired';

/** Per-mode parameters that distinguish the lean and full verify routes. */
export interface RegisterVerifyConfig {
  /** Pending-registration mode this route accepts (LEAN or FULL). */
  mode: PendingRegistrationMode;
  /** Redirect prefix for register errors, e.g. `/register?error=` or `/register?regmode=full&error=`. */
  errorRedirectPrefix: string;
  /** Absolute-path the confirmation form POSTs to, e.g. `/api/register/verify`. */
  confirmFormActionPath: string;
  /** Confirmation-page mode flag. */
  confirmMode: 'lean' | 'full';
  /** "Back" link target on the confirmation page. */
  confirmBackHref: string;
  /** Rate-limit key prefix (the client IP is appended), e.g. `verify_email_`. */
  rateLimitKeyPrefix: string;
  /** Path to redirect to on a successful POST verification. */
  successRedirectPath: string;
  /** Continuation cookie name, e.g. `lean_reg_uid`. */
  cookieName: string;
  /** Signs the continuation cookie value for a user id. */
  signCookie: (userId: string) => string;
  /** Continuation cookie max-age in seconds. */
  cookieMaxAgeSeconds: number;
  /** Human label used in error logs, e.g. `Lean` / `Full`. */
  logLabel: string;
}

function isLoopbackLikeHost(host: string) {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0';
}

function hostnameFromHostHeader(host: string) {
  if (host.startsWith('[')) {
    return host.slice(1, host.indexOf(']'));
  }
  return host.split(':')[0] ?? host;
}

function getForwardedPublicOrigin(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const host = forwardedHost?.split(',')[0]?.trim();
  const proto = forwardedProto?.split(',')[0]?.trim();

  if (host && (proto === 'https' || proto === 'http')) {
    const forwardedHostname = hostnameFromHostHeader(host);
    const isInternalBindAddress = requestUrl.hostname === '0.0.0.0';
    const isLocalHostRewrite =
      !isInternalBindAddress &&
      isLoopbackLikeHost(requestUrl.hostname) &&
      isLoopbackLikeHost(forwardedHostname) &&
      requestUrl.hostname !== forwardedHostname;
    if (!isLocalHostRewrite) {
      return `${proto}://${host}`;
    }
  }

  return requestUrl.origin;
}

function publicUrl(request: NextRequest, path: string) {
  return new URL(path, getForwardedPublicOrigin(request));
}

function getRequestedLanguage(request: NextRequest, formLanguage?: FormDataEntryValue | null) {
  return resolveAuthLanguage(
    (typeof formLanguage === 'string' ? formLanguage : null) ??
    request.nextUrl.searchParams.get('lang') ??
    request.cookies.get('cm_ui_language')?.value,
  );
}

function localizedRedirect(request: NextRequest, path: string, language: string, status?: number) {
  const response = NextResponse.redirect(publicUrl(request, withLanguage(path, language)), status ? { status } : undefined);
  setLanguageCookie(response, language, shouldUseSecureAuthCookies());
  return response;
}

function redirectToPath(request: NextRequest, path: string, language: string, status?: number) {
  return localizedRedirect(request, path, language, status);
}

async function findVerificationUser(token: string): Promise<VerifyUser | null> {
  const tokenHash = hashRefreshToken(token);

  return prisma.user.findUnique({
    where: { verificationToken: tokenHash },
    select: {
      id: true,
      verificationTokenExpiry: true,
      isEmailVerified: true,
      isRegistrationPending: true,
      passwordHash: true,
      pendingRegistrationMode: true,
    },
  });
}

async function readPostPayload(request: NextRequest) {
  const urlToken = request.nextUrl.searchParams.get('token');
  const formData = await request.formData();
  const formToken = formData.get('token');
  return {
    token: urlToken || (typeof formToken === 'string' ? formToken : null),
    language: getRequestedLanguage(request, formData.get('lang')),
  };
}

function redirectToRegister(
  config: Readonly<RegisterVerifyConfig>,
  request: NextRequest,
  error: RegisterError,
  language: string,
  status?: number,
) {
  return localizedRedirect(request, `${config.errorRedirectPrefix}${error}`, language, status);
}

async function handleVerifyGet(config: Readonly<RegisterVerifyConfig>, request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const language = getRequestedLanguage(request);

  if (!token) {
    return redirectToRegister(config, request, 'invalid-token', language);
  }

  try {
    const user = await findVerificationUser(token);

    if (!user) {
      return redirectToRegister(config, request, 'invalid-token', language);
    }

    if (user.verificationTokenExpiry != null && user.verificationTokenExpiry < new Date()) {
      return redirectToRegister(config, request, 'token-expired', language);
    }

    if (user.passwordHash) {
      return redirectToPath(request, '/dashboard', language);
    }

    if (user.isRegistrationPending !== true || user.pendingRegistrationMode !== config.mode) {
      return redirectToRegister(config, request, 'invalid-token', language);
    }

    const response = renderRegistrationConfirmationPage({
      token,
      language,
      formAction: publicUrl(request, config.confirmFormActionPath).toString(),
      nonce: request.headers.get('x-nonce'),
      mode: config.confirmMode,
      backHref: withLanguage(config.confirmBackHref, language),
    });
    setLanguageCookie(response, language, shouldUseSecureAuthCookies());
    return response;
  } catch (err) {
    logger.error({ msg: `${config.logLabel} registration verify GET unexpected error`, err: err instanceof Error ? err.message : String(err) });
    return redirectToRegister(config, request, 'server', language);
  }
}

async function handleVerifyPost(config: Readonly<RegisterVerifyConfig>, request: NextRequest) {
  const { token, language } = await readPostPayload(request);

  if (!token) {
    return redirectToRegister(config, request, 'invalid-token', language, SEE_OTHER);
  }

  const ip = getClientIp(request.headers);
  const rl = await rateLimitAsync(`${config.rateLimitKeyPrefix}${ip}`, 5, 60_000);
  if (!rl.success) {
    return redirectToRegister(config, request, 'rate-limited', language, SEE_OTHER);
  }

  try {
    const user = await findVerificationUser(token);

    if (!user) {
      return redirectToRegister(config, request, 'invalid-token', language, SEE_OTHER);
    }

    if (user.verificationTokenExpiry != null && user.verificationTokenExpiry < new Date()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { verificationToken: null, verificationTokenExpiry: null },
        select: { id: true },
      });
      return redirectToRegister(config, request, 'token-expired', language, SEE_OTHER);
    }

    if (user.passwordHash) {
      return redirectToPath(request, '/dashboard', language, SEE_OTHER);
    }

    if (user.isRegistrationPending !== true || user.pendingRegistrationMode !== config.mode) {
      return redirectToRegister(config, request, 'invalid-token', language, SEE_OTHER);
    }

    if (!user.isEmailVerified) {
      const verified = await prisma.user.updateMany({
        where: { id: user.id, verificationToken: hashRefreshToken(token) },
        data: { isEmailVerified: true },
      });

      if (verified.count !== 1) {
        return redirectToRegister(config, request, 'invalid-token', language, SEE_OTHER);
      }
    }

    const response = redirectToPath(request, config.successRedirectPath, language, SEE_OTHER);
    response.cookies.set(config.cookieName, config.signCookie(user.id), {
      httpOnly: true,
      sameSite: 'lax',
      secure: shouldUseSecureAuthCookies(),
      maxAge: config.cookieMaxAgeSeconds,
      path: '/',
    });
    setLanguageCookie(response, language, shouldUseSecureAuthCookies());

    return response;
  } catch (err) {
    logger.error({ msg: `${config.logLabel} registration verify POST unexpected error`, err: err instanceof Error ? err.message : String(err) });
    return redirectToRegister(config, request, 'server', language, SEE_OTHER);
  }
}

/**
 * Build the GET/POST route handlers for a registration verify route from its
 * per-mode {@link RegisterVerifyConfig}. Behaviour is identical to the original
 * hand-written routes; only the mode-specific constants are injected. The GET
 * and POST implementations are module-level (taking `config` as a parameter) so
 * each stays a small, single-purpose function.
 */
export function createRegisterVerifyHandlers(config: Readonly<RegisterVerifyConfig>) {
  return {
    GET: (request: NextRequest) => handleVerifyGet(config, request),
    POST: (request: NextRequest) => handleVerifyPost(config, request),
  };
}
