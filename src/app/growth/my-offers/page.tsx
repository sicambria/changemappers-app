import { getMyGrowthOffersAction } from '@/app/actions/growth-hub';
import { MyGrowthOffersClient } from './MyGrowthOffersClient';

export default async function MyGrowthOffersPage() {
  const offers = await getMyGrowthOffersAction();

  return <MyGrowthOffersClient initialOffers={offers} />;
}
