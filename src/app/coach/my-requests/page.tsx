import { getMyCoachingRequestsAction } from '@/app/actions/coaching';
import { MyCoachingRequestsClient } from './MyCoachingRequestsClient';

export default async function MyCoachingRequestsPage() {
  const requests = await getMyCoachingRequestsAction();
  return <MyCoachingRequestsClient requests={requests} />;
}
