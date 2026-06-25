'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { createSession } from '@/app/actions/coachme';

export default function NewSessionClient() {
  const { t } = useTranslation('coachme');
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }); // §1B: mirror latest t for effects/callbacks below; no deps array on purpose
  const router = useRouter();

  const [topic, setTopic] = useState('');
  const [whyImportant, setWhyImportant] = useState('');
  const [sessionGoal, setSessionGoal] = useState('');
  const [sessionSuccessCriteria, setSessionSuccessCriteria] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (topic.length < 3 || whyImportant.length < 3 || sessionGoal.length < 3 || sessionSuccessCriteria.length < 3) {
      setError(tRef.current('errors.minLength'));
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const result = await createSession({
      focusTag: 'OTHER',
      customFocusTag: topic,
      whyImportant,
      sessionGoal,
      sessionSuccessCriteria,
    });

    if (result.success && result.data) {
      router.push(`/coachme/session/${result.data.id}`);
    } else {
      setError('error' in result && result.error ? result.error : tRef.current('errors.startFailed'));
      setIsSubmitting(false);
    }
  }, [topic, whyImportant, sessionGoal, sessionSuccessCriteria, router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 space-y-6">
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
    </div>
  );
}

