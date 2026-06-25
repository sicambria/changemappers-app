import { getInitiativesAction } from '@/app/actions/coordinate';
import KanbanBoardClient from './KanbanBoardClient';

export const revalidate = 60;

export default async function CoordinatePage() {
  const initiatives = await getInitiativesAction();

  return <KanbanBoardClient initiatives={initiatives} />;
}
