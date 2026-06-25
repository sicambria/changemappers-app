import { getContributionOffersAction } from '@/app/actions/contribute';
import FindOffersPageClient from './FindOffersPageClient';

export const revalidate = 60;

export default async function FindOffersPage() {
  const offers = await getContributionOffersAction();
  return <FindOffersPageClient offers={offers} />;
}
