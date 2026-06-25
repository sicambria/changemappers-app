export interface FeedPostVisibilitySubject {
  authorId: string;
  visibility: 'PUBLIC' | 'REGISTERED' | 'INTERNAL';
}

interface FeedPostVisibilityFilterSubject {
  authorId?: string | null;
  author?: { id?: string | null } | null;
  visibility: string;
}

function isFeedPostVisibility(value: string): value is FeedPostVisibilitySubject['visibility'] {
  return value === 'PUBLIC' || value === 'REGISTERED' || value === 'INTERNAL';
}

function getAuthorId(post: FeedPostVisibilityFilterSubject): string {
  return post.authorId ?? post.author?.id ?? '';
}

export function canViewFeedPost(
  post: FeedPostVisibilitySubject,
  viewerId: string | null | undefined,
): boolean {
  if (post.visibility === 'PUBLIC') return true;
  if (post.visibility === 'REGISTERED') return Boolean(viewerId);
  if (post.visibility === 'INTERNAL') return Boolean(viewerId) && viewerId === post.authorId;
  return false;
}

export function filterFeedPostsForViewer<T extends FeedPostVisibilityFilterSubject>(
  posts: readonly T[],
  viewerId: string | null | undefined,
): T[] {
  return posts.filter((post) => {
    if (!isFeedPostVisibility(post.visibility)) return false;
    return canViewFeedPost({ authorId: getAuthorId(post), visibility: post.visibility }, viewerId);
  });
}
