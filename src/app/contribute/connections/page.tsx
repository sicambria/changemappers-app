import { getMyContributionConnectionsAction } from '@/app/actions/contribute';
import ConnectionsPageClient from './ConnectionsPageClient';

export const dynamic = 'force-dynamic';

export default async function ConnectionsPage() {
  const connections = await getMyContributionConnectionsAction();
  return <ConnectionsPageClient connections={connections} />;
}
