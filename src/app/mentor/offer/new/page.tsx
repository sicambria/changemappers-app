import type { Metadata } from 'next';
import BecomeMentorClient from './BecomeMentorClient';

export const metadata: Metadata = {
  title: 'Become a Mentor | Changemappers',
  description: 'Share your expertise and experience by becoming a mentor.',
};

export default function BecomeMentorPage() {
  return <BecomeMentorClient />;
}
