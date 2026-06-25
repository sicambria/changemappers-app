import ContributePageClient from './ContributePageClient';
import { getVolunteerOpportunitiesAction } from '@/app/actions/volunteer';
import type { VolunteerOpportunityFilterInput } from '@/lib/validations/volunteer';

export const revalidate = 60;

const initialVolunteerFilters: VolunteerOpportunityFilterInput = {
  page: 1,
  limit: 6,
};

export default async function ContributePage() {
  const volunteerResult = await getVolunteerOpportunitiesAction(initialVolunteerFilters);
  const initialVolunteerData = volunteerResult.success
    ? volunteerResult.data
    : { opportunities: [], total: 0 };

  return (
    <ContributePageClient
      initialVolunteerOpportunities={initialVolunteerData.opportunities}
      initialVolunteerTotal={initialVolunteerData.total}
      initialVolunteerFilters={initialVolunteerFilters}
    />
  );
}
