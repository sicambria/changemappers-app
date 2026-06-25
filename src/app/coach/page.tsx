import { Metadata } from 'next';
import { CoachOverviewClient } from './CoachOverviewClient';

export const metadata: Metadata = {
  title: 'Coaching | Changemappers',
  description: 'Find a coach or offer coaching — structured inquiry for people navigating transformation.',
};

export default function CoachingOverviewPage() {
  return <CoachOverviewClient />;
}
