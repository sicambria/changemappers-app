import path from 'node:path';
import { createHash, timingSafeEqual } from 'node:crypto';

export interface ValidateRedirectResult {
  isValid: boolean;
  safeUrl: string;
  error?: string;
}

const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:'];

/**
 * Returns a rejection reason string if the trimmed URL string is obviously
 * unsafe (dangerous protocol, protocol-relative `//`, or backslash path),
 * or null if none of the fast-path checks fire.
 */
function obviouslyUnsafeReason(trimmed: string, lower: string): string | null {
  if (DANGEROUS_PROTOCOLS.some(p => lower.startsWith(p))) return 'Dangerous protocol';
  if (trimmed.startsWith('//')) return 'Protocol-relative URL not allowed';
  if (trimmed.startsWith('\\')) return 'Backslash paths not allowed';
  return null;
}

/**
 * Checks whether the parsed absolute URL belongs to the same origin as
 * NEXT_PUBLIC_APP_URL. Returns an accepted ValidateRedirectResult (path-only
 * safeUrl) when the hosts match, or null when they do not (or the env var is
 * absent / malformed).
 */
function sameOriginAppUrlMatch(host: string, pathPart: string): ValidateRedirectResult | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL; // SAFE:
  if (appUrl) {
    try {
      if (host === new URL(appUrl).hostname.toLowerCase()) {
        return { isValid: true, safeUrl: pathPart };
      }
    } catch { /* ignore bad env URL */ }
  }
  return null;
}

/**
 * Validates a redirect URL to prevent open redirect vulnerabilities.
 * Returns { isValid, safeUrl, error? }. Relative paths and allowlisted hosts are accepted.
 * Same-origin absolute URLs are stripped to path-only.
 */
export function validateRedirect(
  to: string | null | undefined,
  allowedHosts: string[] = []
): ValidateRedirectResult {
  const invalid = (error?: string): ValidateRedirectResult => ({ isValid: false, safeUrl: '/', error });

  if (!to || typeof to !== 'string') return invalid('Empty redirect target');

  const trimmed = to.trim();
  if (!trimmed) return invalid('Empty redirect target');

  const lower = trimmed.toLowerCase();

  const unsafeReason = obviouslyUnsafeReason(trimmed, lower);
  if (unsafeReason) return invalid(unsafeReason);

  if (trimmed.startsWith('/')) return { isValid: true, safeUrl: trimmed };

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return invalid('Malformed URL');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return invalid(`Protocol '${url.protocol}' not allowed`);
  }

  const host = url.hostname.toLowerCase();
  const pathPart = url.pathname + (url.search ?? '') + (url.hash ?? '');

  const appUrlMatch = sameOriginAppUrlMatch(host, pathPart);
  if (appUrlMatch) return appUrlMatch;

  if (process.env.NODE_ENV !== 'production' && (host === 'localhost' || host === '127.0.0.1')) {
    return { isValid: true, safeUrl: pathPart };
  }

  if (allowedHosts.map(h => h.toLowerCase()).includes(host)) {
    return { isValid: true, safeUrl: pathPart };
  }

  return invalid(`Host '${host}' not in allowlist`);
}

export interface SafeFetchResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

const DEFAULT_SAFE_FETCH_HOSTS = ['localhost', '127.0.0.1'];

/**
 * Fetches a URL after validating protocol and host to prevent SSRF.
 * Only http/https is allowed. Localhost is allowed by default; pass allowedHosts to permit others.
 */
export async function safeUrlFetch<T = unknown>(
  urlString: string | null | undefined,
  allowedHosts?: string[],
  options?: RequestInit
): Promise<SafeFetchResult<T>> {
  if (!urlString) return { ok: false, error: 'Invalid URL provided' };

  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { ok: false, error: 'Invalid URL format' };
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return { ok: false, error: `Protocol '${url.protocol}' not allowed` };
  }

  const host = url.hostname.toLowerCase();
  const effective = allowedHosts ? allowedHosts.map(h => h.toLowerCase()) : DEFAULT_SAFE_FETCH_HOSTS;

  if (!effective.includes(host)) {
    return { ok: false, error: `Host '${host}' not allowed` };
  }

  try {
    const response = await fetch(urlString, options);
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch (error) {
    if (error instanceof Error) return { ok: false, error: error.message };
    return { ok: false, error: 'Unknown fetch error' };
  }
}

/**
 * Performs a timing-safe comparison between two strings.
 * Use this for secrets, tokens, and passwords.
 */
export function safeCompare(a: string, b: string): boolean {
  const aDigest = createHash('sha256').update(a).digest();
  const bDigest = createHash('sha256').update(b).digest();
  return timingSafeEqual(aDigest, bDigest);
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replaceAll(/(?:^\[)|(?:\]$)/g, '');
  if (normalized === 'localhost' || normalized === '::1') return true;
  if (/^(0x|0\d|\d+$)/.test(normalized)) return true;

  const parts = normalized.split('.');
  if (parts.length === 4 && parts.every((part) => /^\d+$/.test(part))) {
    const [a, b] = parts.map(Number);
    if (a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 192 && b === 168)) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }

  return normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:');
}

/**
 * Validates a URL before fetching to prevent SSRF.
 * Restricts protocols to http/https and blocks private IP ranges.
 */
export function isValidFetchUrl(urlString: string, allowedDomains: string[] = []): boolean {
  try {
    const url = new URL(urlString);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    const hostname = url.hostname.toLowerCase();
    if (isBlockedHostname(hostname)) return false;
    if (allowedDomains.length > 0 && !allowedDomains.includes(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifies a cron route Authorization header against CRON_SECRET in constant time.
 * Uses SHA-256 digest comparison so neither string length nor content timing leaks.
 */
export function verifyCronSecret(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authHeader) return false;
  return safeCompare(authHeader, `Bearer ${secret}`);
}

/**
 * Sanitizes a file path to prevent directory traversal.
 * Returns null for invalid, null, or empty inputs.
 */
export function safeFilePath(baseDir: string, userInput: string): string | null {
  if (!baseDir || !userInput || typeof baseDir !== 'string' || typeof userInput !== 'string') {
    return null;
  }

  if (userInput.includes('\\')) return null;

  const resolvedBase = path.resolve(baseDir);
  const resolvedPath = path.resolve(baseDir, userInput);

  if (resolvedPath !== resolvedBase && !resolvedPath.startsWith(resolvedBase + path.sep)) {
    return null;
  }

  return resolvedPath;
}
