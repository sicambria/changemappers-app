import { getMyTrainingRequestsAction } from '@/app/actions/training';
import { MyTrainingRequestsClient } from './MyTrainingRequestsClient';

export default async function MyTrainingRequestsPage() {
  const requests = await getMyTrainingRequestsAction();
  return <MyTrainingRequestsClient requests={requests} />;
}
