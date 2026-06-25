// Connections page - Server Component
// Displays user's connections and pending requests

import { Suspense } from 'react';
import { ConnectionsPageClient } from '@/components/features/connections/ConnectionsPageClient';

// Example of future SSR data fetching:
// async function getConnections(userId: string) {
//   return await prisma.connection.findMany({
//     where: { 
//       OR: [
//         { senderId: userId, status: 'ACCEPTED' },
//         { receiverId: userId, status: 'ACCEPTED' }
//       ]
//     },
//     include: { sender: true, receiver: true }
//   });
// }

export default async function ConnectionsPage() {
    // Future: const connections = await getConnections(session.userId);

    return (
        <Suspense fallback={<ConnectionsPageSkeleton />}>
            <ConnectionsPageClient />
        </Suspense>
    );
}

function ConnectionsPageSkeleton() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
            <div className="mb-8">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64" />
            </div>
            <div className="flex gap-4 mb-6">
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                ))}
            </div>
        </div>
    );
}
