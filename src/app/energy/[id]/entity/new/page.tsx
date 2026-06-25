import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/get-current-user';
import { getEnergyCanvasAction } from '@/app/actions/energy';
import NewEntityClient from './NewEntityClient';

interface NewEntityPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Add Entity | Energy Canvas',
};

export default async function NewEntityPage({ params }: Readonly<NewEntityPageProps>) {
  const { id: canvasId } = await params;
  const auth = await getCurrentUser();

  if (!auth.success || !auth.data) {
    redirect('/login');
  }

  const canvas = await getEnergyCanvasAction(canvasId);
  if (!canvas) {
    notFound();
  }

  return <NewEntityClient canvasId={canvasId} canvasTitle={canvas.title} />;
}
