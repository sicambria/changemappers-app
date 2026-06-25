import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPollByOrganizerTokenAction } from '@/app/actions/scheduling';
import OrganizerPollViewClient from '@/components/features/scheduling/OrganizerPollViewClient';
import { getServerTranslation } from '@/lib/server-i18n';

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const result = await getPollByOrganizerTokenAction(token);
  const { t } = await getServerTranslation('meet');

  if (!result.success || !result.data) {
    return { title: `${t('labels.pollNotFound')} | Changemappers` };
  }

  return {
    title: `Organizer: ${result.data.title} | Changemappers`,
    description: t('labels.manageSchedulingPoll'),
  };
}

export default async function OrganizerPollPage({ params }: Readonly<PageProps>) {
  const { token } = await params;
  const result = await getPollByOrganizerTokenAction(token);

  if (!result.success || !result.data) {
    notFound();
  }

  const poll = result.data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <OrganizerPollViewClient
          poll={poll}
          organizerToken={token}
        />
      </div>
    </div>
  );
}
