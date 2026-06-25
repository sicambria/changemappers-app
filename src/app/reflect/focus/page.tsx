import { SelfReflectFocusClient } from '@/components/features/reflect/SelfReflectFocusClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('reflect');
  return {
    title: `${t('focus.metaTitle')} | Changemappers`,
    description: t('focus.metaDescription'),
  };
}

export default function SelfReflectFocusPage() {
  return <SelfReflectFocusClient />;
}
