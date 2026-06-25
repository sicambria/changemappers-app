import { getMapEntities } from '@/app/actions/map';
import { getEvents } from '@/app/actions/event';
import { getFeedAction } from '@/app/actions/feed';
import { getCurrentUserData } from '@/lib/get-current-user';
import { PlanetViewerClient } from '@/components/planet/PlanetViewerClient';
import { getServerTranslation } from '@/lib/server-i18n';
import { filterFeedPostsForViewer } from '@/lib/feed-visibility';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

export async function generateMetadata() {
  const { t } = await getServerTranslation('common');
  return {
    title: `${t('planet.metaTitle')} | Changemappers`,
    description: t('planet.metaDescription'),
  };
}

// Next.js 15 requires force-dynamic for auth() but we can also use dynamic = 'force-dynamic'
export const dynamic = 'force-dynamic';

export default async function PlanetPage() {
    // Parallel fetch: all markers + current user's coordinates
    // getCurrentUserData already fetches latitude/longitude — no second DB hit needed
    const [userSettled, mapSettled, feedSettled, eventsSettled] = await Promise.allSettled([
        getCurrentUserData(),
        getMapEntities(),
        getFeedAction({ limit: 10 }),
        getEvents({ startDate: new Date() }),
    ]);
    const userResult = userSettled.status === 'fulfilled' ? userSettled.value : null;
    const mapEntities = mapSettled.status === 'fulfilled' ? mapSettled.value : [];
    const feedResult = feedSettled.status === 'fulfilled' ? feedSettled.value : null;
    const events = eventsSettled.status === 'fulfilled' ? eventsSettled.value : [];
    const initialFeedPosts = feedResult?.success && feedResult.data
        ? filterFeedPostsForViewer(feedResult.data.posts, null)
        : [];
    const initialFeedNextCursor = feedResult?.success && feedResult.data ? feedResult.data.nextCursor : null;

    const userData = userResult?.data?.user;
    const userLocation = (userData?.latitude && userData?.longitude)
        ? { lat: userData.latitude, lng: userData.longitude }
        : null;

    return (
        <div className="relative h-full w-full overflow-hidden bg-black">
            <ErrorBoundary componentName="PlanetViewer">
                <PlanetViewerClient
                    entities={mapEntities}
                    userLocation={userLocation}
                    initialFeedPosts={initialFeedPosts}
                    initialFeedNextCursor={initialFeedNextCursor}
                    initialEvents={events}
                />
            </ErrorBoundary>
        </div>
    );
}
