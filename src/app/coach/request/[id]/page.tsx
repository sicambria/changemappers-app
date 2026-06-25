import { getCoachingRequestByIdAction } from '@/app/actions/coaching';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { CoachingRequestDetailClient } from './CoachingRequestDetailClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: _id } = await params;
  return { title: `Coaching Request | Changemappers` };
}

export const dynamic = 'force-dynamic';

export default async function CoachingRequestDetailPage({ params }: Readonly<Props>) {
  const { id } = await params;
  const request = await getCoachingRequestByIdAction(id);

  if (!request) {
    notFound();
  }

  return <CoachingRequestDetailClient request={request} />;
}
