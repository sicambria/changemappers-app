import { getTrainingOffersAction } from '@/app/actions/training';
import type { Metadata } from 'next';
import TrainingPageClient from './TrainingPageClient';

export const metadata: Metadata = {
  title: 'Training | Changemappers',
  description: 'Peer training and skill-sharing connections for change makers.',
};

export const dynamic = 'force-dynamic';

export default async function TrainingPage() {
  const offers = await getTrainingOffersAction();

  return <TrainingPageClient offers={offers} />;
}
