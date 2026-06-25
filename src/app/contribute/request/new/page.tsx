import type { Metadata } from 'next';
import { getServerTranslation } from '@/lib/server-i18n';
import NewContributionRequestPageClient from './NewContributionRequestPageClient';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation('contribute');

  return {
    title: `${t('metadata.newRequest.title')} | Changemappers`,
    description: t('metadata.newRequest.description'),
  };
}

export default function NewContributionRequestPage() {
  return <NewContributionRequestPageClient />;
}
