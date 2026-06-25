'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArchiveOfferButton } from '@/components/features/growth-hub/ArchiveOfferButton';

interface Offer {
  id: string;
  domain: string;
  format: string;
  level: string;
  description: string | null;
}

interface MyTrainingOffersClientProps {
  offers: Offer[];
}

const FORMAT_LABELS: Record<string, string> = {
  WORKSHOP: 'Workshop',
  COURSE: 'Course',
  DEMO: 'Demo',
  RESOURCE: 'Resource',
  GUIDED_PRACTICE: 'Guided Practice',
};

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Beginner',
  PARTIAL: 'Partial',
  ADVANCED: 'Advanced',
};

export default function MyTrainingOffersClient({ offers }: Readonly<MyTrainingOffersClientProps>) {
  const { t } = useTranslation('training');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">{t('myOffers')}</h1>
          <Link
            href="/training/offer/new"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 transition-colors"
          >
            {t('newOffer')}
          </Link>
        </div>

        {offers.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">{t('noOffersYet')}.</p>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{offer.domain}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {FORMAT_LABELS[offer.format] ?? offer.format} · {LEVEL_LABELS[offer.level] ?? offer.level}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/training/offer/${offer.id}/edit`}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm px-3 py-1.5 transition-colors"
                    >
                      Edit
                    </Link>
                    <ArchiveOfferButton modality="TRAINING" offerId={offer.id} />
                  </div>
                </div>
                {offer.description && (
                  <p className="text-gray-700 dark:text-gray-300 text-sm mt-3 line-clamp-2">{offer.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
