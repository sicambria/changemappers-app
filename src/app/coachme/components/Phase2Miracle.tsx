'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { NavigationPanel } from './PhaseContainer';
import type { CoachMeSession } from '@/lib/prisma-shared';

interface Phase2MiracleProps {
  session: CoachMeSession;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onNext: () => void;
  onNavigate: (action: string) => void;
}

export function Phase2Miracle({ session, onSave, onNext, onNavigate }: Readonly<Phase2MiracleProps>) {
  const { t } = useTranslation('coachme');
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }); // §1B: mirror latest t for effects/callbacks below; no deps array on purpose

  const [step, setStep] = useState(0);
  const [miracleSignsA, setMiracleSignsA] = useState(session.miracleSignsA || '');
  const [miracleSignsB, setMiracleSignsB] = useState(session.miracleSignsB || '');
  const [miracleSignsC, setMiracleSignsC] = useState(session.miracleSignsC || '');
  const [miracleOptional, setMiracleOptional] = useState(session.miracleOptional || '');
  const [showVerification, setShowVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session.miracleSignsA && session.miracleSignsB && session.miracleSignsC) {
      setShowVerification(true);
    }
  }, [session]);

  const handleSave = useCallback(async () => {
    if (step === 0 && miracleSignsA.length < 3) {
      setError(tRef.current('errors.minLength'));
      return;
    }
    if (step === 1 && miracleSignsB.length < 3) {
      setError(tRef.current('errors.minLength'));
      return;
    }
    if (step === 2 && miracleSignsC.length < 3) {
      setError(tRef.current('errors.minLength'));
      return;
    }

    setError(null);

    await onSave({
      miracleSignsA: miracleSignsA || undefined,
      miracleSignsB: miracleSignsB || undefined,
      miracleSignsC: miracleSignsC || undefined,
      miracleOptional: miracleOptional || undefined,
    });

    if (step < 2) {
      setStep(step + 1);
    } else {
      setShowVerification(true);
    }
  }, [step, miracleSignsA, miracleSignsB, miracleSignsC, miracleOptional, onSave]);

  const handleConfirm = useCallback(async () => {
    await onSave({ currentPhase: 3 });
    onNext();
  }, [onSave, onNext]);

  if (showVerification) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t('phases.miracle.verificationTitle')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('phases.miracle.verificationSubtitle')}
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t('phases.miracle.questionA').slice(0, 50)}...
            </div>
            <div className="text-gray-900 dark:text-white">{miracleSignsA}</div>
            <button
              onClick={() => setShowVerification(false)}
              className="mt-2 text-sm text-emerald-600 hover:underline"
            >
              {t('phases.miracle.editButton')}
            </button>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t('phases.miracle.questionB').slice(0, 50)}...
            </div>
            <div className="text-gray-900 dark:text-white">{miracleSignsB}</div>
            <button
              onClick={() => {
                setStep(1);
                setShowVerification(false);
              }}
              className="mt-2 text-sm text-emerald-600 hover:underline"
            >
              {t('phases.miracle.editButton')}
            </button>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t('phases.miracle.questionC').slice(0, 50)}...
            </div>
            <div className="text-gray-900 dark:text-white">{miracleSignsC}</div>
            <button
              onClick={() => {
                setStep(2);
                setShowVerification(false);
              }}
              className="mt-2 text-sm text-emerald-600 hover:underline"
            >
              {t('phases.miracle.editButton')}
            </button>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
        >
          {t('phases.miracle.confirmButton')}
        </button>

        <NavigationPanel onNavigate={onNavigate} onEnd={() => onNavigate('end')} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        {t('phases.miracle.title')}
      </h1>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('phases.miracle.subtitle')}
      </p>

      {step >= 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('phases.miracle.questionA')}
          </label>
          <textarea
            value={miracleSignsA}
            onChange={(e) => setMiracleSignsA(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            rows={4}
          />
        </div>
      )}

      {step >= 1 && miracleSignsA && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('phases.miracle.questionB')}
          </label>
          <textarea
            value={miracleSignsB}
            onChange={(e) => setMiracleSignsB(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            rows={4}
          />
        </div>
      )}

      {step >= 2 && miracleSignsB && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('phases.miracle.questionC')}
          </label>
          <textarea
            value={miracleSignsC}
            onChange={(e) => setMiracleSignsC(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            rows={4}
          />
        </div>
      )}

      {miracleSignsC && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
            {t('phases.miracle.optionalLabel')}
          </label>
          <textarea
            value={miracleOptional}
            onChange={(e) => setMiracleOptional(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            rows={2}
          />
        </div>
      )}

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
