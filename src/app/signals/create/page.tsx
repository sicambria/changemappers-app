import { Metadata } from 'next';
import { SignalForm } from './SignalForm';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation('signals');
  return {
    title: t('createMetaTitle'),
    description: t('createMetaDescription'),
  };
}

export default function CreateSignalPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <SignalForm />
    </div>
  );
}
