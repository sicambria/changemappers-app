import FindTrainingClient from './FindTrainingClient';
import { getTrainingOffersAction } from '@/app/actions/training';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find Training | Changemappers',
  description: 'Browse peer training offers from change makers in the network.',
};

export const dynamic = 'force-dynamic';

export default async function FindTrainingPage() {
  const offers = await getTrainingOffersAction();

  return <FindTrainingClient offers={offers} />;
}
