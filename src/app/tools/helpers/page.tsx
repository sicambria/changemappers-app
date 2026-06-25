import { ToolIframeClient } from '@/components/features/tools/ToolIframeClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('tools');
  return {
    title: `${t('innerHelpers.metaTitle')} | Changemappers`,
    description: t('innerHelpers.metaDescription'),
  };
}

export const revalidate = 3600;

export default async function HelpersPage() {
  const { t } = await getServerTranslation('tools');
  return (
    <ToolIframeClient
      toolPath="/tools/helpers/index.html"
      title={t('innerHelpers.metaTitle')}
    />
  );
}
