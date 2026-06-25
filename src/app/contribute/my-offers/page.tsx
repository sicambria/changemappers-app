import { getMyContributionOffersAction } from '@/app/actions/contribute';
import type { Metadata } from 'next';
import { getServerTranslation } from '@/lib/server-i18n';
import MyOffersPageClient from './MyOffersPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation('contribute');

  return {
    title: `${t('metadata.myOffers.title')} | Changemappers`,
  };
}

export const dynamic = 'force-dynamic';

export default async function MyContributionOffersPage() {
  const offers = await getMyContributionOffersAction();
  return <MyOffersPageClient offers={offers} />;
}
