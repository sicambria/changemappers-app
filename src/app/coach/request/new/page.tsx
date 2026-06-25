import CoachingRequestFormClient from '@/components/features/coaching/CoachingRequestFormClient';
import { RequestCoachingClient } from './RequestCoachingClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Request Coaching | Changemappers',
  description: 'Find a coach to help you navigate challenges and shifts.',
};

export default function NewCoachingRequestPage() {
  return (
    <>
      <RequestCoachingClient />
      <CoachingRequestFormClient />
    </>
  );
}
