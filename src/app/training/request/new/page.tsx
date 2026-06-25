import type { Metadata } from 'next';
import NewTrainingRequestClient from './NewTrainingRequestClient';

export const metadata: Metadata = {
  title: 'Post a Training Request | Changemappers',
  description: 'Tell the network what skills you are looking to develop.',
};

export default function NewTrainingRequestPage() {
  return <NewTrainingRequestClient />;
}
