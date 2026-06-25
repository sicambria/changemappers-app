import { listPitchesAction } from '@/app/actions/pitch';
import PitchBrowseClient from './PitchBrowseClient';

export const revalidate = 60;

export default async function PitchBrowsePage() {
  const result = await listPitchesAction();

  return <PitchBrowseClient result={result} />;
}
