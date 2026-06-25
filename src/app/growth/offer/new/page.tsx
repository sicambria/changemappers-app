import { Suspense } from 'react';
import { getServerTranslation } from '@/lib/server-i18n';
import { GrowthOfferFormClient } from '@/components/features/growth-hub';

export async function generateMetadata() {
  const { t } = await getServerTranslation('growth');
  return {
    title: `${t('offer.pageTitle')} | Changemappers`,
  };
}

export default async function GrowthOfferNewPage() {
  const { t } = await getServerTranslation('growth');
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">{t('offer.pageTitle')}</h1>
      <Suspense fallback={<div>{t('offer.loading')}</div>}>
        <GrowthOfferFormClient />
      </Suspense>
    </div>
  );
}
