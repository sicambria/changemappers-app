import { getMyMentoringRequestsAction } from '@/app/actions/mentoring';
import { MyMentoringRequestsClient } from './MyMentoringRequestsClient';

export default async function MyMentoringRequestsPage() {
  const requests = await getMyMentoringRequestsAction();
  return <MyMentoringRequestsClient requests={requests} />;
}
