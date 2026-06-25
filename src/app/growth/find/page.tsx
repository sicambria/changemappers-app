import { getGrowthOffersAction } from '@/app/actions/growth-hub';
import { GrowthFindClient } from './GrowthFindClient';

export default async function GrowthFindPage() {
  const offers = await getGrowthOffersAction();

  return <GrowthFindClient initialOffers={offers} />;
}
