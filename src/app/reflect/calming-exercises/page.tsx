import { CalmingExercisesClient } from '@/components/features/reflect/CalmingExercisesClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('reflect');
  return {
    title: `${t('calmingExercises.title')} | Changemappers`,
    description: t('calmingExercises.subtitle'),
  };
}

export default function CalmingExercisesPage() {
  return <CalmingExercisesClient />;
}
