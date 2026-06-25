'use client';

import Link from 'next/link';
import Image from 'next/image';
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

interface FindTrainingClientProps {
  offers: Offer[];
}

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800',
  INTERMEDIATE: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800',
  ADVANCED: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:border-teal-800',
  ALL: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
};

export default function FindTrainingClient({ offers }: Readonly<FindTrainingClientProps>) {
  const { t } = useTranslation('training');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('findTraining')}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('find.activeOffersSummary', { count: offers.length })}
            </p>
          </div>
          <Link
            href="/training/offer/new"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 transition-colors"
          >
            + {t('createOffer')}
          </Link>
        </div>

        {offers.length === 0 && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">{t('noOffersYet')}</p>
            <Link
              href="/training/offer/new"
              className="text-emerald-400 hover:text-emerald-700 dark:text-emerald-300 underline underline-offset-4 text-sm"
            >
              {t('find.emptyCta')}
            </Link>
          </div>
        )}

        {offers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {offers.map((offer) => {
              const creatorName = offer.creator.displayName || offer.creator.name || t('anonymous');
              const levelColor = LEVEL_COLORS[offer.level ?? ''] ?? LEVEL_COLORS['ALL'];

              return (
                <Link
                  key={offer.id}
                  href={`/training/offer/${offer.id}`}
                  className="group flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-emerald-600/40 transition-all duration-200 overflow-hidden"
                >
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-emerald-700 dark:text-emerald-300 transition-colors">
                        {offer.domain}
                      </h2>
                      <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                        {t('find.engaged', { count: offer._count.engagements })}
                      </span>
                    </div>

                    {offer.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                        {offer.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {offer.format && (
                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs px-2.5 py-0.5">
                          {t(`find.formatLabels.${offer.format}`, { defaultValue: offer.format })}
                        </span>
                      )}
                      {offer.level && (
                        <span
                          className={`inline-flex items-center rounded-full border text-xs px-2.5 py-0.5 ${levelColor}`}
                        >
                          {t(`find.levelLabels.${offer.level}`, { defaultValue: offer.level })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
                    {offer.creator.profilePhoto ? (
                      <Image
                        src={offer.creator.profilePhoto}
                        alt={creatorName}
                        width={32}
                        height={32}
                        className="rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          {creatorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{creatorName}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
