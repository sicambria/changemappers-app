import { getMyTrainingOffersAction } from '@/app/actions/training';
import type { Metadata } from 'next';
import MyTrainingOffersClient from './MyTrainingOffersClient';

export const metadata: Metadata = {
  title: 'My Training Offers | Changemappers',
};

export const dynamic = 'force-dynamic';

export default async function MyTrainingOffersPage() {
  const offers = await getMyTrainingOffersAction();

  return <MyTrainingOffersClient offers={offers} />;
}
