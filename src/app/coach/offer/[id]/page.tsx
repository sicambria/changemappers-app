import { getCoachingOfferByIdAction } from '@/app/actions/coaching';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CoachingOfferDetailClient } from './CoachingOfferDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: _id } = await params;
  return { title: `Coaching Offer | Changemappers` };
}

export const dynamic = 'force-dynamic';

export default async function CoachingOfferDetailPage({ params }: Readonly<Props>) {
  const { id } = await params;
  const offer = await getCoachingOfferByIdAction(id);

  if (!offer) {
    notFound();
  }

  return <CoachingOfferDetailClient id={id} offer={offer} />;
}
