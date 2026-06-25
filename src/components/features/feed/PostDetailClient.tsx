'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { getPostBySlugAction } from '@/app/actions/feed';
import { FeedItem } from '@/components/features/feed/FeedItem';
import { Button, Card } from '@/components/ui';
import { ArrowLeftIcon, Loader2 } from 'lucide-react';

interface FeedPost {
  id: string;
  slug: string;
  content: string | null;
  attachments: unknown;
  youtubeLinks: string[];
  sourceType: string;
  visibility: string;

  commentsCount: number;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    displayName: string | null;
    profilePhoto: string | null;
    verificationLevel: string;
    bio?: string | null;
  };
  community: { id: string; name: string } | null;
  _count?: { postReactions: number; comments: number };
  postReactions?: { type: import('@/lib/feed-reactions').FeedReactionType }[];
rdgAnnotations?: import('./FeedAnnotationBadges').FeedRdgAnnotationView[];
tagAnnotations?: import('./FeedAnnotationBadges').FeedTagAnnotationView[];
}

export default function PostDetailClient() {
  const params = useParams();
  const slug = params?.slug as string;
  const { t } = useTranslation(['feed', 'common']);
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }); // §1B: mirror latest t for effects/callbacks below; no deps array on purpose
  const [post, setPost] = useState<FeedPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchPost = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getPostBySlugAction(slug);
        if (result.success && result.data) {
          setPost(result.data as FeedPost);
        } else {
          const errorMsg = result.error ?? tRef.current('errors.notFound');
          setError(errorMsg);
        }
      } catch {
        setError(tRef.current('errors.notFound'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card className="p-8 text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t('errors.notFound')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || 'The post you are looking for does not exist.'}
          </p>
          <Link href="/feed">
            <Button>
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              {t('backToFeed')}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Link
        href="/feed"
        className="inline-flex items-center text-sm text-gray-500 hover:text-emerald-600 mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        {t('backToFeed')}
      </Link>

      <FeedItem post={post} showComments />
    </div>
  );
}
