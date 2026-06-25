'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { NavigationPanel } from './PhaseContainer';
import type { CoachMeSession } from '@/lib/prisma-shared';

interface Phase3ScalingProps {
  session: CoachMeSession;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onNext: () => void;
  onNavigate: (action: string) => void;
}

function ScaleInput({
  label,
  value,
  onChange,
}: Readonly<{
  label: string;
  value: number;
  onChange: (value: number) => void;
}>) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">1</span>
        <input
          type="range"
          min="1"
          max="10"
          value={value}
          onChange={(e) => onChange(Number.parseInt(e.target.value, 10))}
          className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-sm text-gray-500">10</span>
      </div>
      <div className="text-center text-xl font-bold text-emerald-600 dark:text-emerald-400">
        {value}
      </div>
    </div>
  );
}

export function Phase3Scaling({ session, onSave, onNext, onNavigate }: Readonly<Phase3ScalingProps>) {
  const { t } = useTranslation('coachme');
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }); // §1B: mirror latest t for effects/callbacks below; no deps array on purpose

  const [scalingCurrent, setScalingCurrent] = useState(session.scalingCurrent ?? 3);
  const [scalingResources, setScalingResources] = useState(session.scalingResources || '');
  const [scalingRecentMoments, setScalingRecentMoments] = useState(session.scalingRecentMoments || '');
  const [scalingNextStep, setScalingNextStep] = useState(session.scalingNextStep || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextScore = Math.min(scalingCurrent + 1, 10);

  const handleSubmit = useCallback(async () => {
    if (scalingResources.length < 3 || scalingRecentMoments.length < 3 || scalingNextStep.length < 3) {
      setError(tRef.current('errors.minLength'));
      return;
    }

    setError(null);
    setIsSubmitting(true);

    await onSave({
      scalingCurrent,
      scalingResources,
      scalingRecentMoments,
      scalingNextStep,
      currentPhase: 6,
    });

    onNext();
    setIsSubmitting(false);
  }, [scalingCurrent, scalingResources, scalingRecentMoments, scalingNextStep, onSave, onNext]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        {t('phases.scaling.title')}
      </h1>

      <ScaleInput
        label={t('phases.scaling.slopeLabel')}
        value={scalingCurrent}
        onChange={setScalingCurrent}
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('phases.scaling.backpackLabel', { score: scalingCurrent })}
        </label>
        <textarea
          value={scalingResources}
          onChange={(e) => setScalingResources(e.target.value)}
          placeholder={t('phases.scaling.backpackPlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('phases.scaling.recentMomentsLabel')}
        </label>
        <textarea
          value={scalingRecentMoments}
          onChange={(e) => setScalingRecentMoments(e.target.value)}
          placeholder={t('phases.scaling.recentMomentsPlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('phases.scaling.nextStepLabel', { nextScore })}
        </label>
        <textarea
          value={scalingNextStep}
          onChange={(e) => setScalingNextStep(e.target.value)}
          placeholder={t('phases.scaling.nextStepPlaceholder')}
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

      <NavigationPanel onNavigate={onNavigate} onEnd={() => onNavigate('end')} />
    </div>
  );
}
