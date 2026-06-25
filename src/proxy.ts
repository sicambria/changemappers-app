import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { refreshAccessToken, verifyAccessToken, verifyMfaChallengeToken, type AuthTokens, type TokenPayload } from '@/lib/auth';
import { setAuthCookiesOnResponse, MFA_CHALLENGE_COOKIE } from '@/lib/set-auth-cookies';
import {
  getRegistrationGateResumeTarget,
  type RegistrationResumeTarget,
} from '@/lib/registration-gate';
import { get2faEnrollmentResumeTarget } from '@/lib/2fa-enrollment-gate';

const PUBLIC_EXACT_PATHS = [
  '/',
  '/login',
  '/verify-2fa',
  '/register',
  '/verify-email',
  '/help',
  '/forgot-password',
  '/reset-password',
  '/account/pending-approval',
  '/privacy',
  '/legal/terms',
  '/legal/impressum',
  '/governance',
  '/about',
  '/about/governance',
  '/planet',
  '/map',
  '/health',
  '/draw',
  '/glossary',
  '/roadmap',
  '/causes',
  '/feed',
  '/stories',
  '/social-issues',
  '/reflect',
  '/reflect/focus',
  '/reflect/helpers',
  '/reflect/lifewheel',
  '/reflect/principles',
  '/reflect/values',
  '/social-issues/create',
  '/communities',
  '/communities/create',
  '/events',
  '/api/health',
  '/.well-known/mta-sts.txt',
  '/.well-known/security.txt',
];

const PUBLIC_PREFIX_PATHS = [
  '/learn',
  '/tools',
  '/contribute',
  '/api/auth',
  '/feed',
];

const PUBLIC_ROUTE_PATTERNS = [
  /^\/causes\/[^/]+$/,
  /^\/communities\/[^/]+$/,
  /^\/events\/[^/]+$/,
  /^\/feed\/[^/]+$/,
  /^\/about\/governance\/[^/]+$/,
  /^\/governance\/[^/]+$/,
];

const STATIC_ASSET_PATTERNS = [
  /^\/_next\//,
  /^\/favicon\.ico/,
  /^\/robots\.txt/,
  /^\/sitemap\.xml/,
  /\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|css|js)$/i,
]

import { getRouteByPath, getAllRoutes } from '@/lib/route-loader';

interface HardDisabledCache {
  paths: Set<string>;
  loadedAt: number;
}

let hardDisabledCache: HardDisabledCache | null = null;
const HARD_DISABLED_CACHE_TTL_MS = 30_000;
const ANONYMOUS_PUBLIC_PAGE_CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=86400';
const VIEWER_SPECIFIC_PUBLIC_HTML_PATHS = new Set([
  '/feed',
  '/planet',
  '/login',
  '/verify-2fa',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
]);
const PAGE_ALLOWED_METHODS = new Set(['GET', 'HEAD', 'POST']);

async function getHardDisabledPaths(): Promise<Set<string>> {
  const now = Date.now();
  if (hardDisabledCache && now - hardDisabledCache.loadedAt < HARD_DISABLED_CACHE_TTL_MS) {
    return hardDisabledCache.paths;
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    const configs = await prisma.routeConfig.findMany({
      where: { hardDisabled: true },
      select: { routeId: true, path: true },
      take: 500,
    });

    const paths = new Set<string>();
    const allRoutes = getAllRoutes();

    for (const config of configs) {
      if (config.path) paths.add(config.path);
      // Also add paths associated with this routeId if it was a menu ID
      const route = allRoutes.find(r => r.path === config.routeId || r.path === config.path);
      if (route) paths.add(route.path);
    }

    hardDisabledCache = { paths, loadedAt: now };
    return paths;
  } catch (err) {
    // Serve the last-known-good cache on DB error (fail-safe).
    // If no prior cache exists (cold-start), return empty — routes are accessible
    // until the DB recovers, which is acceptable for a brief cold-start window.
    logger.error({ msg: 'proxy getHardDisabledPaths DB error — serving stale cache', err: err instanceof Error ? err.message : String(err) });
    return hardDisabledCache?.paths ?? new Set();
  }
}

async function isHardDisabledPath(pathname: string): Promise<boolean> {
  const cleanPath = pathname.split('?')[0];
  const disabledPaths = await getHardDisabledPaths();

  // 1. Exact match
  if (disabledPaths.has(cleanPath)) return true;

  // 2. Dynamic pattern match
  const route = getRouteByPath(cleanPath);
  if (route && disabledPaths.has(route.path)) return true;

  // 3. Prefix match for broad disabling (e.g., /admin)
  for (const dp of disabledPaths) {
    if (cleanPath.startsWith(dp + '/')) return true;
  }

  return false;
}

function redirectToRegistrationTarget(request: NextRequest, target: RegistrationResumeTarget): NextResponse {
  return NextResponse.redirect(new URL(target, request.url));
}

/**
 * Validates that a redirect target is a safe same-origin relative path.
 * Rejects paths that start with '//' (protocol-relative external URLs) or
 * that don't start with '/' (relative paths that could be ambiguous).
 */
function validateRedirect(pathname: string): string {
  if (typeof pathname !== 'string' || !pathname.startsWith('/') || pathname.startsWith('//')) {
    return '/dashboard';
  }
  if (pathname.includes('@') || pathname.includes('%40')) {
    return '/dashboard';
  }
  return pathname;
}

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.includes(pathname)) {
    return true;
  }
  if (PUBLIC_PREFIX_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  if (PUBLIC_ROUTE_PATTERNS.some(pattern => pattern.test(pathname))) {
    return true;
  }
  if (STATIC_ASSET_PATTERNS.some(pattern => pattern.test(pathname))) {
    return true;
  }
  return false;
}

function isPublicHtmlPath(pathname: string): boolean {
  return isPublicPath(pathname) &&
    !pathname.startsWith('/api/') &&
    !STATIC_ASSET_PATTERNS.some(pattern => pattern.test(pathname));
}

function isViewerSpecificPublicHtmlPath(pathname: string): boolean {
  if (VIEWER_SPECIFIC_PUBLIC_HTML_PATHS.has(pathname)) {
    return true;
  }
  return pathname.startsWith('/feed/');
}

function getJitsiCspSources(): string[] {
  const configuredDomain = (process.env.NEXT_PUBLIC_JITSI_DOMAIN || 'meet.jit.si')
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
  const sources = [`https://${configuredDomain}`, `wss://${configuredDomain}`];

  if (configuredDomain === 'meet.jit.si') {
    sources.push('https://*.meet.jit.si', 'wss://*.meet.jit.si');
  }

  return sources;
}

function getSocketIoCspSources(): string[] {
  const isDev = process.env.NODE_ENV === 'development';
  // CI_E2E is injected by playwright.config.ts webServer.env — never set in real production.
  const isE2E = process.env.CI_E2E === '1';
  if (isDev || isE2E) {
    // Allow any localhost port for the custom Socket.IO dev/test server.
    return ['ws://localhost:3000', 'ws://localhost:3001', 'wss://localhost:3000', 'wss://localhost:3001'];
  }

  // In production the socket server runs on the same hostname as the app.
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
  if (socketUrl) {
    try {
      const { hostname } = new URL(socketUrl);
      return [`wss://${hostname}`];
    } catch { /* fall through to app URL derivation */ }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      const { hostname } = new URL(appUrl);
      return [`wss://${hostname}`];
    } catch { /* fall through to empty — no wildcard */ }
  }

  return [];
}

function addOriginSource(sources: Set<string>, rawUrl: string | undefined) {
  if (!rawUrl) return;
  try {
    sources.add(new URL(rawUrl).origin);
  } catch {
    // Ignore invalid optional operator config; startup validation covers required production URLs.
  }
}

function getFormActionCspSources(isDev: boolean, isE2E: boolean) {
  const sources = new Set(["'self'"]);
  addOriginSource(sources, process.env.NEXT_PUBLIC_APP_URL);

  if (isDev || isE2E) {
    sources.add('http://127.0.0.1:3000');
    sources.add('http://localhost:3000');
    sources.add('http://0.0.0.0:3000');
  }

  return [...sources].join(' ');
}
function buildCspHeader(nonce: string) {
  const isDev = process.env.NODE_ENV === 'development';
  // CI_E2E is injected by playwright.config.ts webServer.env — never set in real production.
  const isE2E = process.env.CI_E2E === '1';
  const jitsiSources = getJitsiCspSources();
  const jitsiFrameSources = jitsiSources.filter(source => source.startsWith('https://')).join(' ');
  const socketSources = getSocketIoCspSources();
  const cspHeader = [
    "default-src 'self'",
    // sha256 hash covers the inline script Next.js injects without a nonce (identified 2026-06-06).
    `script-src 'self' 'nonce-${nonce}' 'sha256-ieoeWczDHkReVBsRBqaal5AFMlBtNjMzgwKvLqi/tSU='${isDev ? " 'unsafe-eval'" : ''} ${jitsiFrameSources}`,
    // Browsers ignore 'unsafe-inline' when a nonce is also present (CSP Level 2).
    // In E2E/dev, Excalidraw applies style="" HTML attributes, so we omit the nonce
    // from style-src and use 'unsafe-inline' instead. Production uses nonce only.
    isDev || isE2E
      ? `style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com`
      : `style-src 'self' 'nonce-${nonce}' https://cdnjs.cloudflare.com`,
    // Sonner and a few framework/runtime client paths inject style elements without a nonce.
    // Keep scripts nonce-gated while allowing style elements and attributes for MVP browser compatibility.
    "style-src-elem 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    `frame-src 'self' https://www.youtube-nocookie.com https://embed.diagrams.net ${jitsiFrameSources}`,
    // Explicit Socket.IO origins (wss://hostname) replace the former wss:/ws: wildcards.
    // See AUDIT-20260510-002.
    `connect-src 'self' ${socketSources.join(' ')} https://nominatim.openstreetmap.org https://*.ingest.sentry.io ${jitsiSources.join(' ')}`,
    "media-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    `form-action ${getFormActionCspSources(isDev, isE2E)}`,
    "frame-ancestors 'self'",
  ].join('; ');

  return { cspHeader };
}

function replaceCookieValue(cookieHeader: string, name: string, value: string): string {
  const encoded = `${name}=${encodeURIComponent(value)}`;
  const parts = cookieHeader
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .filter(part => !part.startsWith(`${name}=`));

  return [encoded, ...parts].join('; ');
}

function addAuthCookiesToRequestHeaders(headers: Headers, tokens: AuthTokens): void {
  let cookieHeader = headers.get('cookie') ?? '';
  cookieHeader = replaceCookieValue(cookieHeader, 'accessToken', tokens.accessToken);
  cookieHeader = replaceCookieValue(cookieHeader, 'refreshToken', tokens.refreshToken);
  headers.set('cookie', cookieHeader);
}

function withSecurityHeaders(
  request: NextRequest,
  options?: { cachePrivateNoStore?: boolean; cacheAnonymousPublicPage?: boolean; authTokens?: AuthTokens },
) {
  const nonce = btoa(crypto.randomUUID());
  const { cspHeader } = buildCspHeader(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', cspHeader);
  requestHeaders.set('x-nonce', nonce);

  if (options?.authTokens) {
    addAuthCookiesToRequestHeaders(requestHeaders, options.authTokens);
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Content-Security-Policy', cspHeader);

  if (options?.authTokens) {
    setAuthCookiesOnResponse(response, options.authTokens.accessToken, options.authTokens.refreshToken);
  }

  if (options?.cachePrivateNoStore) {
    response.headers.set('Cache-Control', 'private, no-store');
  } else if (options?.cacheAnonymousPublicPage) {
    response.headers.set('Cache-Control', ANONYMOUS_PUBLIC_PAGE_CACHE_CONTROL);
    response.headers.set('CDN-Cache-Control', ANONYMOUS_PUBLIC_PAGE_CACHE_CONTROL);
    response.headers.set('Vary', 'Accept-Language, Accept-Encoding, Cookie');
  }

  return response;
}

/**
 * Checks kill switches for restricted paths.
 * Returns a `NextResponse` (503 or redirect) if the request should be blocked,
 * or `null` to fall through to the rest of the proxy.
 */
async function resolveKillSwitchResponse(pathname: string, request: NextRequest): Promise<NextResponse | null> {
  const isRestrictedPath =
    pathname.startsWith('/ap/') ||
    pathname === '/register' ||
    pathname.startsWith('/api/discovery') ||
    pathname.startsWith('/api/export') ||
    pathname.startsWith('/api/rss');

  if (!isRestrictedPath) return null;

  try {
    const { getKillSwitches } = await import('@/lib/security/kill-switch');
    const switches = await getKillSwitches();

    if (pathname.startsWith('/ap/') && !switches.activityPubEnabled) {
      return new NextResponse('ActivityPub Federation is temporarily disabled.', { status: 503 });
    }
    if (pathname === '/register' && request.method === 'GET' && !switches.userRegistrationEnabled) {
      const url = new URL('/', request.url);
      url.searchParams.set('error', 'registration_disabled');
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith('/api/discovery') && !switches.lanDiscoveryEnabled) {
      return new NextResponse('LAN Discovery is disabled.', { status: 503 });
    }
    if (pathname.startsWith('/api/export') && !switches.externalExportsEnabled) {
      return new NextResponse('Exports are disabled.', { status: 503 });
    }
    if (pathname.startsWith('/api/rss') && !switches.rssFetchingEnabled) {
      return new NextResponse('RSS fetching is disabled.', { status: 503 });
    }
  } catch (error) {
    logger.error({ msg: 'proxy kill switch check failed', err: error instanceof Error ? error.message : String(error) });
    return new NextResponse('Service temporarily unavailable while security controls recover.', { status: 503 });
  }

  return null;
}

/**
 * Checks the registration gate and 2FA enrollment gate for a verified payload.
 * Returns a redirect `NextResponse` if either gate fires, or `null` to fall through.
 */
async function resolveGateRedirects(
  payload: TokenPayload | null,
  request: NextRequest,
  pathname: string,
): Promise<NextResponse | null> {
  const registrationResumeTarget = await getRegistrationGateResumeTarget(payload);
  if (registrationResumeTarget) {
    return redirectToRegistrationTarget(request, registrationResumeTarget);
  }

  const twoFaTarget = await get2faEnrollmentResumeTarget(payload, pathname);
  if (twoFaTarget) {
    return NextResponse.redirect(new URL(twoFaTarget, request.url));
  }

  return null;
}

/**
 * Handles the entire /admin branch: missing token, non-admin token, gate redirects, allow.
 * Returns a `NextResponse` (redirect or allow) always — /admin never falls through.
 */
async function resolveAdminResponse(
  accessToken: string | undefined,
  request: NextRequest,
  pathname: string,
): Promise<NextResponse> {
  if (!accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', validateRedirect(pathname));
    return NextResponse.redirect(loginUrl);
  }

  const payload = verifyAccessToken(accessToken);
  if (payload?.isAdmin !== true) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const gateRedirect = await resolveGateRedirects(payload, request, pathname);
  if (gateRedirect) return gateRedirect;

  return withSecurityHeaders(request, { cachePrivateNoStore: true });
}

/**
 * Handles responses for public (non-authenticated) paths.
 * Determines whether to serve a shared anonymous cache, a private no-store response,
 * or a regular cached public response depending on cookies and path type.
 */
function resolvePublicPathResponse(
  request: NextRequest,
  pathname: string,
  accessToken: string | undefined,
  refreshToken: string | undefined,
): NextResponse {
  const hasAnyCookie = Boolean(request.headers.get('cookie')) || Boolean(accessToken || refreshToken);
  const isViewerSpecificPublicHtml = isPublicHtmlPath(pathname) && isViewerSpecificPublicHtmlPath(pathname);
  const canUseSharedPublicCache =
    isPublicHtmlPath(pathname) &&
    !isViewerSpecificPublicHtml &&
    (request.method === 'GET' || request.method === 'HEAD') &&
    !hasAnyCookie;

  return withSecurityHeaders(request, {
    cachePrivateNoStore: isViewerSpecificPublicHtml || (!canUseSharedPublicCache && Boolean(accessToken || refreshToken)),
    cacheAnonymousPublicPage: canUseSharedPublicCache,
  });
}

/**
 * Handles refresh-token rotation for a session with no valid access token.
 * Refreshes the access token, runs gate checks on the rotated payload, and
 * returns the final response (with updated cookies) or a login redirect.
 * Called only when `!validAccessPayload && refreshToken` is true.
 */
async function handleRefreshRotation(
  request: NextRequest,
  pathname: string,
  refreshToken: string,
): Promise<NextResponse> {
  const tokens = await refreshAccessToken(refreshToken);

  if (!tokens) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', validateRedirect(pathname));
    return NextResponse.redirect(loginUrl);
  }

  const rotatedPayload = verifyAccessToken(tokens.accessToken);
  const rotatedGateRedirect = await resolveGateRedirects(rotatedPayload, request, pathname);
  if (rotatedGateRedirect) return rotatedGateRedirect;

  return withSecurityHeaders(request, { cachePrivateNoStore: true, authTokens: tokens });
}

/**
 * Handles the authenticated session flow for protected routes:
 * unauthenticated redirect, MFA-challenge redirect, registration/2FA gate checks,
 * refresh-token rotation, and the final pass-through response.
 * Returns a `NextResponse` always — the authenticated flow never falls through.
 */
async function resolveSessionResponse(
  request: NextRequest,
  pathname: string,
  accessToken: string | undefined,
  refreshToken: string | undefined,
  mfaChallengeToken: string | undefined,
): Promise<NextResponse> {
  // Consider the user authenticated if either token is present.
  // Protected page navigations rotate refresh-only sessions here so the
  // replacement cookies can be persisted and forwarded into the render request.
  const hasSession = Boolean(accessToken || refreshToken);
  const validAccessPayload = accessToken ? verifyAccessToken(accessToken) : null;

  if (!hasSession || (accessToken && !validAccessPayload && !refreshToken)) {
    // A user mid-2FA holds only an MFA-challenge cookie (no access/refresh token).
    // Send them to complete the second factor rather than to a bare /login.
    if (mfaChallengeToken && verifyMfaChallengeToken(mfaChallengeToken)) {
      return NextResponse.redirect(new URL('/verify-2fa', request.url));
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', validateRedirect(pathname));
    return NextResponse.redirect(loginUrl);
  }

  if (validAccessPayload) {
    const gateRedirect = await resolveGateRedirects(validAccessPayload, request, pathname);
    if (gateRedirect) return gateRedirect;
  }

  if (!validAccessPayload && refreshToken) {
    return handleRefreshRotation(request, pathname, refreshToken);
  }

  return withSecurityHeaders(request, { cachePrivateNoStore: true });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Emergency Kill Switches (Admin override)
  // Only check if it's a potentially restricted path to avoid unnecessary DB/cache hits
  const killSwitchResponse = await resolveKillSwitchResponse(pathname, request);
  if (killSwitchResponse) return killSwitchResponse;

  // 2. Hard-disabled route check
  if (!STATIC_ASSET_PATTERNS.some(pattern => pattern.test(pathname))) {
    const disabled = await isHardDisabledPath(pathname);
    if (disabled) {
      return new NextResponse('This feature is currently disabled.', { status: 403 });
    }
  }

  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const mfaChallengeToken = request.cookies.get(MFA_CHALLENGE_COOKIE)?.value;

  // Server actions (identified by Next-Action header) must never be redirected.
  // They run after the proxy and call getCurrentUser() internally, which handles
  // token refresh. Redirecting a server action POST causes the
  // "unexpected response from server" error on the client.
  const isServerAction = request.headers.get('Next-Action') !== null;
  if (isServerAction) {
    return NextResponse.next();
  }

  const isStaticAssetRequest = STATIC_ASSET_PATTERNS.some(pattern => pattern.test(pathname));
  const isApiRoute = pathname.startsWith('/api/');

  if (!isStaticAssetRequest && !isApiRoute && !PAGE_ALLOWED_METHODS.has(request.method)) {
    return new NextResponse('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'GET, HEAD, POST' },
    });
  }

  if (isApiRoute) {
    return withSecurityHeaders(request, { cachePrivateNoStore: !!accessToken });
  }

  if (isPublicPath(pathname)) {
    return resolvePublicPathResponse(request, pathname, accessToken, refreshToken);
  }

  if (pathname.startsWith('/admin')) {
    return resolveAdminResponse(accessToken, request, pathname);
  }

  return resolveSessionResponse(request, pathname, accessToken, refreshToken, mfaChallengeToken);
}

export const config = {
  matcher: [
    {
      // Must stay a plain string literal: Next statically analyses this middleware `config`
      // export at build time and cannot evaluate a `String.raw` tagged template, which aborts
      // the build ("Invalid segment configuration export detected"). NOSONAR keeps the S7780
      // "prefer String.raw" codemod from re-introducing the build break.
      source: '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|tools(?:/.*)?|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot|css|js)$).*)', // NOSONAR — see comment above
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
