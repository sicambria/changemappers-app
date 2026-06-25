'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { ArrowLeftIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';

type Exercise = {
  title: string;
  time: string;
  bestFor: string;
  evidence: string;
  steps: string[];
  tip?: string;
};

type DailyProtocol = {
  title: string;
  steps: string[];
  reminder: string;
};

export function CalmingExercisesClient() {
  const { t } = useTranslation('reflect');
  const exercises = t('calmingExercises.exercises', { returnObjects: true }) as Exercise[];
  const protocol = t('calmingExercises.dailyProtocol', { returnObjects: true }) as DailyProtocol;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <Link
          href="/reflect?tab=checkin"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('calmingExercises.backToReflect')}
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t('calmingExercises.title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          {t('calmingExercises.subtitle')}
        </p>
      </div>

      <div className="space-y-3">
        {exercises.map((exercise, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={exercise.title}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => toggle(index)}
                className="w-full flex items-start gap-4 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {exercise.title}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                      {exercise.time}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 pt-0.5">
                      {exercise.bestFor}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-gray-400 dark:text-gray-500 mt-0.5">
                  {isOpen ? (
                    <ChevronUpIcon className="h-4 w-4" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                  <ol className="space-y-1.5 list-decimal list-inside">
                    {exercise.steps.map((step) => (
                      <li key={step} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {step}
                      </li>
                    ))}
                  </ol>
                  {exercise.tip && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 italic border-l-2 border-emerald-300 dark:border-emerald-700 pl-3">
                      {exercise.tip}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {t('calmingExercises.evidenceLabel')}: {exercise.evidence}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          {protocol.title}
        </h2>
        <ol className="space-y-1.5 list-decimal list-inside">
          {protocol.steps.map((step) => (
            <li key={step} className="text-sm text-emerald-700 dark:text-emerald-400">
              {step}
            </li>
          ))}
        </ol>
        <p className="text-xs text-emerald-600 dark:text-emerald-500 italic">
          {protocol.reminder}
        </p>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center pb-4">
        {t('calmingExercises.safetyNote')}
      </p>
    </main>
  );
}
