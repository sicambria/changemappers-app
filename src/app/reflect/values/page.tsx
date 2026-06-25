import { ToolIframeClient } from '@/components/features/tools/ToolIframeClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('reflect');
  return {
    title: `${t('metadata.valueCompassTitle')} | Changemappers`,
    description: t('metadata.valueCompassDesc'),
  };
}

export const revalidate = 3600;

export default async function ValueCompassPage() {
  const { t } = await getServerTranslation('reflect');
  return (
    <ToolIframeClient
      toolPath="/tools/value-compass/index.html"
      title={t('metadata.valueCompassTitle')}
      bgColor="bg-gray-50"
    />
  );
}
