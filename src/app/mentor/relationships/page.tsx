import { getMyMentoringRelationshipsAction } from '@/app/actions/mentoring';
import MyMentoringRelationshipsClient from './MyMentoringRelationshipsClient';

export default async function MyMentoringRelationshipsPage() {
  const relationships = await getMyMentoringRelationshipsAction();

  return <MyMentoringRelationshipsClient relationships={relationships} />;
}
