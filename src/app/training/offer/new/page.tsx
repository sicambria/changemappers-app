import type { Metadata } from 'next';
import NewTrainingOfferClient from './NewTrainingOfferClient';

export const metadata: Metadata = {
  title: 'Create Training Offer | Changemappers',
  description: 'Share your expertise by posting a new peer training offer.',
};

export default function NewTrainingOfferPage() {
  return <NewTrainingOfferClient />;
}
