'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { completeSession, deleteSession, exportSessionJSON, updateSessionPhase } from '@/app/actions/coachme';
import type { CoachMeSession } from '@/lib/prisma-shared';

interface Phase8SynthesisProps {
  session: CoachMeSession;
  onBack: () => void;
}

export function Phase8Synthesis({ session, onBack }: Readonly<Phase8SynthesisProps>) {
  const { t } = useTranslation('coachme');
  const router = useRouter();

  const [sessionUsefulness, setSessionUsefulness] = useState<number>(session.sessionUsefulness ?? 5);
  const [finalReflections, setFinalReflections] = useState(session.finalReflections || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = useCallback(async () => {
    setError(null);
    setIsSubmitting(true);

    await updateSessionPhase(session.id, { sessionUsefulness, finalReflections: finalReflections || null });
    await completeSession(session.id);

    router.push('/coachme/progress');
  }, [session.id, sessionUsefulness, finalReflections, router]);

  const handleDiscard = useCallback(async () => {
    setIsDiscarding(true);
    await deleteSession(session.id);
    router.push('/coachme');
  }, [session.id, router]);

  const handleExport = useCallback(async () => {
    const result = await exportSessionJSON(session.id);
    if (result.success && result.data) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SolutionPath_${session.customFocusTag || session.focusTag}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [session.id, session.customFocusTag, session.focusTag]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        {t('phases.synthesis.title')}
      </h1>

      {/* Session Goal */}
      <section className="space-y-2">
        <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">
          {t('phases.synthesis.topicHeading')}
        </h2>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white">
          {session.customFocusTag || session.focusTag}
        </div>
      </section>

      {session.whyImportant && (
        <section className="space-y-2">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {t('phases.synthesis.whyImportantHeading')}
          </h2>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white">
            {session.whyImportant}
          </div>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">
          {t('phases.synthesis.goalHeading')}
        </h2>
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white">
          {session.sessionGoal}
        </div>
      </section>

      {session.sessionSuccessCriteria && (
        <section className="space-y-2">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {t('phases.synthesis.successCriteriaHeading')}
          </h2>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-gray-900 dark:text-white">
            {session.sessionSuccessCriteria}
          </div>
        </section>
      )}

      {/* Success Criteria */}
      {(session.miracleSignsA || session.miracleSignsB || session.miracleSignsC) && (
        <section className="space-y-2">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {t('phases.synthesis.miracleHeading')}
          </h2>
          {session.miracleSignsA && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('phases.synthesis.firstSign')}</div>
              <div className="text-gray-900 dark:text-white">{session.miracleSignsA}</div>
            </div>
          )}
          {session.miracleSignsB && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('phases.synthesis.nextSign')}</div>
              <div className="text-gray-900 dark:text-white">{session.miracleSignsB}</div>
            </div>
          )}
          {session.miracleSignsC && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('phases.synthesis.othersNotice')}</div>
              <div className="text-gray-900 dark:text-white">{session.miracleSignsC}</div>
            </div>
          )}
        </section>
      )}

      {/* Scaling */}
      {(session.scalingCurrent || session.scalingResources || session.scalingRecentMoments || session.scalingNextStep) && (
        <section className="space-y-2">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {t('phases.synthesis.scalingHeading')}
          </h2>
          {session.scalingCurrent && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('phases.synthesis.currentScale')}</div>
              <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{session.scalingCurrent}/10</div>
            </div>
          )}
          {session.scalingResources && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('phases.synthesis.resources')}</div>
              <div className="text-gray-900 dark:text-white">{session.scalingResources}</div>
            </div>
          )}
          {session.scalingRecentMoments && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('phases.synthesis.recentMoments')}</div>
              <div className="text-gray-900 dark:text-white">{session.scalingRecentMoments}</div>
            </div>
          )}
          {session.scalingNextStep && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">{t('phases.synthesis.nextScaleStep')}</div>
              <div className="text-emerald-900 dark:text-emerald-100">{session.scalingNextStep}</div>
            </div>
          )}
        </section>
      )}

      {/* Next Step */}
      {(session.actionPlanV1 || session.actionPlanFinal) && (
        <section className="space-y-2">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {t('phases.synthesis.stepHeading')}
          </h2>
          {session.actionPlanFinal ? (
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('phases.synthesis.originalStep')}:</div>
                <div className="text-gray-900 dark:text-white">{session.actionPlanV1}</div>
              </div>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">{t('phases.synthesis.refinedStep')}:</div>
                <div className="text-emerald-900 dark:text-emerald-100">{session.actionPlanFinal}</div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <div className="text-emerald-900 dark:text-emerald-100">{session.actionPlanV1}</div>
            </div>
          )}
        </section>
      )}

      {/* Closing Reflection */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">
          {t('phases.synthesis.closingHeading')}
        </h2>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('phases.synthesis.usefulnessLabel')}
          </label>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">1</span>
            <input
              type="range"
              min="1"
              max="10"
              value={sessionUsefulness}
              onChange={(e) => setSessionUsefulness(Number.parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-gray-500">10</span>
          </div>
          <div className="text-center text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {sessionUsefulness}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
            {t('phases.synthesis.finalLabel')}
          </label>
          <textarea
            value={finalReflections}
            onChange={(e) => setFinalReflections(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            rows={3}
          />
        </div>
      </section>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('phases.synthesis.actionMenuTitle')}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleComplete}
            disabled={isSubmitting || isDiscarding}
            className="px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {t('phases.synthesis.saveEnd')}
          </button>
          <button
            onClick={handleExport}
            disabled={isSubmitting || isDiscarding}
            className="px-4 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            {t('phases.synthesis.exportJson')}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onBack}
            disabled={isSubmitting || isDiscarding}
            className="px-4 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors text-sm"
          >
            {t('phases.synthesis.goBack')}
          </button>
          <button
            onClick={handleDiscard}
            disabled={isSubmitting || isDiscarding}
            className="px-4 py-3 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors text-sm"
          >
            {t('phases.synthesis.discardSession')}
          </button>
        </div>
      </div>
    </div>
  );
}
