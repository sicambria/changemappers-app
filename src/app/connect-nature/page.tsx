import { ConnectNatureClient } from '@/components/features/connect-nature/ConnectNatureClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('common');
  return {
    title: t('connectNature.metaTitle'),
    description: t('connectNature.metaDescription'),
  };
}

export default function ConnectNaturePage() {
    return <ConnectNatureClient />;
}
