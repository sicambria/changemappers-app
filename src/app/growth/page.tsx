import { getGrowthOffersAction } from '@/app/actions/growth-hub';
import { GrowthHubClient } from './GrowthHubClient';

export default async function GrowthHubPage() {
  const offers = await getGrowthOffersAction();

  return <GrowthHubClient initialOffers={offers} />;
}
