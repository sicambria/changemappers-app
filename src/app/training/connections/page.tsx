import { getMyTrainingConnectionsAction } from '@/app/actions/training';
import type { Metadata } from 'next';
import TrainingConnectionsClient from './TrainingConnectionsClient';

export const metadata: Metadata = {
  title: 'My Training Connections | Changemappers',
  description: 'View and manage your active and past training engagements.',
};

export const dynamic = 'force-dynamic';

export default async function TrainingConnectionsPage() {
  const engagements = await getMyTrainingConnectionsAction();

  return <TrainingConnectionsClient engagements={engagements} />;
}
