'use server';

import { logActionError } from '@/lib/action-logger';
import { prisma } from '@/lib/prisma';
import { getAllExperimentalFeatures, isFeatureEnabledForUser } from '@/lib/experimental-features';
import { getCurrentUser } from '@/lib/get-current-user';

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

export interface BottomBannerRadioStation {
  id: string;
  name: string;
  url: string;
  genre: string | null;
  language: string | null;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

export interface BottomBannerQuote {
  id: string;
  text: string;
  author: string;
  source: string | null;
  isActive: boolean;
}

export interface BottomBannerData {
  featureEnabled: boolean;
  radioStations: BottomBannerRadioStation[];
  dailyQuote: BottomBannerQuote | null;
  settings: BottomBarSettings;
}

const DEFAULT_SETTINGS: BottomBarSettings = {
  visibleModules: { radio: true, news: true, quotes: true },
  selectedRssSourceIds: [],
  radioVolume: 0.8,
  lastStationId: null,
};

export async function getBottomBannerDataAction(): Promise<{
  success: boolean;
  data?: BottomBannerData;
  error?: string;
}> {
  try {
    const userResult = await getCurrentUser();

    const allFeatures = await getAllExperimentalFeatures();
    const bannerFeature = allFeatures.find((f) => f.slug === 'bottom-banner');

    let userOverrides: Record<string, boolean> | null | undefined = undefined;
    if (userResult.success && userResult.data?.id) {
      const userRecord = await prisma.user.findUnique({
        where: { id: userResult.data.id },
        select: { experimentalFeatureOverrides: true },
      });
      userOverrides = userRecord?.experimentalFeatureOverrides as Record<string, boolean> | null | undefined;
    }

    const featureEnabled = isFeatureEnabledForUser(bannerFeature, userOverrides);

    if (!featureEnabled) {
      return { success: true, data: { featureEnabled: false, radioStations: [], dailyQuote: null, settings: DEFAULT_SETTINGS } };
    }

    const [radioStations, allQuotes, userRecord] = await Promise.all([
      prisma.radioStation.findMany({
        where: { isActive: true },
        orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
        select: { id: true, name: true, url: true, genre: true, language: true, isActive: true, isDefault: true, sortOrder: true },
      }),
      prisma.quote.findMany({
        where: { isActive: true },
        select: { id: true, text: true, author: true, source: true, isActive: true },
      }),
      userResult.success && userResult.data?.id
        ? prisma.user.findUnique({
            where: { id: userResult.data.id },
            select: { bottomBarSettings: true },
          })
        : Promise.resolve(null),
    ]);

    const dailyQuote = allQuotes.length > 0
      ? allQuotes[new Date().getDate() % allQuotes.length]
      : null;

    const rawSettings = userRecord?.bottomBarSettings as Record<string, unknown> | null;
    const settings: BottomBarSettings = rawSettings
      ? {
          visibleModules: {
            radio: (rawSettings.visibleModules as { radio?: boolean })?.radio ?? true,
            news: (rawSettings.visibleModules as { news?: boolean })?.news ?? true,
            quotes: (rawSettings.visibleModules as { quotes?: boolean })?.quotes ?? true,
          },
          selectedRssSourceIds: Array.isArray(rawSettings.selectedRssSourceIds)
            ? (rawSettings.selectedRssSourceIds as string[])
            : [],
          radioVolume: typeof rawSettings.radioVolume === 'number' ? rawSettings.radioVolume : 0.8,
          lastStationId: typeof rawSettings.lastStationId === 'string' ? rawSettings.lastStationId : null,
        }
      : DEFAULT_SETTINGS;

    return {
      success: true,
      data: { featureEnabled: true, radioStations, dailyQuote, settings },
    };
  } catch (error) {
    logActionError('[bottom-bar-data] Failed to fetch banner data', error);
    return { success: false, error: 'Failed to load bottom bar data' };
  }
}
