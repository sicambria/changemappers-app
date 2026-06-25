'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { FeedList, type FeedPost } from '@/components/features/feed/FeedList';
import { EventCard } from '@/components/features/events/EventCard';

export type PlanetEvent = React.ComponentProps<typeof EventCard>['event'];
export type PlanetSidePanel = 'feed' | 'events';

export function PlanetFeedSidebar({
    posts,
    nextCursor,
    onClose,
}: Readonly<{
    posts: FeedPost[];
    nextCursor: string | null;
    onClose: () => void;
}>) {
    const { t } = useTranslation('map');

    return (
        <aside
            className="absolute bottom-0 right-0 top-0 z-20 flex w-full max-w-md flex-col overflow-hidden border-l border-white/15 bg-white shadow-2xl pointer-events-auto dark:bg-slate-950 sm:right-4 sm:top-4 sm:bottom-4 sm:rounded-lg sm:border"
            data-testid="planet-feed-sidebar"
        >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-950 px-4 py-3 text-white dark:border-white/10">
                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-sky-200">{t('planet.feedPanelKicker')}</p>
                    <h2 className="truncate text-lg font-semibold">{t('planet.feedPanelTitle')}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/feed" className="rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20">
                        {t('planet.openFullFeed')}
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label={t('planet.closeSidebar')}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <FeedList initialPosts={posts} initialNextCursor={nextCursor} showFilters={false} />
            </div>
        </aside>
    );
}

export function PlanetEventsSidebar({ events, onClose }: Readonly<{ events: PlanetEvent[]; onClose: () => void }>) {
    const { t } = useTranslation('map');

    return (
        <aside
            className="absolute bottom-0 right-0 top-0 z-20 flex w-full max-w-md flex-col overflow-hidden border-l border-white/15 bg-white shadow-2xl pointer-events-auto dark:bg-slate-950 sm:right-4 sm:top-4 sm:bottom-4 sm:rounded-lg sm:border"
            data-testid="planet-events-sidebar"
        >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-950 px-4 py-3 text-white dark:border-white/10">
                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-emerald-200">{t('planet.eventsPanelKicker')}</p>
                    <h2 className="truncate text-lg font-semibold">{t('planet.eventsPanelTitle')}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/events" className="rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20">
                        {t('planet.openFullEvents')}
                    </Link>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label={t('planet.closeSidebar')}
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {events.length > 0 ? (
                    events.map((event) => <EventCard key={event.id} event={event} compact />)
                ) : (
                    <p className="py-8 text-center text-sm text-slate-500 dark:text-white/55">{t('planet.eventsEmpty')}</p>
                )}
            </div>
        </aside>
    );
}
