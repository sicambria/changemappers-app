import { Metadata } from 'next';
import { VolunteerCreateClient } from './VolunteerCreateClient';

export const metadata: Metadata = {
  title: 'Post a Volunteer Request',
  description: 'Create a new volunteer opportunity and find people who share your mission.',
};

export default function VolunteerCreatePage() {
  return <VolunteerCreateClient />;
}
