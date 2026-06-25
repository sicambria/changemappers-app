import type { SignOptions } from 'jsonwebtoken';

const DEFAULT_ACCESS_TOKEN_EXPIRY = '15m';
const E2E_ACCESS_TOKEN_EXPIRY = '2h';
const DEFAULT_ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60;
const E2E_ACCESS_TOKEN_MAX_AGE_SECONDS = 2 * 60 * 60;

function isLocalAppUrl(value: string): boolean {
  try {
    const hostname = new URL(value).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

export function isLocalE2EAuthSession(): boolean {
  const isE2E =
    process.env.CI_E2E === '1' ||
    process.env.PLAYWRIGHT_TEST === '1';

  if (!isE2E) {
    return false;
  }

  return isLocalAppUrl(process.env.APP_URL ?? 'http://127.0.0.1:3000');
}

export function getAccessTokenExpiry(): SignOptions['expiresIn'] {
  return isLocalE2EAuthSession() ? E2E_ACCESS_TOKEN_EXPIRY : DEFAULT_ACCESS_TOKEN_EXPIRY;
}

export function getAccessTokenMaxAgeSeconds(): number {
  return isLocalE2EAuthSession()
    ? E2E_ACCESS_TOKEN_MAX_AGE_SECONDS
    : DEFAULT_ACCESS_TOKEN_MAX_AGE_SECONDS;
}
