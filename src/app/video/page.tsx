import { getCurrentUser } from '@/app/actions/auth';
import { getVideoRoomForPartnerAction } from '@/app/actions/video';
import VideoMeetingClient from './VideoMeetingClient';
import { isValidVideoRoomName } from './videoRoom';
import { getServerTranslation } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

interface VideoPageProps {
  searchParams?: Promise<{
    room?: string;
    partnerId?: string;
  }>;
}

function getQueryValue(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export default async function VideoPage({ searchParams }: Readonly<VideoPageProps>) {
  const params = searchParams ? await searchParams : {};
  const roomQuery = getQueryValue(params.room);
  const partnerId = getQueryValue(params.partnerId);
  const currentUser = await getCurrentUser();
  const { t } = await getServerTranslation('common');

  let roomName: string | undefined;
  let error: string | undefined;

  if (partnerId) {
    const result = await getVideoRoomForPartnerAction(partnerId);
    if (result.success && result.data) {
      roomName = result.data.roomName;
    } else {
      error = result.error || t('video.errors.prepareRoom');
    }
  } else if (roomQuery) {
    if (isValidVideoRoomName(roomQuery)) {
      roomName = roomQuery;
    } else {
      error = t('video.errors.invalidRoomName');
    }
  }

  const user = currentUser.success && currentUser.data
    ? {
        name: currentUser.data.user.name,
        displayName: currentUser.data.user.displayName,
        email: currentUser.data.user.email,
      }
    : undefined;

  return <VideoMeetingClient initialRoomName={roomName} initialError={error} currentUser={user} />;
}
