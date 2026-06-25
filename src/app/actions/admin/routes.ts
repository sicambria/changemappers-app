'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/app/actions/auth';
import { allMenuItems } from '@/lib/menuConfig';
import { getAllRoutes } from '@/lib/route-loader';

export type RouteConfigData = {
    id: string;
    routeId: string;
    path: string;
    label: string;
    hardDisabled: boolean;
    softDisabled: boolean;
    userCanOverride: boolean;
    levelVisibility: Record<string, boolean>;
    updatedAt: Date;
    updatedBy: string | null;
};

export async function getRouteConfigsAction(): Promise<{
    success: boolean;
    data?: RouteConfigData[];
    error?: string;
}> {
    const userResult = await getCurrentUser();
    if (!userResult.data?.user?.isAdmin) {
        return { success: false, error: 'Unauthorized' };
    }

    // 1. Load all routes from master registry
    const masterRoutes = getAllRoutes();

    // 2. Fetch existing configs from DB
    const existing = await prisma.routeConfig.findMany({
        orderBy: { routeId: 'asc' },
        take: 500,
        select: {
            id: true,
            routeId: true,
            path: true,
            label: true,
            hardDisabled: true,
            softDisabled: true,
            userCanOverride: true,
            levelVisibility: true,
            updatedAt: true,
            updatedBy: true,
        },
    });

    const existingMap = new Map(existing.map(r => [r.routeId, r]));

    // 3. Merge: Master Routes + Menu Config Metadata + DB Settings
    const data: RouteConfigData[] = masterRoutes.map(route => {
        // Find if this route is also in the menu config to get a localized label
        const menuItem = allMenuItems.find(m => m.path === route.path || m.path.split('?')[0] === route.path);
        const db = existingMap.get(menuItem?.id || route.path); // Use path as ID if not in menu

        return {
            id: db?.id ?? '',
            routeId: menuItem?.id || route.path,
            path: route.path,
            label: menuItem?.translationKey || `routes.unlabeled.${route.module.toLowerCase()}`,
            hardDisabled: db?.hardDisabled ?? false,
            softDisabled: db?.softDisabled ?? false,
            userCanOverride: db?.userCanOverride ?? false,
            levelVisibility: (db?.levelVisibility as Record<string, boolean>) ?? {},
            updatedAt: db?.updatedAt ?? new Date(0),
            updatedBy: db?.updatedBy ?? null,
        };
    });

    return { success: true, data };
}

export async function upsertRouteConfigAction(
    routeId: string,
    settings: {
        hardDisabled?: boolean;
        softDisabled?: boolean;
        userCanOverride?: boolean;
        levelVisibility?: Record<string, boolean>;
    }
): Promise<{ success: boolean; error?: string }> {
    const userResult = await getCurrentUser();
    const user = userResult.data?.user;
    if (!user?.isAdmin) {
        return { success: false, error: 'Unauthorized' };
    }

    const menuItem = allMenuItems.find(m => m.id === routeId);
    // Note: routeId might be a path if not in menuConfig
    const path = menuItem?.path || routeId;
    const label = menuItem?.translationKey || `routes.unlabeled`;

    await prisma.routeConfig.upsert({
        where: { routeId },
        create: {
            routeId,
            path,
            label,
            hardDisabled: settings.hardDisabled ?? false,
            softDisabled: settings.softDisabled ?? false,
            userCanOverride: settings.userCanOverride ?? false,
            levelVisibility: settings.levelVisibility ?? {},
            updatedBy: user.id,
        },
        update: {
            ...(settings.hardDisabled !== undefined && { hardDisabled: settings.hardDisabled }),
            ...(settings.softDisabled !== undefined && { softDisabled: settings.softDisabled }),
            ...(settings.userCanOverride !== undefined && { userCanOverride: settings.userCanOverride }),
            ...(settings.levelVisibility !== undefined && { levelVisibility: settings.levelVisibility }),
            path,
            label,
            updatedBy: user.id,
        },
    });

    return { success: true };
}

export async function getAllRouteConfigsForClient(): Promise<{
    hardDisabled: string[];
    softDisabled: string[];
    userCanOverride: string[];
    levelVisibility: Record<string, Record<string, boolean>>;
}> {
    // AUDIT-20260613-004: route-gating configuration is for signed-in users
    // (profile "advanced" tab); anonymous callers get an empty config instead
    // of the full gating map.
    const userResult = await getCurrentUser();
    if (!userResult.success || !userResult.data?.user) {
        return { hardDisabled: [], softDisabled: [], userCanOverride: [], levelVisibility: {} };
    }

  const configs = await prisma.routeConfig.findMany({
  select: {
  routeId: true,
  hardDisabled: true,
  softDisabled: true,
  userCanOverride: true,
  levelVisibility: true,
  },
  take: 500,
  });

    return {
        hardDisabled: configs.filter(c => c.hardDisabled).map(c => c.routeId),
        softDisabled: configs.filter(c => c.softDisabled).map(c => c.routeId),
        userCanOverride: configs.filter(c => c.userCanOverride).map(c => c.routeId),
        levelVisibility: Object.fromEntries(
            configs.map(c => [c.routeId, (c.levelVisibility as Record<string, boolean>) ?? {}])
        ),
    };
}

export async function getPerfRoutesAction(): Promise<{
    success: boolean;
    data?: { path: string; labelKey: string; module: string }[];
    error?: string;
}> {
    const userResult = await getCurrentUser();
    if (!userResult.data?.user?.isAdmin) {
        return { success: false, error: 'Unauthorized' };
    }

    const routes = getAllRoutes().map(r => {
        const menuItem = allMenuItems.find(m => m.path === r.path || m.path.split('?')[0] === r.path);
        return {
            path: r.path,
            labelKey: menuItem?.translationKey || `routes.unlabeled.${r.module.toLowerCase()}`,
            module: r.module,
        };
    });

    return { success: true, data: routes };
}
