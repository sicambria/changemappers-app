import { getMyGrowthConnectionsAction } from '@/app/actions/growth-hub';
import { GrowthConnectionsClient } from './GrowthConnectionsClient';

export default async function GrowthConnectionsPage() {
  const connections = await getMyGrowthConnectionsAction();

  return <GrowthConnectionsClient initialConnections={connections} />;
}
