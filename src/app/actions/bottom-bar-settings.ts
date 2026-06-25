'use server';

import { logActionError } from '@/lib/action-logger';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { revalidatePath } from 'next/cache';

export interface BottomBarSettings {
  visibleModules: {
    radio: boolean;
    news: boolean;
    quotes: boolean;
  };
  selectedRssSourceIds: string[];
  radioVolume: number;
  lastStationId: string | null;
}

export async function getBottomBarSettingsAction(): Promise<{
  success: boolean;
  data?: BottomBarSettings;
  error?: string;
}> {
  try {
    const userResult = await getCurrentUser();
    if (!userResult.success || !userResult.data?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: userResult.data.id },
      select: { bottomBarSettings: true },
    });

    const raw = userRecord?.bottomBarSettings as Record<string, unknown> | null;

    const settings: BottomBarSettings = raw
      ? {
          visibleModules: {
            radio: (raw.visibleModules as { radio?: boolean })?.radio ?? true,
            news: (raw.visibleModules as { news?: boolean })?.news ?? true,
            quotes: (raw.visibleModules as { quotes?: boolean })?.quotes ?? true,
          },
          selectedRssSourceIds: Array.isArray(raw.selectedRssSourceIds)
            ? (raw.selectedRssSourceIds as string[])
            : [],
          radioVolume: typeof raw.radioVolume === 'number' ? raw.radioVolume : 0.8,
          lastStationId: typeof raw.lastStationId === 'string' ? raw.lastStationId : null,
        }
      : {
          visibleModules: { radio: true, news: true, quotes: true },
          selectedRssSourceIds: [],
          radioVolume: 0.8,
          lastStationId: null,
        };

    return { success: true, data: settings };
  } catch (error) {
    logActionError('[bottom-bar-settings] Fetch failed', error);
    return { success: false, error: 'Failed to load settings' };
  }
}

export async function updateBottomBarSettingsAction(
  settings: Partial<BottomBarSettings>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const userResult = await getCurrentUser();
    if (!userResult.success || !userResult.data?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const currentRecord = await prisma.user.findUnique({
      where: { id: userResult.data.id },
      select: { bottomBarSettings: true },
    });

    const current = (currentRecord?.bottomBarSettings as Record<string, unknown>) ?? {};

    const merged = {
      ...current,
      ...settings,
    };

    await prisma.user.update({
      where: { id: userResult.data.id },
      data: { bottomBarSettings: merged },
    });

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    logActionError('[bottom-bar-settings] Update failed', error);
    return { success: false, error: 'Failed to save settings' };
  }
}
