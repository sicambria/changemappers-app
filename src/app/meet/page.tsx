import { getCurrentUser } from '@/lib/get-current-user';
import type { Metadata } from 'next';
import { getUserPollsAction } from '@/app/actions/scheduling';
import MeetPageContent from '@/components/features/scheduling/MeetPageContent';
import { getServerTranslation } from '@/lib/server-i18n';
import { isValidVideoRoomName } from '@/app/video/videoRoom';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation('meet');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

interface MeetPageProps {
  searchParams?: Promise<{
    room?: string;
  }>;
}

function getQueryValue(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export default async function MeetPage({ searchParams }: Readonly<MeetPageProps>) {
  const params = searchParams ? await searchParams : {};
  const roomQuery = getQueryValue(params.room);
  const auth = await getCurrentUser();
  const isLoggedIn = auth.success && auth.data;
  const prefillName = isLoggedIn ? auth.data.name : null;
  const userId = isLoggedIn ? auth.data.id : null;
  const currentUser = isLoggedIn
    ? {
        name: auth.data.name,
        displayName: auth.data.displayName,
        email: auth.data.email,
      }
    : undefined;

  let initialVideoRoomName: string | undefined;
  let initialVideoError: string | undefined;

  if (roomQuery) {
    if (isValidVideoRoomName(roomQuery)) {
      initialVideoRoomName = roomQuery;
    } else {
      initialVideoError = 'Room names can use letters, numbers, underscores, and dashes.';
    }
  }

  let userPolls: Array<{
    id: string;
    title: string;
    organizerName: string;
    confirmedAt: Date | null;
    createdAt: Date;
    participantToken: string;
    organizerToken: string;
    _count: { responses: number };
  }> | null = null;
  
  if (userId) {
    const pollsResult = await getUserPollsAction();
    if (pollsResult.success && pollsResult.data) {
      userPolls = pollsResult.data;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <MeetPageContent
          isLoggedIn={!!isLoggedIn}
          prefillName={prefillName}
          userPolls={userPolls}
          initialVideoRoomName={initialVideoRoomName}
          initialVideoError={initialVideoError}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}
