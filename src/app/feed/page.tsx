import FeedPageClient from '@/components/features/feed/FeedPageClient';
import { getServerTranslation } from '@/lib/server-i18n';
import { getFeedAction } from '@/app/actions/feed';
import { filterFeedPostsForViewer } from '@/lib/feed-visibility';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const { t } = await getServerTranslation('feed');
  return {
    title: `${t('title')} | Changemappers`,
    description: t('description'),
  };
}

export default async function FeedPage() {
  const feedResult = await getFeedAction({ limit: 20 });
  const initialPosts = feedResult.success && feedResult.data
    ? filterFeedPostsForViewer(feedResult.data.posts, null)
    : [];
  const initialNextCursor = feedResult.success && feedResult.data ? feedResult.data.nextCursor : null;

  return <FeedPageClient initialPosts={initialPosts} initialNextCursor={initialNextCursor} />;
}
