// Communities listing page - Server Component
// Fetches the community directory on the server, audience-gated.

import { Suspense } from 'react';
import { getCommunityDirectory } from '@/app/actions/community';
import { CommunitiesPageClient } from '@/components/features/communities/CommunitiesPageClient';

export default function CommunitiesPage() {
    return (
        <Suspense fallback={<CommunitiesPageSkeleton />}>
            <CommunitiesDirectory />
        </Suspense>
    );
}

async function CommunitiesDirectory() {
    // Errors propagate to src/app/communities/error.tsx by design —
    // a fetch failure must not render as an empty directory.
    const communities = await getCommunityDirectory();

    return <CommunitiesPageClient communities={communities} />;
}

function CommunitiesPageSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
            <div className="mb-8">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full max-w-96" />
            </div>
            <div className="flex gap-4 mb-8">
                <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                ))}
            </div>
        </div>
    );
}
