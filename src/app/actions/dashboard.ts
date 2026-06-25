'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { DASHBOARD_TILE_IDS } from '@/types/dashboard';
import type { DashboardTile } from '@/types/dashboard';

// ──────────────────────────────────────────────
// Zod validation
// ──────────────────────────────────────────────

const dashboardTileSchema = z.object({
    id: z.enum(DASHBOARD_TILE_IDS),
    visible: z.boolean(),
});

const dashboardLayoutSchema = z.array(dashboardTileSchema).max(6);

// ──────────────────────────────────────────────
// Save layout — only async functions exported from 'use server'
// ──────────────────────────────────────────────

export async function saveDashboardLayoutAction(
    layout: DashboardTile[]
): Promise<{ success: boolean; error?: string }> {
    const res = await getCurrentUser();
    if (!res.success || !res.data) {
        return { success: false, error: 'Not authenticated' };
    }
    const userId = res.data.user.id;

    try {
        const validated = dashboardLayoutSchema.parse(layout);

        await prisma.user.update({
            where: { id: userId },
            data: { dashboardLayout: validated },
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0]?.message };
        }
        return { success: false, error: 'Failed to save dashboard layout' };
    }
}
