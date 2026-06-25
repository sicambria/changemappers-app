'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { CoachMeSession } from '@/lib/prisma-shared';

interface Phase1FocusProps {
  session?: CoachMeSession;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onNext: () => void;
  nextPhase?: number;
}

export function Phase1Focus({ session, onSave, onNext, nextPhase = 2 }: Readonly<Phase1FocusProps>) {
  const { t } = useTranslation('coachme');
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }); // §1B: mirror latest t for effects/callbacks below; no deps array on purpose

  const [topic, setTopic] = useState(() => session?.customFocusTag ?? '');
  const [whyImportant, setWhyImportant] = useState(() => session?.whyImportant ?? '');
  const [sessionGoal, setSessionGoal] = useState(() => session?.sessionGoal ?? '');
  const [sessionSuccessCriteria, setSessionSuccessCriteria] = useState(() => session?.sessionSuccessCriteria ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTopic(session?.customFocusTag ?? '');
    setWhyImportant(session?.whyImportant ?? '');
    setSessionGoal(session?.sessionGoal ?? '');
    setSessionSuccessCriteria(session?.sessionSuccessCriteria ?? '');
  }, [
    session?.customFocusTag,
    session?.sessionGoal,
    session?.sessionSuccessCriteria,
    session?.whyImportant,
  ]);

  const handleSubmit = useCallback(async () => {
    if (topic.length < 3 || whyImportant.length < 3 || sessionGoal.length < 3 || sessionSuccessCriteria.length < 3) {
      setError(tRef.current('errors.minLength'));
      return;
    }

    setError(null);
    setIsSubmitting(true);

    await onSave({
      focusTag: 'OTHER',
      customFocusTag: topic,
      whyImportant,
      sessionGoal,
      sessionSuccessCriteria,
      currentPhase: nextPhase,
    });

    onNext();
    setIsSubmitting(false);
  }, [topic, whyImportant, sessionGoal, sessionSuccessCriteria, nextPhase, onSave, onNext]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        {t('phases.focus.title')}
      </h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('phases.focus.topicLabel')}
        </label>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder={t('phases.focus.topicPlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('phases.focus.whyImportantLabel')}
        </label>
        <textarea
          value={whyImportant}
          onChange={(e) => setWhyImportant(e.target.value)}
          placeholder={t('phases.focus.whyImportantPlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('phases.focus.sessionGoalLabel')}
        </label>
        <textarea
          value={sessionGoal}
          onChange={(e) => setSessionGoal(e.target.value)}
          placeholder={t('phases.focus.sessionGoalPlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('phases.focus.successCriteriaLabel')}
        </label>
        <textarea
          value={sessionSuccessCriteria}
          onChange={(e) => setSessionSuccessCriteria(e.target.value)}
          placeholder={t('phases.focus.successCriteriaPlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={3}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
      >
        {isSubmitting ? '...' : t('phases.focus.continueButton')}
      </button>
    </div>
  );
}
