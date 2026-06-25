'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Offer {
  id: string;
  domain: string;
  description: string | null;
  format: string | null;
  level: string | null;
  creator: {
    displayName: string | null;
    name: string | null;
    profilePhoto: string | null;
  };
  _count: { engagements: number };
}

interface TrainingOfferDetailClientProps {
  offer: Offer;
}

export default function TrainingOfferDetailClient({ offer }: Readonly<TrainingOfferDetailClientProps>) {
  const { t } = useTranslation('training');
  const creatorName = offer.creator.displayName || offer.creator.name || t('anonymous');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/training/find"
          className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-8 transition-colors"
        >
          ← {t('offerDetail.backToOffers')}
        </Link>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{offer.domain}</h1>

          <div className="flex flex-wrap gap-2 mb-6">
            {offer.format && (
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 text-sm px-3 py-1">
                {t(`offerDetail.formatLabels.${offer.format}`, { defaultValue: offer.format })}
              </span>
            )}
            {offer.level && (
              <span className="inline-flex items-center rounded-full border border-emerald-700/40 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-700 dark:text-emerald-300 text-sm px-3 py-1">
                {t(`offerDetail.levelLabels.${offer.level}`, { defaultValue: offer.level })}
              </span>
            )}
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 text-sm px-3 py-1">
              {t('offerDetail.engagementCount', { count: offer._count.engagements })}
            </span>
          </div>

          {offer.description && (
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-8 whitespace-pre-wrap">
              {offer.description}
            </p>
          )}

          <div className="flex items-center gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            {offer.creator.profilePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={offer.creator.profilePhoto}
                alt={creatorName}
                width={40}
                height={40}
                className="rounded-full object-cover shrink-0 w-10 h-10"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                  {creatorName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{creatorName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('offerDetail.trainer')}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/training/request/new"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-5 py-2.5 transition-colors"
          >
            {t('offerDetail.postRequestMatch')}
          </Link>
          <Link
            href={`/training/offer/${offer.id}/edit`}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium px-5 py-2.5 transition-colors"
          >
            {t('editOffer')}
          </Link>
        </div>
      </div>
    </div>
  );
}
