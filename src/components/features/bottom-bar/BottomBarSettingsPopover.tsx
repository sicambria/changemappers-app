'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings2Icon, XIcon } from 'lucide-react';
import type { BottomBarSettings } from '@/app/actions/bottom-bar-settings';

interface BottomBarSettingsPopoverProps {
  settings: BottomBarSettings;
  onSettingsChange: (update: Partial<BottomBarSettings>) => void;
}

interface RssSourceOption {
  id: string;
  name: string;
}

export function BottomBarSettingsPopover({ settings, onSettingsChange }: Readonly<BottomBarSettingsPopoverProps>) {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [rssSources, setRssSources] = useState<RssSourceOption[]>([]);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchSources = async () => {
      try {
        const { getAllRssSourcesAction } = await import('@/app/actions/bottom-bar-news');
        const result = await getAllRssSourcesAction();
        if (result.success && result.data) {
          setRssSources(result.data);
        }
      } catch {
        setRssSources([]);
      }
    };
    fetchSources();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleModule = useCallback((module: 'radio' | 'news' | 'quotes') => {
    onSettingsChange({
      visibleModules: { ...settings.visibleModules, [module]: !settings.visibleModules[module] },
    });
  }, [settings.visibleModules, onSettingsChange]);

  const toggleRssSource = useCallback((sourceId: string) => {
    const current = settings.selectedRssSourceIds;
    const updated = current.includes(sourceId)
      ? current.filter((id) => id !== sourceId)
      : [...current, sourceId];
    onSettingsChange({ selectedRssSourceIds: updated });
  }, [settings.selectedRssSourceIds, onSettingsChange]);

  return (
    <div ref={popoverRef} className="relative shrink-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        aria-label={t('bottomBar.settings.title')}
      >
        <Settings2Icon className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {t('bottomBar.settings.title')}
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-0.5 text-gray-400 hover:text-gray-600"
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>

          <div className="p-3 space-y-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1.5">
                {t('bottomBar.settings.modules')}
              </p>
              <div className="space-y-1.5">
                {(['radio', 'news', 'quotes'] as const).map((mod) => (
                  <label key={mod} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.visibleModules[mod]}
                      onChange={() => toggleModule(mod)}
                      className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-400 h-3.5 w-3.5"
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {t(`bottomBar.settings.${mod}`)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {settings.visibleModules.news && rssSources.length > 0 && (
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-1.5">
                  {t('bottomBar.settings.newsSources')}
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {rssSources.map((source) => (
                    <label key={source.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.selectedRssSourceIds.includes(source.id)}
                        onChange={() => toggleRssSource(source.id)}
                        className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-400 h-3.5 w-3.5"
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                        {source.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[10px] text-gray-400">
              {t('bottomBar.settings.save')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
