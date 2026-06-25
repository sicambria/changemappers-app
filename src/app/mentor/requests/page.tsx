import { getOpenMentoringRequestsAction } from '@/app/actions/mentoring';
import { IncomingMentoringRequestsClient } from './IncomingMentoringRequestsClient';

export default async function IncomingMentoringRequestsPage() {
  const requests = await getOpenMentoringRequestsAction();
  return <IncomingMentoringRequestsClient requests={requests} />;
}
