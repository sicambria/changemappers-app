import { Metadata } from 'next';
import { SocialIssuesList } from './SocialIssuesList';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation('social-issues');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function SocialIssuesPage() {
  const { t } = await getServerTranslation('social-issues');
  return (
    <div className="mx-auto w-full max-w-7xl overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl min-w-0">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('description')}. {t('verificationHint')}
          </p>
        </header>

        <SocialIssuesList />
      </div>
    </div>
  );
}
