import { getBacklogAction } from '@/app/actions/coordinate';
import BacklogClient from './BacklogClient';

export const revalidate = 60;

export default async function BacklogPage() {
  const items = await getBacklogAction();

  return <BacklogClient items={items} />;
}
