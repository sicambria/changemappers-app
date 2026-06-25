import { Metadata } from 'next';
import { getSignalCollections } from '@/app/actions/weak-signal-collection';
import { CollectionList } from './CollectionList';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation('signals');
  return {
    title: t('collection.metaTitle'),
    description: t('collection.metaDescription'),
  };
}

export default async function CollectionsPage() {
  const [featuredSettled, allSettled] = await Promise.allSettled([
    getSignalCollections({ isFeatured: true, take: 10 }),
    getSignalCollections({ take: 30 }),
  ]);
  const featuredResult = featuredSettled.status === 'fulfilled' ? featuredSettled.value : { success: false, data: [] };
  const allResult = allSettled.status === 'fulfilled' ? allSettled.value : { success: false, data: [] };

  return (
    <div className="container mx-auto py-8 px-4">
      <CollectionList
        featuredCollections={featuredResult.success && featuredResult.data ? featuredResult.data : []}
        allCollections={allResult.success && allResult.data ? allResult.data : []}
      />
    </div>
  );
}
