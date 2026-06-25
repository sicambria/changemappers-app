import { ToolIframeClient } from '@/components/features/tools/ToolIframeClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('reflect');
  return {
    title: `${t('metadata.principlesTitle')} | Changemappers`,
    description: t('metadata.principlesDesc'),
  };
}

export const revalidate = 3600;

export default async function PrinciplesPage() {
  const { t } = await getServerTranslation('reflect');
  return (
    <ToolIframeClient
      toolPath="/tools/principles/index.html"
      title={t('metadata.principlesTitle')}
      bgColor="bg-gray-50"
    />
  );
}
