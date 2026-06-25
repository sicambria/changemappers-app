import GlossaryClient from '@/components/features/glossary/GlossaryClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('glossary');
  return {
    title: `${t('metaTitle')} | Changemappers`,
    description: t('metaDescription'),
  };
}

export const revalidate = 3600;

export default function GlossaryPage() {
    return <GlossaryClient />;
}
