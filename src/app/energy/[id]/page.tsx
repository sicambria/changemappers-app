import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/get-current-user';
import { getEnergyCanvasAction } from '@/app/actions/energy';
import { EnergyCanvasPageClient } from '@/components/features/energy/EnergyCanvasPageClient';

interface EnergyCanvasPageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Energy Canvas | Changemappers',
};

export default async function EnergyCanvasPage({ params }: Readonly<EnergyCanvasPageProps>) {
  const { id } = await params;
  const auth = await getCurrentUser();

  if (!auth.success || !auth.data) {
    redirect('/login');
  }

  const canvas = await getEnergyCanvasAction(id);

  if (!canvas) {
    notFound();
  }

  const isOwner = canvas.createdBy.id === auth.data.id;

  return (
    <EnergyCanvasPageClient
      canvas={canvas}
      isOwner={isOwner}
    />
  );
}
