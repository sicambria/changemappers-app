// Landing page for Changemappers
// Server Component - fetches featured data on server

import { Suspense } from 'react';
import { HomePageClient } from '@/components/features/home/HomePageClient';
import { getFeaturedCommunities } from '@/app/actions/community';
import { getMapEntities } from './actions/map';
import { getRecentUsersAction } from '@/app/actions/user';
import { getUpcomingEventsAction } from '@/app/actions/event';
import { getLocale } from '@/lib/get-locale';
import prisma from '@/lib/prisma';
import { isNextProductionBuildPhase } from '@/lib/build-phase';
import { getHomepageRecentRegisteredUserWhereInput } from '@/lib/public-member-eligibility';

// Homepage SSR renders translated client text, so this HTML depends on the
// current request locale and must not be shared across locale contexts.
export const dynamic = 'force-dynamic';

// Safety net: if any individual fetch hangs, resolve with fallback after ms.
// This prevents a slow Prisma proxy from blocking the entire page render.
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export default async function HomePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let featuredCommunities: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mapEntities: any[] = [];
  let userCount = 0;
  let communityCount = 0;
  let eventCount = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recentUsers: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let upcomingEvents: any[] = [];
  const initialLanguage = await getLocale();
  const now = new Date();

  if (isNextProductionBuildPhase()) {
    return (
      <Suspense fallback={<HomePageSkeleton />}>
        <HomePageClient
          featuredCommunities={featuredCommunities}
          mapEntities={mapEntities}
          recentUsers={recentUsers}
          upcomingEvents={upcomingEvents}
          stats={{
            users: userCount,
            communities: communityCount,
            events: eventCount,
          }}
          initialLanguage={initialLanguage}
        />
      </Suspense>
    );
  }

  try {
    // Run all data fetches in parallel.
    // Each independent fetch has a 5-second safety timeout so one slow
    // Prisma proxy call can never hang the entire page.
    const settled = await Promise.allSettled([
      withTimeout(getFeaturedCommunities(), 5000, []),
      withTimeout(getMapEntities(), 5000, []),  // cached 5min — usually instant
      withTimeout(prisma.user.count({ where: getHomepageRecentRegisteredUserWhereInput() }), 5000, 0),
      withTimeout(prisma.community.count({
        where: {
          deletedAt: null,
          visibility: 'PUBLIC',
          moderationStatus: 'APPROVED',
        },
      }), 5000, 0),
      withTimeout(prisma.event.count({
        where: {
          deletedAt: null,
          moderationStatus: 'APPROVED',
          type: 'PUBLIC',
          status: { in: ['UPCOMING', 'ONGOING'] },
          startDate: { gte: now },
        },
      }), 5000, 0),
      withTimeout(getRecentUsersAction(6), 5000, { success: false, error: 'timeout' }),
      withTimeout(getUpcomingEventsAction(15), 5000, { success: false, error: 'timeout' }),
    ]);
    const [s0, s1, s2, s3, s4, s5, s6] = settled;
    const fetchedFeatured = s0.status === 'fulfilled' ? s0.value : [];
    const fetchedMap = s1.status === 'fulfilled' ? s1.value : [];
    const fetchedUserCount = s2.status === 'fulfilled' ? s2.value : 0;
    const fetchedCommunityCount = s3.status === 'fulfilled' ? s3.value : 0;
    const fetchedEventCount = s4.status === 'fulfilled' ? s4.value : 0;
    const fetchedRecentUsers = s5.status === 'fulfilled' ? s5.value : { success: false, data: [] };
    const fetchedUpcomingEvents = s6.status === 'fulfilled' ? s6.value : { success: false, data: [] };

    featuredCommunities = fetchedFeatured;
    mapEntities = fetchedMap;
    userCount = fetchedUserCount;
    communityCount = fetchedCommunityCount;
    eventCount = fetchedEventCount;
    recentUsers = fetchedRecentUsers?.data || [];
    upcomingEvents = fetchedUpcomingEvents?.data || [];
  } catch (err) {
    console.error('📡 HomePage: Failed to fetch data from DB:', (err as Error).message);
  }

  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <HomePageClient
        featuredCommunities={featuredCommunities}
        mapEntities={mapEntities}
        recentUsers={recentUsers}
        upcomingEvents={upcomingEvents}
        stats={{
          users: userCount,
          communities: communityCount,
          events: eventCount,
        }}
        initialLanguage={initialLanguage}
      />
    </Suspense>
  );
}

function HomePageSkeleton() {
  return (
    <div className="flex flex-col animate-pulse">
      <section className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-emerald-950 dark:to-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mx-auto mb-4" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-1/2 mx-auto mb-6" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mx-auto mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto" />
          </div>
        </div>
      </section>
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
