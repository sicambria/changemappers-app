import { ToolIframeClient } from '@/components/features/tools/ToolIframeClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('tools');
  return {
    title: `${t('principles.metaTitle')} | Changemappers`,
    description: t('principles.metaDescription'),
  };
}

export const revalidate = 3600;

export default async function PrinciplesPage() {
  const { t } = await getServerTranslation('tools');
  return (
    <ToolIframeClient
      toolPath="/tools/principles/index.html"
      title={t('principles.metaTitle')}
    />
  );
}
