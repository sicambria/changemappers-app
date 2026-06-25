import { getMyCoachingConnectionsAction } from '@/app/actions/coaching';
import { CoachingConnectionsClient } from './CoachingConnectionsClient';

export default async function MyCoachingConnectionsPage() {
  const engagements = await getMyCoachingConnectionsAction();
  return <CoachingConnectionsClient engagements={engagements} />;
}
