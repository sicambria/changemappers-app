import ImpactDashboardClient from '@/components/features/tools/ImpactDashboardClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('tools');
  return {
    title: `${t('impactDashboard.metaTitle')} | Changemappers`,
    description: t('impactDashboard.metaDescription'),
  };
}

export const revalidate = 3600;

export default function ImpactDashboardPage() {
    return <ImpactDashboardClient />;
}
