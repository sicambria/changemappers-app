import { ToolIframeClient } from '@/components/features/tools/ToolIframeClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('tools');
  return {
    title: `${t('preMeetingAudit.metaTitle')} | Changemappers`,
    description: t('preMeetingAudit.metaDescription'),
  };
}

export const revalidate = 3600;

export default async function PreMeetingAuditPage() {
  const { t } = await getServerTranslation('tools');
  return (
    <ToolIframeClient
      toolPath="/tools/pre-meeting-audit/index.html"
      title={t('preMeetingAudit.title')}
    />
  );
}
