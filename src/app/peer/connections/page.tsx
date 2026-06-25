import { getMyPeerSupportConnectionsAction } from '@/app/actions/peer';
import ProfessionalSupportBanner from '@/components/features/peer/ProfessionalSupportBanner';
import PeerConnectionsClient from './PeerConnectionsClient';

export const dynamic = 'force-dynamic';

export default async function MyPeerSupportConnectionsPage() {
  const connections = await getMyPeerSupportConnectionsAction();

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-10">
      <div className="max-w-3xl mx-auto mb-2">
        <ProfessionalSupportBanner />
      </div>
      <PeerConnectionsClient connections={connections} />
    </main>
  );
}
