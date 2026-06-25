'use client';

import { useState } from 'react';
import { FeedList } from '@/components/features/feed/FeedList';
import { PostCreator } from '@/components/features/feed/PostCreator';
import { useAuth } from '@/components/providers/AuthProvider';
import { FeedReactionsOnboarding } from './FeedReactionsOnboarding';

type FeedPostFromSelect = {
id: string;
slug: string;
content: string | null;
visibility: string;
sourceType: string;
youtubeLinks: string[];

commentsCount: number;
createdAt: Date;
author: {
id: string;
name: string;
displayName: string | null;
profilePhoto: string | null;
verificationLevel: string;
};
community: { id: string; name: string } | null;
_count: { comments: number; postReactions: number };
postReactions: { type: import('@/lib/feed-reactions').FeedReactionType }[];
rdgAnnotations?: import('./FeedAnnotationBadges').FeedRdgAnnotationView[];
tagAnnotations?: import('./FeedAnnotationBadges').FeedTagAnnotationView[];
};

export default function FeedPageClient({
  initialPosts = [],
  initialNextCursor = null,
}: Readonly<{
  initialPosts?: FeedPostFromSelect[];
  initialNextCursor?: string | null;
}>) {
  const { user } = useAuth();
  const [refreshSignal, setRefreshSignal] = useState(0);

  return (
    <div className="container mx-auto px-4 pt-6 pb-12 max-w-2xl">
      <FeedReactionsOnboarding userId={user?.id} />
      {user && (
        <div className="mb-3">
          <PostCreator onSuccess={() => setRefreshSignal((s) => s + 1)} />
        </div>
      )}

      <FeedList
        showFilters
        initialPosts={initialPosts}
        initialNextCursor={initialNextCursor}
        refreshSignal={refreshSignal}
      />
    </div>
  );
}
