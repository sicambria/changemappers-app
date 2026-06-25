import { getMyMentorProfileAction } from '@/app/actions/mentoring';
import type { Metadata } from 'next';
import MyMentorProfileClient from './MyMentorProfileClient';

export const metadata: Metadata = {
  title: 'My Mentor Profile | Changemappers',
};

export const dynamic = 'force-dynamic';

export default async function MyMentorProfilePage() {
  const profile = await getMyMentorProfileAction();

  return <MyMentorProfileClient profile={profile} />;
}
