import { ToolIframeClient } from '@/components/features/tools/ToolIframeClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('tools');
  return {
    title: `${t('valueCompass.metaTitle')} | Changemappers`,
    description: t('valueCompass.metaDescription'),
  };
}

export const revalidate = 3600;

export default async function ValueCompassPage() {
  const { t } = await getServerTranslation('tools');
  return (
    <ToolIframeClient
      toolPath="/tools/value-compass/index.html"
      title={t('valueCompass.metaTitle')}
    />
  );
}
