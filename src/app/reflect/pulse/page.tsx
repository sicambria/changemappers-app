'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { savePulseReflection } from '@/app/actions/reflection';
import { Button } from '@/components/ui';
import { ArrowLeftIcon, LockIcon } from 'lucide-react';

export default function PulsePage() {
  const router = useRouter();
  const { t } = useTranslation('reflect');
  
  const [scores, setScores] = useState<Record<string, number>>({
    alignmentScore: 3,
    energyScore: 3,
    outsideFunctionScore: 3,
  });
  const [outsideByChoice, setOutsideByChoice] = useState<boolean | null>(null);
  const [privateNotes, setPrivateNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = [
    {
      key: 'alignmentScore' as const,
      label: t('pulse.question1Label'),
      low: t('pulse.question1Low'),
      high: t('pulse.question1High'),
    },
    {
      key: 'energyScore' as const,
      label: t('pulse.question2Label'),
      low: t('pulse.question2Low'),
      high: t('pulse.question2High'),
    },
    {
      key: 'outsideFunctionScore' as const,
      label: t('pulse.question3Label'),
      low: t('pulse.question3Low'),
      high: t('pulse.question3High'),
    },
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await savePulseReflection({
        alignmentScore: scores.alignmentScore,
        energyScore: scores.energyScore,
        outsideFunctionScore: scores.outsideFunctionScore,
        outsideFunctionByChoice: outsideByChoice ?? undefined,
        privateNotes: privateNotes || undefined,
      });
      if (res.success) {
        router.push('/reflect');
      } else {
        setError(res.error ?? t('errors.saveFailed'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-2">
        <Link href="/reflect" className="text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('pulse.title')}</h1>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
        <LockIcon className="h-3 w-3" />
        {t('pulse.privacyNote')}
      </div>

      <div className="space-y-8">
        {questions.map((q) => (
          <div key={q.key} className="space-y-3">
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
              {q.label}
            </label>

            <div className="space-y-2">
              <input
                type="range"
                min={1} max={5}
                value={scores[q.key]}
                onChange={(e) => setScores(p => ({ ...p, [q.key]: Number.parseInt(e.target.value) }))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>1 — {q.low}</span>
                <span className="font-medium text-emerald-600">{scores[q.key]}</span>
                <span>5 — {q.high}</span>
              </div>
            </div>

            {q.key === 'outsideFunctionScore' && scores.outsideFunctionScore >= 3 && (
              <div className="pl-2 border-l-2 border-gray-200 dark:border-gray-700 space-y-2">
                <p className="text-xs text-gray-500">{t('pulse.outsideQuestion')}</p>
                <div className="flex gap-3">
                  {[
                    { v: true, label: t('pulse.byChoice') },
                    { v: false, label: t('pulse.byNecessity') },
                  ].map(({ v, label }) => (
                    <button key={String(v)} type="button"
                      onClick={() => setOutsideByChoice(v)}
                      className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${outsideByChoice === v
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-300'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('pulse.privateNotesLabel')}
          </label>
          <textarea
            value={privateNotes}
            onChange={(e) => setPrivateNotes(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm resize-none"
            rows={3}
            placeholder={t('pulse.privateNotesPlaceholder')}
          />
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

      <Button onClick={handleSubmit} isLoading={isSubmitting} className="w-full">
        {t('pulse.submit')}
      </Button>
    </main>
  );
}
