import { getServerTranslation } from '@/lib/server-i18n';
import { ClusterList } from './ClusterList';

export default async function SignalsClustersPage() {
  const { t } = await getServerTranslation('signals');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('clusters.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t('clusters.description')}
        </p>
      </div>
      <ClusterList />
    </div>
  );
}
