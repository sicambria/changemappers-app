import { getCanvasesAction } from '@/app/actions/canvas-queries';
import DrawingBoardListClient from '@/components/features/canvas/DrawingBoardListClient';

export const revalidate = 60;

export default async function DrawingBoardListPage() {
  const canvases = await getCanvasesAction();

  return <DrawingBoardListClient canvases={canvases} />;
}
