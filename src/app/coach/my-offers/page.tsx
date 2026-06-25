import { getMyCoachingOffersAction } from '@/app/actions/coaching';
import { MyCoachingOffersClient } from './MyCoachingOffersClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Coaching Offers | Changemappers',
};

export const dynamic = 'force-dynamic';

export default async function MyCoachingOffersPage() {
  const offers = await getMyCoachingOffersAction();
  return <MyCoachingOffersClient offers={offers} />;
}
