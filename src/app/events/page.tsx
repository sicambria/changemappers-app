// Events listing page - Server Component
// Fetches events data on the server

import { Suspense } from 'react';
import { EventsPageClient } from '@/components/features/events/EventsPageClient';
import { getEvents } from '@/app/actions/event';

export const revalidate = 60;


export default async function EventsPage() {
    // Fetch enough event history for the client-side time filters to be meaningful.
    const [currentEvents, pastEvents] = await Promise.all([
        getEvents(),
        getEvents({ timeFilter: 'PAST' }),
    ]);
    const events = [...currentEvents, ...pastEvents];

    return (
        <Suspense fallback={<EventsPageSkeleton />}>
            <EventsPageClient initialEvents={events} renderedAt={new Date().toISOString()} />
        </Suspense>
    );
}

function EventsPageSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
            <div className="mb-8">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full max-w-96" />
            </div>
            <div className="flex gap-4 mb-8">
                <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                ))}
            </div>
        </div>
    );
}
