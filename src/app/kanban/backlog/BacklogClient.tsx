'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface BacklogItem {
  id: string;
  title: string;
  description: string | null;
  communityResonance: number;
  createdBy: { name: string | null };
}

interface BacklogClientProps {
  items: BacklogItem[];
}

export default function BacklogClient({ items }: Readonly<BacklogClientProps>) {
  const { t } = useTranslation('kanban');

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Link href="/kanban" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
            ← {t('board')}
          </Link>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('backlog')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {t('backlogSubtitle', { resonance: t('resonance') })}
            </p>
          </div>
          <Link
            href="/kanban/initiative/new"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            {t('startInitiative')}
          </Link>
        </div>

        {items.length === 0 && (
          <p className="text-gray-400 dark:text-gray-500 text-center py-16">
            {t('backlogEmpty')}
          </p>
        )}

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-start gap-4 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-4 bg-white dark:bg-gray-900"
            >
              <div className="shrink-0 w-8 text-center">
                <span className="text-sm font-bold text-gray-400 dark:text-gray-500">
                  #{index + 1}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                  {item.title}
                </h2>
                {item.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t('backlogByPrefix')} {item.createdBy.name}
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-center gap-0.5">
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {item.communityResonance}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{t('resonance')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
