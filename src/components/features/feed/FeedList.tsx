'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getFeedAction } from '@/app/actions/feed';
import { useAuth } from '@/components/providers/AuthProvider';
import { filterFeedPostsForViewer } from '@/lib/feed-visibility';
import { FeedItem } from './FeedItem';
// Removed unused Button import
import { PostSource, PostVisibility } from '@/types/feed';
import { Loader2 } from 'lucide-react';

interface FeedUser {
  id: string;
  name: string;
  displayName: string | null;
  profilePhoto: string | null;
  verificationLevel: string;
}

export interface FeedPost {
id: string;
slug: string;
content: string | null;
visibility: string;
sourceType: string;
youtubeLinks: string[];

commentsCount: number;
createdAt: Date;
author: FeedUser;
community: { id: string; name: string } | null;
_count: { comments: number; postReactions: number };
postReactions: { type: import('@/lib/feed-reactions').FeedReactionType }[];
rdgAnnotations?: import('./FeedAnnotationBadges').FeedRdgAnnotationView[];
tagAnnotations?: import('./FeedAnnotationBadges').FeedTagAnnotationView[];
}

interface FeedListProps {
  initialPosts?: FeedPost[];
  initialNextCursor?: string | null;
  sourceType?: PostSource;
  visibility?: PostVisibility;
  communityId?: string;
  authorId?: string;
  showFilters?: boolean;
  /** Increment to trigger a full reload (e.g. after a new post is created) */
  refreshSignal?: number;
}

export function FeedList({
  initialPosts = [],
  initialNextCursor = null,
  sourceType,
  visibility,
  communityId,
  authorId,
  showFilters = true,
  refreshSignal = 0,
}: Readonly<FeedListProps>) {
  const { t } = useTranslation('feed');
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialNextCursor !== null || initialPosts.length === 0);
  const [selectedSource, setSelectedSource] = useState<PostSource | undefined>(sourceType);
  const [selectedVisibility, setSelectedVisibility] = useState<PostVisibility | undefined>(visibility);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  // Use refs for values that should not recreate `loadPosts` on change
  const cursorRef = useRef<string | null>(initialNextCursor);
  const isLoadingRef = useRef(false);

  const mergeUniquePosts = (existingPosts: FeedPost[], incomingPosts: FeedPost[]) => {
    const seenIds = new Set(existingPosts.map((post) => post.id));
    const uniqueIncomingPosts = incomingPosts.filter((post) => !seenIds.has(post.id));
    return [...existingPosts, ...uniqueIncomingPosts];
  };

  const loadPosts = useCallback(async (reset = false) => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const result = await getFeedAction({
        sourceType: selectedSource,
        visibility: selectedVisibility,
        communityId,
        authorId,
        cursor: reset ? undefined : cursorRef.current ?? undefined,
        limit: 20,
      });

      if (result.success && result.data) {
        const visiblePosts = filterFeedPostsForViewer(result.data.posts, user?.id ?? null);
        if (reset) {
          setPosts(visiblePosts);
        } else {
          setPosts((prev) => mergeUniquePosts(prev, visiblePosts));
        }
        cursorRef.current = result.data.nextCursor;
        setHasMore(result.data.nextCursor !== null);
      }
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [selectedSource, selectedVisibility, communityId, authorId, user?.id]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadPosts();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [hasMore, isLoading, loadPosts]);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    cursorRef.current = null;
    setPosts([]);
    setHasMore(true);
    loadPosts(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSource, selectedVisibility]);

  // Authenticated personalization after public-only SSR.
  // /feed is a public mixed route whose SSR initial props are deliberately
  // rendered anonymous/public-only and fail-closed (the cached SSR HTML is not a
  // safe per-viewer privacy boundary — see
  // docs/errors/2026-05/20260528-feed-registered-post-anonymous-visible-local-fallback.md).
  // Once the auth context resolves an authenticated viewer, refetch through the
  // authenticated action boundary (where client cookies are present) so the viewer
  // sees REGISTERED/INTERNAL posts and their own reactions after a reload. Runs once
  // per resolved viewer; anonymous visitors keep the public-only SSR view.
  // RCA: docs/errors/2026-06/20260613-feed-ssr-reactions-lost-on-reload.md
  // Fetched silently (no loading spinner / no list-clear) and independent of the
  // isLoadingRef pagination latch, so it never flashes an empty feed and never
  // swallows / is swallowed by a concurrent create-refresh or scroll load — that
  // churn destabilised interactions immediately after a reload under load.
  const personalizedForUser = useRef<string | null>(null);
  useEffect(() => {
    const viewerId = user?.id;
    if (!viewerId) return;
    if (personalizedForUser.current === viewerId) return;
    personalizedForUser.current = viewerId;
    let cancelled = false;
    void (async () => {
      const result = await getFeedAction({
        sourceType: selectedSource,
        visibility: selectedVisibility,
        communityId,
        authorId,
        limit: 20,
      });
      if (cancelled || !result.success || !result.data) return;
      const visiblePosts = filterFeedPostsForViewer(result.data.posts, viewerId);
      setPosts(visiblePosts);
      cursorRef.current = result.data.nextCursor;
      setHasMore(result.data.nextCursor !== null);
    })();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Reload feed when a new post is created (refreshSignal incremented by parent)
  const prevRefreshSignal = useRef(refreshSignal);
  useEffect(() => {
    if (refreshSignal === prevRefreshSignal.current) return;
    prevRefreshSignal.current = refreshSignal;
    cursorRef.current = null;
    loadPosts(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  // Stable identity so the memoized FeedItem doesn't re-render unchanged items
  // on every FeedList state update (AUDIT-20260613-016).
  const handlePostDeleted = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={selectedSource ?? ''}
            onChange={(e) => setSelectedSource(e.target.value ? (e.target.value as PostSource) : undefined)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="">{t('filters.allSources')}</option>
            <option value={PostSource.USER}>{t('post.sourcePersonal')}</option>
            <option value={PostSource.COMMUNITY}>{t('post.sourceCommunity')}</option>
            <option value={PostSource.EVENT}>{t('post.sourceEvent')}</option>
            <option value={PostSource.RSS}>{t('rss.sourceLabel')}</option>
          </select>
          <select
            value={selectedVisibility ?? ''}
            onChange={(e) => setSelectedVisibility(e.target.value ? (e.target.value as PostVisibility) : undefined)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="">{t('filters.allVisibility')}</option>
            <option value={PostVisibility.PUBLIC}>{t('post.visibilityPublic')}</option>
            <option value={PostVisibility.REGISTERED}>{t('post.visibilityRegistered')}</option>
            <option value={PostVisibility.INTERNAL}>{t('post.visibilityInternal')}</option>
          </select>
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <FeedItem key={post.id} post={post} onDeleted={handlePostDeleted} />
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      )}

      <div ref={loadMoreRef} className="h-10" />

      {!isLoading && !hasMore && posts.length > 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
          {t('empty.noMore')}
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          {t('empty.title')}. {t('empty.description')}
        </div>
      )}
    </div>
  );
}
