'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { RadioPlayer } from '@/components/features/bottom-bar/RadioPlayer';
import { NewsTicker } from '@/components/features/bottom-bar/NewsTicker';
import { QuoteDisplay } from '@/components/features/bottom-bar/QuoteDisplay';
import { BottomBarSettingsPopover } from '@/components/features/bottom-bar/BottomBarSettingsPopover';
import type { BottomBarSettings } from '@/app/actions/bottom-bar-settings';
import type { BottomBannerData } from '@/app/actions/bottom-bar-data';
import { Z_CLASS } from '@/lib/z-index';

const FULLSCREEN_PATHS = ['/draw', '/planet', '/canvas', '/energy', '/map', '/graph'];

export function BottomBanner() {
  const pathname = usePathname();
  const [data, setData] = useState<BottomBannerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<BottomBarSettings | null>(null);

  const isFullscreen = FULLSCREEN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const fetchData = async () => {
      try {
        const { getBottomBannerDataAction } = await import('@/app/actions/bottom-bar-data');
        const result = await getBottomBannerDataAction();
        if (!mounted) return;

        if (result.success && result.data) {
          setData(result.data);
          setSettings(result.data.settings);
        } else {
          setData(null);
        }
      } catch {
        if (mounted) setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, [pathname]);

  const handleSettingsChange = useCallback(async (update: Partial<BottomBarSettings>) => {
    if (!settings) return;
    const merged = {
      visibleModules: { ...settings.visibleModules, ...update.visibleModules },
      selectedRssSourceIds: update.selectedRssSourceIds ?? settings.selectedRssSourceIds,
      radioVolume: update.radioVolume ?? settings.radioVolume,
      lastStationId: update.lastStationId === undefined ? settings.lastStationId : update.lastStationId,
    };
    setSettings(merged);

    try {
      const { updateBottomBarSettingsAction } = await import('@/app/actions/bottom-bar-settings');
      await updateBottomBarSettingsAction(merged);
    } catch {
      // silently fail — optimistic update already applied
    }
  }, [settings]);

  if (isFullscreen) return null;
  if (loading) {
    return (
      <div className={`fixed bottom-0 left-0 right-0 ${Z_CLASS.bottomBanner} h-12 sm:h-14 bg-gray-100 dark:bg-gray-800 animate-pulse border-t border-gray-200 dark:border-gray-700`} />
    );
  }

  if (!data?.featureEnabled) return null;

  const hasAnyModule = settings && (
    settings.visibleModules.radio ||
    settings.visibleModules.news ||
    settings.visibleModules.quotes
  );

  if (!hasAnyModule) {
    return (
      <div className={`fixed bottom-0 left-0 right-0 ${Z_CLASS.bottomBanner} h-12 sm:h-14 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end px-3`}>
        <BottomBarSettingsPopover settings={settings!} onSettingsChange={handleSettingsChange} />
      </div>
    );
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 ${Z_CLASS.bottomBanner} h-12 sm:h-14 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg`}>
      <div className="mx-auto max-w-7xl h-full px-2 sm:px-3 flex items-center gap-1 sm:gap-2">
        <RadioPlayer
          stations={data.radioStations}
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />

        <div className="hidden sm:flex flex-1 min-w-0 items-center gap-1">
          <NewsTicker settings={settings} />
          <QuoteDisplay quote={data.dailyQuote} settings={settings} />
        </div>

        <BottomBarSettingsPopover settings={settings} onSettingsChange={handleSettingsChange} />
      </div>
    </div>
  );
}
