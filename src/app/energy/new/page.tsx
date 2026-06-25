import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/get-current-user';
import NewEnergyCanvasClient from './NewEnergyCanvasClient';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

export const metadata: Metadata = {
  title: 'New Energy Canvas | Changemappers',
};

export default async function NewEnergyCanvasPage() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) {
    redirect('/login');
  }

  return <ErrorBoundary componentName="NewEnergyCanvas"><NewEnergyCanvasClient /></ErrorBoundary>;
}
