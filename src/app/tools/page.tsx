import ToolsHubClient from '@/components/features/tools/ToolsHubClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('tools');
  return {
    title: `${t('metaTitle')} | Changemappers`,
    description: t('metaDescription'),
  };
}

export const revalidate = 3600;

export default function ToolsPage() {
    return <ToolsHubClient />;
}
