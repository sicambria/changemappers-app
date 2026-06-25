import { getTrainingOfferByIdAction } from '@/app/actions/training';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import EditTrainingOfferClient from './EditTrainingOfferClient';

interface EditTrainingOfferPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditTrainingOfferPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Edit Training Offer | Changemappers`,
    description: `Edit training offer ${id}.`,
  };
}

export const dynamic = 'force-dynamic';

export default async function EditTrainingOfferPage({ params }: Readonly<EditTrainingOfferPageProps>) {
  const { id } = await params;
  const offer = await getTrainingOfferByIdAction(id);

  if (!offer) {
    notFound();
  }

  return (
    <EditTrainingOfferClient
      id={id}
      offer={{
        id: offer.id,
        domain: offer.domain,
        format: offer.format,
        level: offer.level,
        description: offer.description,
        isSync: offer.isSync,
        isGroupFormat: offer.isGroupFormat,
        timeCommitment: offer.timeCommitment,
        capacity: offer.capacity,
      }}
    />
  );
}
