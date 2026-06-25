import { Metadata } from 'next';
import MentorOverviewClient from './MentorOverviewClient';

export const metadata: Metadata = {
  title: 'Mentoring | Changemappers',
  description: 'Find a mentor or become one to share lived experience across developmental arcs.',
};

export default function MentoringOverviewPage() {
  return <MentorOverviewClient />;
}
