'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import type { GrowthModality } from '@/types/growth-hub';
import { ArchiveOfferButton } from '@/components/features/growth-hub/ArchiveOfferButton';

interface MyGrowthOffersClientProps {
  initialOffers: Array<{ id: string; modality: GrowthModality; data: Record<string, unknown> }>;
}

// Modalities that have a dedicated /<modality>/offer/[id]/edit route.
// PEER has no edit route (src/app/peer/offer/ has only [id] and new), so no edit
// affordance is rendered for it — AUDIT-20260613-024 (remove inert UI precedent).
const modalityRoute: Partial<Record<GrowthModality, string>> = {
  MENTOR: 'mentor',
  COACH: 'coach',
  TRAINING: 'training',
};

export function MyGrowthOffersClient({ initialOffers }: Readonly<MyGrowthOffersClientProps>) {
  const { t } = useTranslation('growth');

  if (initialOffers.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          {t('tabs.myOffers')}
        </h1>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {t('empty.noMyOffers')}
        </div>
        <div className="text-center mt-4">
          <Link
            href="/growth/offer/new"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors inline-block"
          >
            {t('actions.create')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {t('tabs.myOffers')}
      </h1>

      <div className="space-y-4">
        {initialOffers.map((offer) => (
          <div
            key={`${offer.modality}-${offer.id}`}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {t(`modality.${offer.modality.toLowerCase()}`)}
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {(offer.data as { domain?: string; style?: string; situationType?: string }).domain ||
                    (offer.data as { style?: string }).style ||
                    (offer.data as { situationType?: string }).situationType ||
                    'No title'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {modalityRoute[offer.modality] && (
                  <Link
                    href={`/${modalityRoute[offer.modality]}/offer/${offer.id}/edit`}
                    className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {t('actions.edit')}
                  </Link>
                )}
                <ArchiveOfferButton modality={offer.modality} offerId={offer.id} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
