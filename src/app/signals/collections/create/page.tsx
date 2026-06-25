import { Metadata } from 'next';
import { CollectionForm } from './CollectionForm';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation('signals');
  return {
    title: t('collection.createMetaTitle'),
    description: t('collection.createMetaDescription'),
  };
}

export default function CreateCollectionPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <CollectionForm />
    </div>
  );
}
