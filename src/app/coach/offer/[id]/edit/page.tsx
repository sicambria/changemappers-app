import CoachingOfferFormClient from '@/components/features/coaching/CoachingOfferFormClient';
import { getCoachingOfferByIdAction } from '@/app/actions/coaching';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { EditCoachingOfferClient } from './EditCoachingOfferClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: _id } = await params;
  return { title: `Edit Coaching Offer | Changemappers` };
}

export const dynamic = 'force-dynamic';

export default async function EditCoachingOfferPage({ params }: Readonly<Props>) {
  const { id } = await params;
  const offer = await getCoachingOfferByIdAction(id);

  if (!offer) {
    notFound();
  }

  return (
    <>
      <EditCoachingOfferClient id={id} />
      <CoachingOfferFormClient
        isEdit
        id={id}
        initialData={{
          style: offer.style,
          format: offer.format,
          arcLengthOption: offer.arcLengthOption,
          availability: offer.availability,
          coacheeKnow: offer.coacheeKnow,
        }}
      />
    </>
  );
}
