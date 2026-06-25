import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getSocialIssueById } from '@/app/actions/social-issue';
import { IssueDetail } from './IssueDetail';
import { getServerTranslation } from '@/lib/server-i18n';

interface IssuePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: IssuePageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getSocialIssueById(id);
  const { t } = await getServerTranslation('social-issues');

  if (!result.success || !result.data) {
    return { title: t('notFoundTitle') };
  }

  return {
    title: `${result.data.title} | Changemappers`,
    description: result.data.description || t('detailFallback'),
  };
}

export default async function IssuePage({ params }: Readonly<IssuePageProps>) {
  const { id } = await params;
  const result = await getSocialIssueById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <IssueDetail issue={result.data} />;
}
