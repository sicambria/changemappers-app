'use client';

import { QuoteIcon } from 'lucide-react';
import type { BottomBarSettings } from '@/app/actions/bottom-bar-settings';

interface QuoteData {
  id: string;
  text: string;
  author: string;
  source: string | null;
}

interface QuoteDisplayProps {
  quote: QuoteData | null;
  settings: BottomBarSettings;
}

export function QuoteDisplay({ quote, settings }: Readonly<QuoteDisplayProps>) {

  if (!settings.visibleModules.quotes) return null;
  if (!quote) return null;

  return (
    <div className="hidden sm:flex items-center gap-1.5 px-2 text-xs text-gray-500 dark:text-gray-400 shrink-0 max-w-[260px]">
      <QuoteIcon className="h-3 w-3 shrink-0 text-amber-400" />
      <span className="truncate">
        &ldquo;{quote.text}&rdquo;
      </span>
      <span className="shrink-0 text-gray-400 dark:text-gray-500">
        — {quote.author}
      </span>
    </div>
  );
}
