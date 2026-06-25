import { getMyContributionRequestsAction } from '@/app/actions/contribute';
import { MyContributionRequestsClient } from './MyContributionRequestsClient';

export default async function MyContributionRequestsPage() {
  const requests = await getMyContributionRequestsAction();
  return <MyContributionRequestsClient requests={requests} />;
}
