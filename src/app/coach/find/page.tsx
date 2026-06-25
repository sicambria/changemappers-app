import { getCoachingOffersAction } from '@/app/actions/coaching';
import { FindCoachClient } from './FindCoachClient';

export default async function FindCoachPage() {
  const offers = await getCoachingOffersAction();
  return <FindCoachClient offers={offers} />;
}
