import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/get-current-user';
import { listMyPitchesAction } from '@/app/actions/pitch';
import MyPitchesClient from './MyPitchesClient';

export const dynamic = 'force-dynamic';

export default async function MyPitchesPage() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) {
    redirect('/login?redirect=/pitch/mine');
  }

  const result = await listMyPitchesAction();

  return <MyPitchesClient result={result} />;
}
