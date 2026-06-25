import { getServerTranslation } from '@/lib/server-i18n';
import { TimelineClient } from './TimelineClient';

export default async function SignalsTimelinePage() {
  const { t } = await getServerTranslation('signals');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('timeline.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t('timeline.description')}
        </p>
      </div>
      <TimelineClient />
    </div>
  );
}
