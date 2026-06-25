import { OpenPlatformAnalyzerClient } from '@/components/features/tools/OpenPlatformAnalyzerClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('tools');
  return {
    title: `${t('openPlatform.metaTitle')} | Changemappers`,
    description: t('openPlatform.metaDescription'),
  };
}

export default function OpenPlatformPage() {
  return <OpenPlatformAnalyzerClient />;
}
