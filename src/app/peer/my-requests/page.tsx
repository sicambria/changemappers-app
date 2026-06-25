import { getMyPeerSupportRequestsAction } from '@/app/actions/peer';
import { MyPeerSupportRequestsClient } from './MyPeerSupportRequestsClient';

export default async function MyPeerSupportRequestsPage() {
  const requests = await getMyPeerSupportRequestsAction();
  return <MyPeerSupportRequestsClient requests={requests} />;
}
