'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

type InitiativeState =
  | 'IMAGINED'
  | 'EXPLORING'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'INTEGRATING'
  | 'COMPLETED'
  | 'ARCHIVED';

interface Initiative {
  id: string;
  title: string;
  why: string | null;
  state: InitiativeState;
}

interface KanbanBoardClientProps {
  initiatives: Initiative[];
}

const COLUMNS: { state: InitiativeState; color: string }[] = [
  { state: 'IMAGINED', color: 'border-t-gray-400' },
  { state: 'EXPLORING', color: 'border-t-cyan-400' },
  { state: 'PLANNED', color: 'border-t-emerald-400' },
  { state: 'IN_PROGRESS', color: 'border-t-teal-500' },
  { state: 'INTEGRATING', color: 'border-t-amber-400' },
  { state: 'COMPLETED', color: 'border-t-green-500' },
  { state: 'ARCHIVED', color: 'border-t-slate-400' },
];

export default function KanbanBoardClient({ initiatives }: Readonly<KanbanBoardClientProps>) {
  const { t } = useTranslation('kanban');

  const grouped = COLUMNS.reduce<Record<InitiativeState, Initiative[]>>(
    (acc, col) => {
      acc[col.state] = initiatives.filter((i) => i.state === col.state);
      return acc;
    },
{
    IMAGINED: [],
    EXPLORING: [],
    PLANNED: [],
    IN_PROGRESS: [],
    INTEGRATING: [],
    COMPLETED: [],
    ARCHIVED: [],
  },
  );

  const getStatusLabel = (state: InitiativeState): string => {
    const key = state.toLowerCase().replace('_', '');
    const statusMap: Record<string, string> = {
      imagined: t('statuses.imagined'),
      exploring: t('statuses.exploring'),
      planned: t('statuses.planned'),
      inprogress: t('statuses.inProgress'),
      integrating: t('statuses.integrating'),
      completed: t('statuses.completed'),
    };
    return statusMap[key] || state;
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-12">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
          <div className="flex gap-3">
            <Link
              href="/kanban/backlog"
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {t('backlog')}
            </Link>
            <Link
              href="/kanban/initiative/new"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              {t('startInitiative')}
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto pb-4">
          <div className="flex flex-nowrap gap-4" style={{ minWidth: 'max-content' }}>
            {COLUMNS.map((col) => {
              const items = grouped[col.state];
              return (
                <div
                  key={col.state}
                  className={`w-64 shrink-0 rounded-xl border-t-4 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 ${col.color}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {getStatusLabel(col.state)}
                    </h2>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                      {items.length}
                    </span>
                  </div>

                  {items.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">
                      Nothing here
                    </p>
                  )}

                  <div className="space-y-2">
                    {items.map((initiative) => (
                      <Link
                        key={initiative.id}
                        href={`/kanban/initiative/${initiative.id}`}
                        className="block rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                          {initiative.title}
                        </p>
                        {initiative.why && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {initiative.why}
                          </p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
