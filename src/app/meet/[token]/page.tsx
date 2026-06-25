import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPollByParticipantTokenAction } from '@/app/actions/scheduling';
import ParticipantPollViewClient from '@/components/features/scheduling/ParticipantPollViewClient';
import { getServerTranslation } from '@/lib/server-i18n';

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const result = await getPollByParticipantTokenAction(token);
  const { t } = await getServerTranslation('meet');

  if (!result.success || !result.data) {
    return { title: `${t('labels.pollNotFound')} | Changemappers` };
  }

  return {
    title: `${result.data.title} | Changemappers`,
    description: `${t('labels.joinSchedulingPoll')}: ${result.data.organizerName}`,
  };
}

export default async function ParticipantPollPage({ params }: Readonly<PageProps>) {
  const { token } = await params;
  const result = await getPollByParticipantTokenAction(token);

  if (!result.success || !result.data) {
    notFound();
  }

  const poll = result.data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ParticipantPollViewClient
          poll={poll}
          participantToken={token}
        />
      </div>
    </div>
  );
}
