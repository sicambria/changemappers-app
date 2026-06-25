'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import PitchCard from '@/components/features/pitch/PitchCard';
import type { PitchDetail } from '@/app/actions/pitch';

type MyPitchesResult = { success: true; data: PitchDetail[] } | { success: false; error?: string };

export default function MyPitchesClient({ result }: Readonly<{ result: MyPitchesResult }>) {
  const { t, i18n } = useTranslation('pitch');

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('mine.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('mine.subtitle')}
            </p>
          </div>
          <Link
            href="/pitch/new"
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
          >
            {t('mine.newPitch')}
          </Link>
        </div>

        {result.success && result.data.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {result.data.map((pitch) => (
              <div key={pitch.id} className="relative">
                <PitchCard pitch={pitch} language={i18n.language as 'hu' | 'en' | 'es'} />
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span
                    className={`rounded-full px-2 py-0.5 ${(() => {
                      if (pitch.status === 'PUBLISHED') return 'bg-green-100 text-green-800';
                      if (pitch.status === 'DRAFT') return 'bg-yellow-100 text-yellow-800';
                      return 'bg-gray-100 text-gray-800';
                    })()}`}
                  >
                    {t(`status.${pitch.status}`, pitch.status)}
                  </span>
                  <Link
                    href={`/pitch/${pitch.id}/edit`}
                    className="text-blue-600 hover:underline"
                  >
                    {t('mine.edit')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {result.success ? t('mine.empty') : t('mine.error')}
            </p>
            <Link
              href="/pitch/new"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
            >
              {t('mine.createNew')}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
