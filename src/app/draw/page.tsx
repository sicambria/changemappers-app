import ExcalidrawPageClient from '@/components/features/tools/ExcalidrawPageClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('tools');

  return {
    title: `${t('draw.metaTitle')} | Changemappers`,
    description: t('draw.metaDescription'),
  };
}

export const revalidate = 3600;

export default function DrawPage() {
  return <ExcalidrawPageClient />;
}
