import TrainingOfferDetailClient from './TrainingOfferDetailClient';
import { getTrainingOfferByIdAction } from '@/app/actions/training';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface TrainingOfferPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: TrainingOfferPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Training Offer ${id} | Changemappers`,
  };
}

export const dynamic = 'force-dynamic';

export default async function TrainingOfferPage({ params }: Readonly<TrainingOfferPageProps>) {
  const { id } = await params;
  const offer = await getTrainingOfferByIdAction(id);

  if (!offer) {
    notFound();
  }

  return <TrainingOfferDetailClient offer={offer} />;
}
