'use client';

import { useTranslation } from 'react-i18next';
import ContributionOfferFormClient from '@/components/features/contribute/ContributionOfferFormClient';

export default function NewOfferPageClient() {
  const { t } = useTranslation('contribute');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('newOffer.title')}</h1>
          <p className="text-gray-500 text-sm">
            {t('newOffer.subtitle')}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <ContributionOfferFormClient />
        </div>
      </div>
    </div>
  );
}
