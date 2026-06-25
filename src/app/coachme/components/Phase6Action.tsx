'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { NavigationPanel } from './PhaseContainer';
import type { CoachMeSession } from '@/lib/prisma-shared';

interface Phase6ActionProps {
  session: CoachMeSession;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onNext: () => void;
  onNavigate: (action: string) => void;
}

export function Phase6Action({ session, onSave, onNext, onNavigate }: Readonly<Phase6ActionProps>) {
  const { t } = useTranslation('coachme');
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }); // §1B: mirror latest t for effects/callbacks below; no deps array on purpose

  const [actionPlanV1, setActionPlanV1] = useState(session.actionPlanV1 || '');
  const [actionPlanFinal, setActionPlanFinal] = useState(session.actionPlanFinal || '');
  const [actionOptional, setActionOptional] = useState(session.actionOptional || '');
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (actionPlanV1.length < 3) {
      setError(tRef.current('errors.minLength'));
      return;
    }

    setError(null);

    await onSave({
      actionPlanV1,
      actionPlanFinal: actionPlanFinal.length >= 3 ? actionPlanFinal : null,
      actionOptional: actionOptional || null,
      currentPhase: 8,
    });

    onNext();
  }, [actionPlanV1, actionPlanFinal, actionOptional, onSave, onNext]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        {t('phases.action.title')}
      </h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('phases.action.questionLabel')}
        </label>
        <textarea
          value={actionPlanV1}
          onChange={(e) => setActionPlanV1(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
          {t('phases.action.refineLabel')}
        </label>
        <textarea
          value={actionPlanFinal}
          onChange={(e) => setActionPlanFinal(e.target.value)}
          placeholder={t('phases.action.refinePlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
          {t('phases.action.optionalLabel')}
        </label>
        <textarea
          value={actionOptional}
          onChange={(e) => setActionOptional(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={2}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
      >
        {t('phases.focus.continueButton')}
      </button>

      <NavigationPanel onNavigate={onNavigate} onEnd={() => onNavigate('end')} />
    </div>
  );
}
