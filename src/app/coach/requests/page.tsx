import { getOpenCoachingRequestsAction, getMyCoachingOffersAction } from '@/app/actions/coaching';
import { IncomingCoachingRequestsClient } from './IncomingCoachingRequestsClient';

export default async function IncomingCoachingRequestsPage() {
  const [requests, myOffers] = await Promise.all([
    getOpenCoachingRequestsAction(),
    getMyCoachingOffersAction(),
  ]);
  return <IncomingCoachingRequestsClient requests={requests} myOffers={myOffers} />;
}
