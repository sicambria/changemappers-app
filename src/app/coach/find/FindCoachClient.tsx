'use client';

import { useTranslation } from 'react-i18next';

interface CoachOffer {
  id: string;
  style: string | null;
  format: string | null;
  arcLengthOption: string | null;
  coach: {
    displayName: string | null;
    name: string | null;
  };
}

interface FindCoachClientProps {
  offers: CoachOffer[];
}

export function FindCoachClient({ offers }: Readonly<FindCoachClientProps>) {
  const { t } = useTranslation('coaching');

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('find.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          {t('find.subtitle')}
        </p>

        {offers.length === 0 && (
          <p className="text-gray-400 dark:text-gray-500 text-center py-16">
            {t('find.noOffers')}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {offers.map((offer) => {
            const displayName = offer.coach.displayName ?? offer.coach.name ?? t('anonymous');
            return (
              <a
                key={offer.id}
                href={`/coach/offer/${offer.id}`}
                className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-5 hover:border-violet-400 dark:hover:border-violet-600 transition-colors"
              >
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-3">{displayName}</p>

                <div className="flex flex-wrap gap-2">
                  {offer.style && (
                    <span className="text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950 px-2 py-0.5 rounded">
                      {offer.style}
                    </span>
                  )}
                  {offer.format && (
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                      {offer.format}
                    </span>
                  )}
                  {offer.arcLengthOption && (
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                      {offer.arcLengthOption}
                    </span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </main>
  );
}
