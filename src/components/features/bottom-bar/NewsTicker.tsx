'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLinkIcon, PauseIcon, PlayIcon } from 'lucide-react';
import type { BottomBarSettings } from '@/app/actions/bottom-bar-settings';

interface NewsItem {
  id: string;
  title: string;
  url: string | null;
  sourceName: string | null;
}

interface NewsTickerProps {
  settings: BottomBarSettings;
}

export function NewsTicker({ settings }: Readonly<NewsTickerProps>) {
  const { t } = useTranslation('common');
  const [items, setItems] = useState<NewsItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { getNewsTickerItemsAction } = await import('@/app/actions/bottom-bar-news');
        const result = await getNewsTickerItemsAction(settings.selectedRssSourceIds);
        if (result.success && result.data) {
          setItems(result.data);
        }
      } catch {
        setItems([]);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 300000);
    return () => clearInterval(interval);
  }, [settings.selectedRssSourceIds]);

  if (!settings.visibleModules.news) return null;

  if (items.length === 0) {
    return (
      <div className="text-xs text-gray-400 dark:text-gray-500 truncate px-2">
        {t('bottomBar.news.noSources')}
      </div>
    );
  }

  return (
    <div // NOSONAR(S6848) — supplementary hover affordance; the content/action is independently keyboard-reachable via an explicit control or focusable child
      ref={containerRef}
      className="flex-1 min-w-0 overflow-hidden px-2 flex items-center gap-1"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* WCAG 2.2.2 (Pause, Stop, Hide): an explicit, keyboard- and touch-reachable
          control to pause the auto-scrolling marquee — hover-only pausing left
          keyboard/touch users with no mechanism (2026-06-18 audit G6). */}
      <button
        type="button"
        onClick={() => setIsPaused((p) => !p)}
        aria-pressed={isPaused}
        aria-label={isPaused ? t('bottomBar.news.resume') : t('bottomBar.news.pause')}
        className="shrink-0 p-1 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400"
      >
        {isPaused ? <PlayIcon className="h-3 w-3" /> : <PauseIcon className="h-3 w-3" />}
      </button>
      <div
        className={`flex-1 min-w-0 overflow-hidden`}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
      >
      <div className={`whitespace-nowrap inline-block ${isPaused ? '' : 'animate-marquee'}`}>
        {items.map((item) => (
          <a
            key={item.id}
            href={item.url ?? '#'}
            target={item.url ? '_blank' : undefined}
            rel={item.url ? 'noopener noreferrer' : undefined}
            onClick={(e) => { if (!item.url) e.preventDefault(); }}
            className="inline-flex items-center gap-1 mx-2 text-xs text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <span className="font-medium">{item.sourceName ?? t('bottomBar.news.rss')}:</span>
            <span>{item.title}</span>
            {item.url && <ExternalLinkIcon className="h-2.5 w-2.5 shrink-0" />}
          </a>
        ))}
      </div>
      </div>
    </div>
  );
}
