import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getWeakSignalById } from '@/app/actions/weak-signal';
import { SignalDetail } from './SignalDetail';
import { getServerTranslation } from '@/lib/server-i18n';

interface SignalPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SignalPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getWeakSignalById(id);
  const { t } = await getServerTranslation('signals');

  if (!result.success || !result.data) {
    return { title: t('notFoundTitle') };
  }

  return {
    title: `${result.data.title} | Changemappers`,
    description: result.data.description || t('detailFallback'),
  };
}

export default async function SignalPage({ params }: Readonly<SignalPageProps>) {
  const { id } = await params;
  const result = await getWeakSignalById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <SignalDetail signal={result.data} />;
}
