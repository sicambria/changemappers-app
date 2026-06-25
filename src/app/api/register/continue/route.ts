import { NextRequest, NextResponse } from 'next/server';
import { shouldUseSecureAuthCookies } from '@/lib/auth-cookie-policy';
import { resolveAuthLanguage } from '@/lib/auth-localization';
import { setLanguageCookie, withLanguage } from '@/lib/registration-confirmation-page';

function getRequestedLanguage(request: NextRequest) {
  return resolveAuthLanguage(
    request.nextUrl.searchParams.get('lang') ??
    request.cookies.get('cm_ui_language')?.value,
  );
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

function redirectToRegister(request: NextRequest, path: string, language: string) {
  const response = NextResponse.redirect(
    new URL(withLanguage(path, language), getForwardedPublicOrigin(request)),
  );
  setLanguageCookie(response, language, shouldUseSecureAuthCookies());
  return response;
}

export function GET(request: NextRequest) {
  const language = getRequestedLanguage(request);
  const hasContinuationCookie = Boolean(request.cookies.get('lean_reg_uid')?.value);

  if (hasContinuationCookie) {
    return redirectToRegister(request, '/register?step=3', language);
  }

  return redirectToRegister(request, '/register?step=3&continuation=cookie-missing', language);
}
