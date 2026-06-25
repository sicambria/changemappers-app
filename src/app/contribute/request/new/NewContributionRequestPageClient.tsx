'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import ContributionRequestFormClient from '@/components/features/contribute/ContributionRequestFormClient';

export default function NewContributionRequestPageClient() {
  const { t } = useTranslation('contribute');

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 space-y-3">
          <Link href="/contribute" className="inline-flex items-center text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-800">
            ← {t('title')}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{t('newRequest.title')}</h1>
          <p className="text-sm text-gray-600 sm:text-base">
            {t('newRequest.subtitle')}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <ContributionRequestFormClient />
        </div>
      </div>
    </main>
  );
}
