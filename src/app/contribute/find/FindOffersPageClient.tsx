'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const TYPE_COLORS: Record<string, string> = {
  SKILL_OFFERING: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  ACCOMPANIMENT: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  KNOWLEDGE_COMMONS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  HOLDING_SPACE: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

interface Offer {
  id: string;
  type: string;
  domain: string | null;
  timeCommitment: string;
  format: string;
  availability: string | null;
  offerer: {
    name: string | null;
    displayName: string | null;
    profilePhoto: string | null;
  };
}

interface FindOffersPageClientProps {
  offers: Offer[];
}

export default function FindOffersPageClient({ offers }: Readonly<FindOffersPageClientProps>) {
  const { t } = useTranslation('contribute');

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('browse.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {t('browse.count', { count: offers.length })}
            </p>
          </div>
          <Link
            href="/contribute/offer/new"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            {t('browse.offerSomething')}
          </Link>
        </div>

        {offers.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-16">
            {t('browse.empty')}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="rounded-xl border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-900"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[offer.type] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}
                >
                  {t(`types.${offer.type}`)}
                </span>
                {offer.format && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">{offer.format}</span>
                )}
              </div>

              {offer.domain && (
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {offer.domain}
                </p>
              )}

              {offer.timeCommitment && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {offer.timeCommitment}
                </p>
              )}

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>{offer.offerer.displayName ?? offer.offerer.name}</span>
                </div>
                <Link
                  href="/contribute/connections"
                  className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {t('browse.connect')} &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
