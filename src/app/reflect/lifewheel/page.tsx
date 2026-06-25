import LifeWheelClient from '@/components/features/reflect/LifeWheelClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('reflect');
  return {
    title: `${t('metadata.lifewheelTitle')} | Changemappers`,
    description: t('metadata.lifewheelDesc'),
  };
}

export const revalidate = 3600;

export default function LifeWheelPage() {
  return <LifeWheelClient />;
}
