import { Metadata } from 'next';
import { getEnergyPatternLibraryAction } from '@/app/actions/energy/pattern';
import EnergyPatternLibraryClient from './EnergyPatternLibraryClient';

export const metadata: Metadata = {
  title: 'Pattern Library | Energy Canvas',
};

export default async function EnergyPatternLibraryPage() {
  const patterns = await getEnergyPatternLibraryAction();

  return <EnergyPatternLibraryClient patterns={patterns} />;
}
