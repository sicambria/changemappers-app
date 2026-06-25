import { Metadata } from 'next';
import { SignalsList } from './SignalsList';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation('signals');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function SignalsPage() {
  const { t } = await getServerTranslation('signals');
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('description')}. {t('verificationHint')}
          </p>
        </header>

        <SignalsList />
      </div>
    </div>
  );
}
