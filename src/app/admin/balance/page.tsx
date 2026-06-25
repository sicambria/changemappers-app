import { getTelemetryData } from '@/app/actions/telemetry';
import { AdminBalanceContent } from '@/components/features/admin/AdminBalanceContent';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('admin');
  return {
    title: t('balance.metaTitle'),
    description: t('balance.metaDescription'),
  };
}

export const dynamic = 'force-dynamic';

export default async function BalancePage() {
  const res = await getTelemetryData();

  if (!res.success || !res.data) {
    return <AdminBalanceContent data={null} error={res.error} />;
  }

  const { burnoutData, rejectionData, highRiskRetention, totalDepletingFlags } = res.data;

  return (
    <AdminBalanceContent
      data={{
        burnoutData,
        rejectionData,
        highRiskRetention,
        totalDepletingFlags,
      }}
    />
  );
}
