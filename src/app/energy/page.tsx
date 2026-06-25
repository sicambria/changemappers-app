import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/get-current-user';
import { getEnergyCanvasesAction } from '@/app/actions/energy';
import EnergyListClient from './EnergyListClient';

export const metadata: Metadata = {
  title: 'Power & Energy Flow Canvas | Changemappers',
  description: 'Map power dynamics and energy flows in social systems',
};

export default async function EnergyCanvasListPage() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) {
    redirect('/login');
  }

  const canvases = await getEnergyCanvasesAction();

  return <EnergyListClient canvases={canvases} />;
}
