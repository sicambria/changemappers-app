/**
 * @description Background route warmup for local Next.js development.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import os from 'node:os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.join(__dirname, '..', '..');
const DEFAULT_BASE_URL = 'http://127.0.0.1:3000';
const DEFAULT_TIMEOUT_MS = 15000;
const LOW_RAM_THRESHOLD_BYTES = 16 * 1024 * 1024 * 1024;
const LOW_RAM_WARMUP_FRACTION = 0.2;
const MIN_WARMUP_ROUTES = 1;

function isRouteGroup(segment) {
    return segment.startsWith('(') && segment.endsWith(')');
}

function isPathlessSegment(segment) {
    return isRouteGroup(segment) || segment.startsWith('@');
}

function isDynamicSegment(segment) {
    return segment.includes('[') || segment.includes(']');
}

function toRoutePath(pageFile, appDir) {
    const relative = path.relative(appDir, pageFile);
    if (!relative || relative.startsWith('..')) return null;

    const routeSegments = path.dirname(relative)
        .split(path.sep)
        .filter(segment => segment && segment !== '.')
        .filter(segment => !isPathlessSegment(segment));

    if (routeSegments.some(isDynamicSegment)) return null;

    const routePath = `/${routeSegments.join('/')}`.replace(/\/+/g, '/');
    return routePath === '/' ? '/' : routePath.replace(/\/$/u, '');
}

function walkPageFiles(dir, pageFiles = []) {
    if (!fs.existsSync(dir)) return pageFiles;

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === '.next') continue;

        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkPageFiles(entryPath, pageFiles);
            continue;
        }

        if (entry.isFile() && entry.name === 'page.tsx') {
            pageFiles.push(entryPath);
        }
    }

    return pageFiles;
}

export function normalizeWarmupRoutes(routes) {
    const uniqueRoutes = Array.from(new Set(
        routes
            .filter(route => typeof route === 'string' && route.startsWith('/'))
            .map(route => route === '/' ? '/' : route.replace(/\/$/u, ''))
    ));

    return uniqueRoutes.sort((left, right) => {
        if (left === '/') return -1;
        if (right === '/') return 1;
        return left.localeCompare(right);
    });
}

export function selectWarmupRouteList(
    routes,
    {
        totalMemoryBytes = os.totalmem(),
        memoryThresholdBytes = LOW_RAM_THRESHOLD_BYTES,
        warmupFraction = LOW_RAM_WARMUP_FRACTION,
    } = {}
) {
    const normalizedRoutes = normalizeWarmupRoutes(routes);
    if (normalizedRoutes.length === 0) {
        return [];
    }

    const isLowMemoryHost = totalMemoryBytes <= memoryThresholdBytes;
    if (!isLowMemoryHost) {
        return normalizedRoutes;
    }

    const parsedFraction = Number.parseFloat(String(warmupFraction));
    const safeFraction = Number.isFinite(parsedFraction) && parsedFraction > 0 && parsedFraction <= 1
        ? parsedFraction
        : LOW_RAM_WARMUP_FRACTION;

    const targetCount = Math.max(MIN_WARMUP_ROUTES, Math.ceil(normalizedRoutes.length * safeFraction));

    return normalizedRoutes.slice(0, targetCount);
}

export function collectStaticPageRoutes({ rootDir = DEFAULT_ROOT, appDir = path.join(rootDir, 'src', 'app') } = {}) {
    const pageFiles = walkPageFiles(appDir);
    const routes = pageFiles
        .map(pageFile => toRoutePath(pageFile, appDir))
        .filter(Boolean);

    return normalizeWarmupRoutes(routes);
}

/**
 * @typedef {{ status: number }} WarmupFetchResponse
 * @typedef {{ log?: (...args: unknown[]) => unknown, warn?: (...args: unknown[]) => unknown }} WarmupLogger
 * @typedef {{
 *   rootDir?: string,
 *   appDir?: string,
 *   baseUrl?: string,
 *   routes?: string[],
 *   fetchFn?: (url: URL, init?: RequestInit) => Promise<WarmupFetchResponse>,
 *   logger?: WarmupLogger,
 *   timeoutMs?: number,
 *   totalMemoryBytes?: number,
 *   memoryThresholdBytes?: number,
 *   warmupFraction?: number,
 * }} WarmDevRoutesOptions
 */

/**
 * @param {string} route
 * @param {{ baseUrl: string, fetchFn: NonNullable<WarmDevRoutesOptions['fetchFn']>, timeoutMs: number }} options
 */
async function fetchRoute(route, { baseUrl, fetchFn, timeoutMs }) {
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeout = controller
        ? setTimeout(() => controller.abort(), timeoutMs)
        : null;

    try {
        const response = await fetchFn(new URL(route, baseUrl), {
            method: 'GET',
            redirect: 'manual',
            headers: {
                'x-dev-route-warmup': '1'
            },
            signal: controller?.signal
        });

        return {
            route,
            ok: response.status < 500,
            status: response.status
        };
    } catch (error) {
        return {
            route,
            ok: false,
            error: error instanceof Error ? error.message : String(error)
        };
    } finally {
        if (timeout) clearTimeout(timeout);
    }
}

/**
 * @param {WarmDevRoutesOptions} [options]
 */
export async function warmDevRoutes({
    rootDir = DEFAULT_ROOT,
    appDir,
    baseUrl = DEFAULT_BASE_URL,
    routes = collectStaticPageRoutes({ rootDir, appDir }),
    fetchFn = globalThis.fetch,
    logger = console,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    totalMemoryBytes,
    memoryThresholdBytes,
    warmupFraction
} = {}) {
    if (typeof fetchFn !== 'function') {
        logger.warn?.('[dev:warmup] fetch is unavailable; skipping route warmup.');
        return { total: 0, warmed: 0, failed: 0 };
    }

    const warmupRoutes = selectWarmupRouteList(routes, {
        totalMemoryBytes,
        memoryThresholdBytes,
        warmupFraction,
    });

    if (warmupRoutes.length === 0) {
        logger.log?.('[dev:warmup] no static page routes found to warm.');
        return { total: 0, warmed: 0, failed: 0 };
    }

    const results = [];
    if (warmupRoutes.includes('/')) {
        results.push(await fetchRoute('/', { baseUrl, fetchFn, timeoutMs }));
    }

    const remainingRoutes = warmupRoutes.filter(route => route !== '/');
    const remainingResults = await Promise.all(
        remainingRoutes.map(route => fetchRoute(route, { baseUrl, fetchFn, timeoutMs }))
    );

    results.push(...remainingResults);

    const failedRoutes = results.filter(result => !result.ok);
    if (failedRoutes.length > 0) {
        const sample = failedRoutes
            .slice(0, 5)
            .map(result => { const statusSuffix = result.status ? `:${result.status}` : ''; return `${result.route}${statusSuffix}`; })
            .join(', ');
        logger.warn?.(`[dev:warmup] warmed ${results.length - failedRoutes.length}/${results.length} routes; failed: ${sample}`);
    } else {
        logger.log?.(`[dev:warmup] warmed ${results.length}/${results.length} routes.`);
    }

    return {
        total: results.length,
        warmed: results.length - failedRoutes.length,
        failed: failedRoutes.length
    };
}

/**
 * @param {{ enabled?: boolean; waitForReady?: () => Promise<boolean>; logger?: { log?: (...args: unknown[]) => unknown; warn?: (...args: unknown[]) => unknown }; routes?: string[]; baseUrl?: string; fetchFn?: (url: URL) => Promise<{ status: number }>; timeoutMs?: number } | undefined} [options]
 */
export function scheduleDevRouteWarmup({
    enabled = process.env.DEV_ROUTE_WARMUP !== '0',
    waitForReady,
    logger = console,
    ...warmupOptions
} = {}) {
    if (!enabled) {
        return { scheduled: false, done: Promise.resolve(null) };
    }

    const done = (async () => {
        if (typeof waitForReady === 'function') {
            const ready = await waitForReady();
            if (!ready) {
                logger.warn?.('[dev:warmup] dev server was not ready before warmup timeout.');
                return null;
            }
        }

        return warmDevRoutes({ ...warmupOptions, logger });
    })().catch(error => {
        logger.warn?.(`[dev:warmup] background warmup failed: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    });

    return { scheduled: true, done };
}
