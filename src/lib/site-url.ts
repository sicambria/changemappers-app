import { LOCALHOST_ORIGIN } from '@/lib/constants';

function getConfiguredAppUrl(): string | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL; // SAFE: canonical public app URL is read server-side to build outbound links.
  if (appUrl) {
    return appUrl;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_APP_URL must be set in production');
  }

  return LOCALHOST_ORIGIN;
}

export function getSiteOrigin(): string {
  return getConfiguredAppUrl() ?? LOCALHOST_ORIGIN;
}

export function buildAbsoluteUrl(path: string): string {
  return new URL(path, getSiteOrigin()).toString();
}

export function getSiteHost(): string {
  return new URL(getSiteOrigin()).host;
}
