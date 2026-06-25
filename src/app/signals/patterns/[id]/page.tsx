import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getWeakSignalPatternById } from '@/app/actions/weak-signal-pattern';
import { PatternDetail } from './PatternDetail';
import { getServerTranslation } from '@/lib/server-i18n';

interface PatternPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PatternPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getWeakSignalPatternById(id);
  const { t } = await getServerTranslation('signals');

  if (!result.success || !result.data) {
    return { title: t('notFoundTitle') };
  }

  return {
    title: `${(result.data as { name: string }).name} | Changemappers`,
    description: (result.data as { description?: string }).description ?? t('pattern.detailMetaTitle'),
  };
}

export default async function PatternPage({ params }: Readonly<PatternPageProps>) {
  const { id } = await params;
  const result = await getWeakSignalPatternById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <PatternDetail patternId={id} />;
}
