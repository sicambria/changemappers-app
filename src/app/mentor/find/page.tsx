import FindMentorClient from './FindMentorClient';
import { getMentorProfilesAction } from '@/app/actions/mentoring';

export default async function FindMentorPage() {
  const profiles = await getMentorProfilesAction();

  return <FindMentorClient profiles={profiles} />;
}
