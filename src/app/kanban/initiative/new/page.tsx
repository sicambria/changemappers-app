import { Metadata } from 'next';
import NewInitiativeClient from './NewInitiativeClient';

export const metadata: Metadata = {
  title: 'Start an Initiative | Changemappers',
};

export default function NewInitiativePage() {
  return <NewInitiativeClient />;
}
