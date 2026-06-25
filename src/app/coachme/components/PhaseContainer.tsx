'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PencilIcon, RotateCcwIcon } from 'lucide-react';
import { PauseButton } from './PauseForSupport';
import type { CoachMeSession } from '@/lib/prisma-shared';

interface PhaseContainerProps {
  session: CoachMeSession;
  children: React.ReactNode;
  onPause: () => void;
  onStartOver: () => void;
  onEditStart?: () => void;
  isStartingOver?: boolean;
}

export function PhaseContainer({
  session,
  children,
  onPause,
  onStartOver,
  onEditStart,
  isStartingOver = false,
}: Readonly<PhaseContainerProps>) {
  const { t } = useTranslation('coachme');
  const [lastSaved, setLastSaved] = useState<Date>(() => new Date(session.updatedAt));

  useEffect(() => {
    setLastSaved(new Date(session.updatedAt));
  }, [session.updatedAt]);

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return t('autoSave.saved');
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {session.sessionGoal && (
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 shadow-sm">
          <div className="max-w-2xl mx-auto flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('session.goalLabel')}</div>
              <div className="text-gray-900 dark:text-white font-medium break-words">{session.sessionGoal}</div>
            </div>
            <div className="shrink-0 flex flex-wrap justify-end gap-2">
              {onEditStart && session.currentPhase !== 1 && (
                <button
                  type="button"
                  onClick={onEditStart}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                >
                  <PencilIcon className="h-4 w-4" aria-hidden="true" />
                  {t('sessionStart.editButton')}
                </button>
              )}
              <button
                type="button"
                onClick={onStartOver}
                disabled={isStartingOver}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40"
              >
                <RotateCcwIcon className="h-4 w-4" aria-hidden="true" />
                {t('restart.button')}
              </button>
            </div>
          </div>
        </header>
      )}

      <div className="max-w-2xl mx-auto p-6">
        {children}
      </div>

      <PauseButton onClick={onPause} />

      <div className="fixed bottom-4 right-4 z-30 text-xs text-gray-400 dark:text-gray-500">
        <span className="bg-white dark:bg-gray-900 px-2 py-1 rounded shadow-sm">
          {t('autoSave.saved')} · {formatLastSaved(lastSaved)}
        </span>
      </div>
    </div>
  );
}

interface NavigationPanelProps {
  onNavigate: (action: string) => void;
  onEnd: () => void;
}

export function NavigationPanel({ onNavigate, onEnd }: Readonly<NavigationPanelProps>) {
  const { t } = useTranslation('coachme');

  return (
    <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        {t('navigation.continue')}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onNavigate('next')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
        >
          {t('navigation.continue')}
        </button>
        <button
          onClick={() => onNavigate('miracle')}
          className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          {t('navigation.backMiracle')}
        </button>
        <button
          onClick={() => onNavigate('review')}
          className="px-4 py-2 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
        >
          {t('navigation.reviewAnswers')}
        </button>
        <button
          onClick={onEnd}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
        >
          {t('navigation.endEarly')}
        </button>
      </div>
    </div>
  );
}
