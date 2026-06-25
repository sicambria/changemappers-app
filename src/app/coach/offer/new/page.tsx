import CoachingOfferFormClient from '@/components/features/coaching/CoachingOfferFormClient';
import { OfferCoachingClient } from './OfferCoachingClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Offer Coaching | Changemappers',
  description: 'Share your coaching style and availability to help others grow.',
};

export default function NewCoachingOfferPage() {
  return (
    <>
      <OfferCoachingClient />
      <CoachingOfferFormClient />
    </>
  );
}
