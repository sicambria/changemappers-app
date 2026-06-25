import { Metadata } from 'next';
import { VolunteerDetailClient } from './VolunteerDetailClient';

export const metadata: Metadata = {
  title: 'Volunteer Opportunity',
  description: 'View volunteer opportunity details and apply.',
};

export default async function VolunteerDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;
  return <VolunteerDetailClient id={id} />;
}
