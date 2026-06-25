import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSignalCollectionById } from '@/app/actions/weak-signal-collection';
import { CollectionDetail } from './CollectionDetail';
import { getServerTranslation } from '@/lib/server-i18n';

interface CollectionPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getSignalCollectionById(id);
  const { t } = await getServerTranslation('signals');

  if (!result.success || !result.data) {
    return { title: t('notFoundTitle') };
  }

  return {
    title: `${(result.data as { name: string }).name} | Changemappers`,
    description: (result.data as { description?: string }).description ?? t('collection.detailMetaTitle'),
  };
}

export default async function CollectionPage({ params }: Readonly<CollectionPageProps>) {
  const { id } = await params;
  const result = await getSignalCollectionById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <CollectionDetail collectionId={id} />;
}
