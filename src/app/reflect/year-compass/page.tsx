import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import YearCompassClient from '@/components/features/reflect/YearCompassClient';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('reflect');
  return {
    title: `${t('metadata.yearCompassTitle')} | Changemappers`,
    description: t('metadata.yearCompassDesc'),
  };
}

export default async function YearCompassPage() {
  const userRes = await getCurrentUser();

  if (!userRes.success || !userRes.data) {
    redirect('/login?redirect=/reflect/year-compass');
  }

  return (
    <div className="bg-journal-bg min-h-screen">
      <YearCompassClient userId={userRes.data.user.id} />
    </div>
  );
}
