import { getCanvasAction } from '@/app/actions/canvas-queries';
import { getCurrentUser } from '@/lib/get-current-user';
import DiagramDetailClient from '@/components/features/canvas/DiagramDetailClient';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const canvas = await getCanvasAction(id);
  return { title: canvas ? `${canvas.title} | Drawing Board` : 'Drawing Board' };
}

export const dynamic = 'force-dynamic';

export default async function DrawingBoardDetailPage({ params }: Readonly<Props>) {
  const { id } = await params;
  const [canvas, auth] = await Promise.all([
    getCanvasAction(id),
    getCurrentUser(),
  ]);

  if (!canvas) {
    notFound();
  }

  const isOwner = auth.success && auth.data && canvas.createdBy.id === auth.data.id;

  return (
    <DiagramDetailClient
      canvas={canvas}
      isOwner={!!isOwner}
    />
  );
}
