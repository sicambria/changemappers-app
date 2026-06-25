import MentorProfileDetailClient from './MentorProfileDetailClient';
import { getMentorProfileByIdAction } from '@/app/actions/mentoring';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: _id } = await params;
  return { title: `Mentor Profile | Changemappers` };
}

export const dynamic = 'force-dynamic';

export default async function MentorProfileDetailPage({ params }: Readonly<Props>) {
  const { id } = await params;
  const profile = await getMentorProfileByIdAction(id);

  if (!profile) {
    notFound();
  }

  return <MentorProfileDetailClient profile={profile} />;
}
