import { ToolIframeClient } from '@/components/features/tools/ToolIframeClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('tools');
  return {
    title: `${t('participationIndex.metaTitle')} | Changemappers`,
    description: t('participationIndex.metaDescription'),
  };
}

export const revalidate = 3600;

export default async function ParticipationIndexPage() {
  const { t } = await getServerTranslation('tools');
  return (
    <ToolIframeClient
      toolPath="/tools/participation-index/index.html"
      title={t('participationIndex.metaTitle')}
    />
  );
}
