import { ToolIframeClient } from '@/components/features/tools/ToolIframeClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('reflect');
  return {
    title: `${t('metadata.helpersTitle')} | Changemappers`,
    description: t('metadata.helpersDesc'),
  };
}

export const revalidate = 3600;

export default async function HelpersPage() {
  const { t } = await getServerTranslation('reflect');
  return (
    <ToolIframeClient
      toolPath="/tools/helpers/index.html"
      title={t('metadata.helpersTitle')}
      bgColor="bg-gray-50"
    />
  );
}
