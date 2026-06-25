export function isLocalAppUrl(appUrl: string | undefined): boolean {
  if (!appUrl) {
    return false;
  }

  try {
    const hostname = new URL(appUrl).hostname.toLowerCase();
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

export function shouldUseSecureAuthCookies(): boolean {
  if (process.env.NODE_ENV !== 'production') {
    return false;
  }

  if (process.env.CI_E2E === '1' && isLocalAppUrl(process.env.NEXT_PUBLIC_APP_URL)) { // SAFE: server-side cookie policy checks public app URL host only.
    return false;
  }

  if (process.env.CI_E2E === '1') {
    console.warn('[auth] Ignoring CI_E2E=1 for non-local NEXT_PUBLIC_APP_URL; Secure auth cookies remain enabled.');
  }

  return true;
}
