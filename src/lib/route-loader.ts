import fs from 'node:fs';
import path from 'node:path';
import { logger } from '@/lib/logger';

export interface RouteDefinition {
  path: string;
  module: string;
}

let cachedRoutes: RouteDefinition[] | null = null;

/**
 * Loads and parses the master routes.json file from the project root.
 * Uses a simple in-memory cache to avoid repeated disk I/O.
 */
export function getAllRoutes(): RouteDefinition[] {
  if (cachedRoutes) {
    return cachedRoutes;
  }

  try {
    const filePath = path.join(process.cwd(), 'routes.json');
    const content = fs.readFileSync(filePath, 'utf-8');
    cachedRoutes = JSON.parse(content) as RouteDefinition[];
    return cachedRoutes;
  } catch (error) {
    logger.error({ msg: 'route-loader failed to load routes.json', err: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

/**
 * Returns a clean list of path strings from the registry.
 */
export function getAllRoutePaths(): string[] {
  return getAllRoutes().map(r => r.path);
}

/**
 * Finds a route definition by its path.
 * Handles dynamic segments by checking for exact matches first.
 */
export function getRouteByPath(pathname: string): RouteDefinition | undefined {
  const routes = getAllRoutes();
  const cleanPath = pathname.split('?')[0];

  // 1. Exact match
  const exact = routes.find(r => r.path === cleanPath);
  if (exact) return exact;

  // 2. Pattern match (simple prefix or dynamic segment check)
  // We prioritize longer matches to avoid false positives on root prefixes
  return routes
    .filter(r => r.path.includes('[') || r.path.includes(':'))
    .sort((a, b) => b.path.length - a.path.length)
    .find(r => {
      const pattern = r.path.replaceAll(/\[.*?\]/g, '[^/]+').replaceAll('/', String.raw`\/`);
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(cleanPath);
    });
}

/**
 * Returns the module name for a given path.
 * Defaults to 'OTHER' if not found.
 */
export function getModuleForPath(pathname: string): string {
  const route = getRouteByPath(pathname);
  return route?.module || 'OTHER';
}
