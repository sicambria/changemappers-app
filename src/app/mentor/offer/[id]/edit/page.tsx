import { getMentorProfileByIdAction } from '@/app/actions/mentoring';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import EditMentorProfileClient from './EditMentorProfileClient';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: _id } = await params;
  return { title: `Edit Mentor Profile | Changemappers` };
}

export const dynamic = 'force-dynamic';

export default async function EditMentorProfilePage({ params }: Readonly<Props>) {
  const { id } = await params;
  const profile = await getMentorProfileByIdAction(id);

  if (!profile) {
    notFound();
  }

  return (
    <EditMentorProfileClient
      id={id}
      profile={{
        id: profile.id,
        domain: profile.domain,
        yearsExperience: profile.yearsExperience,
        whatCanOffer: profile.whatCanOffer,
        arcLengthPreference: profile.arcLengthPreference,
        maxConcurrent: profile.maxConcurrent,
      }}
    />
  );
}
