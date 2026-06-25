import type { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';

function normalizeIp(value: string | null | undefined): string | null {
  let candidate = value?.trim();
  if (!candidate || candidate.toLowerCase() === 'unknown') {
    return null;
  }

  candidate = candidate.replace(/^\[([^\]]+)](?::\d+)?$/, '$1');
  candidate = candidate.replace(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/, '$1');

  return candidate.replaceAll(/(?:^\[)|(?:]$)/g, '') || null;
}

export function shouldTrustForwardedIpHeaders(): boolean {
  return process.env.TRUST_PROXY_HEADERS === '1';
}

export function getClientIp(headers: Headers | ReadonlyHeaders, options: { trustProxyHeaders?: boolean } = {}): string {
  const trustProxyHeaders = options.trustProxyHeaders ?? shouldTrustForwardedIpHeaders();

  if (!trustProxyHeaders) {
    return 'unknown';
  }

  const forwardedFor = headers.get('x-forwarded-for');

  if (forwardedFor) {
    const clientIp = forwardedFor
      .split(',')
      .map((part) => normalizeIp(part))
      .find(Boolean);

    if (clientIp) {
      return clientIp;
    }
  }

  return normalizeIp(headers.get('x-real-ip')) ?? 'unknown';
}
