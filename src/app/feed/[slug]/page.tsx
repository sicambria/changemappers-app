import { Metadata } from 'next';
import PostDetailClient from '@/components/features/feed/PostDetailClient';
import { getPostBySlugAction } from '@/app/actions/feed/post';
import { createSocialMetadata } from '@/lib/metadata/social';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const postResult = await getPostBySlugAction(slug);
  const description = postResult.success && postResult.data && typeof postResult.data === 'object' && 'content' in postResult.data
    ? 'View this public post on Changemappers'
    : 'View this post on Changemappers';

  return createSocialMetadata({
    title: 'Post | Changemappers',
    description,
    path: `/feed/${slug}`,
    type: 'article',
  });
}

export default function PostDetailPage() {
  return <PostDetailClient />;
}
