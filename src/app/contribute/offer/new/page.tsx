import type { Metadata } from 'next';
import { getServerTranslation } from '@/lib/server-i18n';
import NewOfferPageClient from './NewOfferPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation('contribute');

  return {
    title: `${t('metadata.newOffer.title')} | Changemappers`,
    description: t('metadata.newOffer.description'),
  };
}

export default function NewOfferPage() {
  return <NewOfferPageClient />;
}
