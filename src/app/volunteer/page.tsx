import { Metadata } from 'next';
import { VolunteerBrowseClient } from './VolunteerBrowseClient';
import { getVolunteerOpportunitiesAction } from '@/app/actions/volunteer';
import type { VolunteerOpportunityFilterInput } from '@/lib/validations/volunteer';

export const metadata: Metadata = {
  title: 'Volunteering Hub - Browse Opportunities',
  description: 'Find meaningful volunteer opportunities aligned with your values, skills, and availability.',
};

const initialVolunteerFilters: VolunteerOpportunityFilterInput = {
  page: 1,
  limit: 20,
};

export default async function VolunteerBrowsePage() {
  const result = await getVolunteerOpportunitiesAction(initialVolunteerFilters);
  const initialData = result.success ? result.data : { opportunities: [], total: 0 };

  return (
    <VolunteerBrowseClient
      initialOpportunities={initialData.opportunities}
      initialTotal={initialData.total}
      initialFilters={initialVolunteerFilters}
    />
  );
}
