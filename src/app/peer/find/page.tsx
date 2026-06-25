import { getPeerSupportOffersAction } from '@/app/actions/peer';
import ProfessionalSupportBanner from '@/components/features/peer/ProfessionalSupportBanner';
import { getServerTranslation } from '@/lib/server-i18n';

export default async function FindPeerSupportPage() {
  const { t } = await getServerTranslation('peer');
  const offers = await getPeerSupportOffersAction();

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <ProfessionalSupportBanner />

        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 mt-6">
          {t('find.title')}
        </h1>
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
            const displayName = offer.offerer.displayName ?? offer.offerer.name ?? 'Anonymous';
            return (
              <a
                key={offer.id}
                href={`/peer/offer/${offer.id}`}
                className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-5 hover:border-teal-400 dark:hover:border-teal-600 transition-colors"
              >
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">{displayName}</p>

                {offer.situationsNavigated.length > 0 && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
                    {offer.situationsNavigated.join(', ')}
                  </p>
                )}

                {offer.format && (
                  <span className="inline-block text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded mr-2">
                    {offer.format}
                  </span>
                )}

                {offer.boundaryStatement && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 line-clamp-1 italic">
                    &quot;{offer.boundaryStatement}&quot;
                  </p>
                )}
              </a>
            );
          })}
        </div>
      </div>
    </main>
  );
}
