'use client';

import { memo, useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui';
import { VerificationBadge } from '@/components/profile/VerificationBadge';
import { UserHoverCard } from './UserHoverCard';
import { CommentSection } from './CommentSection';
import { deletePostAction, saveFeedPostAuthorAnnotationsAction, saveFeedPostViewerAnnotationsAction, updatePostAction } from '@/app/actions/feed';
import { UserAvatar } from './UserAvatar';
import { FeedReactionTray } from './FeedReactionTray';
import { FeedAnnotationBadges, type FeedRdgAnnotationView, type FeedTagAnnotationView } from './FeedAnnotationBadges';
import { FeedAnnotationPicker } from './FeedAnnotationPicker';
import { useAuth } from '@/components/providers/AuthProvider';
import { getEmbedUrl, getPlatformFromEmbedUrl } from '@/lib/video-platforms';
import type { VerificationLevel } from '@/lib/prisma-shared';
import { PostVisibility, PostSource } from '@/types/feed';
import {
  MessageCircleIcon, ShareIcon, MoreHorizontalIcon, TagIcon,
  Trash2Icon, GlobeIcon, UsersIcon, LockIcon, ChevronRightIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import DOMPurify from 'isomorphic-dompurify';

interface FeedUser {
  id: string;
  name: string;
  displayName: string | null;
  profilePhoto: string | null;
  verificationLevel: string;
}

interface FeedPost {
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
_count?: { postReactions: number; comments: number };
postReactions?: { type: import('@/lib/feed-reactions').FeedReactionType }[];
rdgAnnotations?: FeedRdgAnnotationView[];
tagAnnotations?: FeedTagAnnotationView[];
}

interface FeedItemProps {
  post: FeedPost;
  showComments?: boolean;
  onDeleted?: (postId: string) => void;
}

const READ_MORE_HEIGHT = 140; // px — content taller than this gets truncated

// Memoized: FeedList re-renders the whole posts array on every infinite-scroll
// append/delete/refresh; unchanged items must not re-render (and re-sanitize
// their HTML) for those updates (AUDIT-20260613-016). Props are shallow-stable:
// `post` object identity is preserved by mergeUniquePosts/filterFeedPostsForViewer,
// `showComments` is a primitive, and `onDeleted` is a useCallback in FeedList.
export const FeedItem = memo(function FeedItem({ post, showComments = false, onDeleted }: FeedItemProps) {
  const { t } = useTranslation(['feed', 'common']);
  const { user } = useAuth();
  const [showCommentSection, setShowCommentSection] = useState(showComments);

  // Read-more
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsReadMore, setNeedsReadMore] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Strip empty video-embed-block wrappers left by the pre-fix sanitize-html config.
  // Legacy posts had their <iframe> stripped but kept the bg-black wrapper div → black box.
  const processedContent = useMemo(
    () => post.content?.replaceAll(/<div[^>]*\bvideo-embed-block\b[^>]*>\s*<\/div>/g, '') ?? '',
    [post.content],
  );

  // Render-time sanitization stays (defense-in-depth XSS protection), but the
  // DOMPurify DOM-parsing pass only reruns when the content actually changes
  // instead of on every re-render (AUDIT-20260613-016).
  const safeContent = useMemo(() => DOMPurify.sanitize(processedContent), [processedContent]);

  // 3-dots menu
  const [showMenu, setShowMenu] = useState(false);
  const [showVisibilitySubmenu, setShowVisibilitySubmenu] = useState(false);
  const [currentVisibility, setCurrentVisibility] = useState(post.visibility);
  const menuRef = useRef<HTMLDivElement>(null);

  const userId = user?.id ?? null;
  const isOwner = userId === post.author.id;
  const annotationSource = isOwner ? 'AUTHOR' : 'VIEWER';
  const ownRdgSlugs = (post.rdgAnnotations ?? [])
    .filter((annotation) => annotation.source === annotationSource && annotation.userId === userId)
    .map((annotation) => annotation.rdgSlug);
  const ownTagKeys = (post.tagAnnotations ?? [])
    .filter((annotation) => annotation.source === annotationSource && annotation.userId === userId)
    .map((annotation) => annotation.tagKey);
  const authorHasRdgs = (post.rdgAnnotations ?? []).some((annotation) => annotation.source === 'AUTHOR');
  const authorHasTags = (post.tagAnnotations ?? []).some((annotation) => annotation.source === 'AUTHOR');
  const [showAnnotationEditor, setShowAnnotationEditor] = useState(false);
  const [selectedRdgSlugs, setSelectedRdgSlugs] = useState<string[]>(ownRdgSlugs);
  const [selectedTagKeys, setSelectedTagKeys] = useState<string[]>(ownTagKeys);
  const [savingAnnotations, setSavingAnnotations] = useState(false);
  const createdAtTime = new Date(post.createdAt).getTime();
  const fallbackTimeLabel = new Date(createdAtTime).toISOString();
  const [timeAgo, setTimeAgo] = useState(fallbackTimeLabel);

  useEffect(() => {
    const el = contentRef.current;
    if ((el?.scrollHeight ?? 0) > READ_MORE_HEIGHT + 10) {
      setNeedsReadMore(true);
    }
  }, [post.content]);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
        setShowVisibilitySubmenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  useEffect(() => {
    setTimeAgo(formatDistanceToNow(createdAtTime, { addSuffix: true }));
  }, [createdAtTime]);


  const handleSaveAnnotations = async () => {
    if (!user || savingAnnotations) return;
    setSavingAnnotations(true);
    const result = isOwner
      ? await saveFeedPostAuthorAnnotationsAction(post.id, selectedRdgSlugs, selectedTagKeys)
      : await saveFeedPostViewerAnnotationsAction(post.id, selectedRdgSlugs, selectedTagKeys);
    if (result.success) {
      toast.success(t('annotations.saved', 'Annotations saved'));
      setShowAnnotationEditor(false);
    } else {
      toast.error(result.error || t('annotations.saveFailed', 'Could not save annotations'));
    }
    setSavingAnnotations(false);
  };

  const handleShare = async () => {
    const url = `${globalThis.location.origin}/feed/${post.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: t('share.title', 'Share'), url });
      } catch {
        await navigator.clipboard.writeText(url);
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(t('share.linkCopiedShort', 'Link copied'));
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('post.deleteConfirm', 'Are you sure you want to delete this post?'))) return;
    const result = await deletePostAction(post.id);
    if (result.success) {
      toast.success(t('post.deleteSuccess', 'Post deleted'));
      onDeleted?.(post.id);
    } else {
      toast.error(result.error || t('post.deleteError', 'Could not delete post'));
    }
    setShowMenu(false);
  };

  const handleChangeVisibility = async (v: PostVisibility) => {
    const result = await updatePostAction({
      postId: post.id,
      content: post.content ?? '',
      visibility: v,
      sourceType: post.sourceType as PostSource,
      rdgSlugs: ownRdgSlugs,
      tagKeys: ownTagKeys,
    });
    if (result.success) {
      setCurrentVisibility(v);
      toast.success(t('post.updateVisibilitySuccess', 'Visibility updated'));
    } else {
      toast.error(result.error || t('post.updateVisibilityError', 'Could not update visibility'));
    }
    setShowMenu(false);
    setShowVisibilitySubmenu(false);
  };

  const sourceBadge: Record<string, React.ReactNode> = {
    USER: null,
    COMMUNITY: post.community ? (
      <span className="text-xs text-emerald-600 dark:text-emerald-400">{t('author.in')} {post.community.name}</span>
    ) : null,
    EVENT: <span className="text-xs text-blue-600 dark:text-blue-400">{t('post.sourceEvent', 'Event')}</span>,
    RSS: <span className="text-xs text-purple-600 dark:text-purple-400">{t('rss.sourceLabel', 'External')}</span>,
  };

  const visibilityLabel: Record<string, { icon: React.ReactNode; label: string }> = {
    PUBLIC: { icon: <GlobeIcon className="w-3.5 h-3.5" />, label: t('post.visibilityPublic', 'Public') },
    REGISTERED: { icon: <UsersIcon className="w-3.5 h-3.5" />, label: t('post.visibilityRegistered', 'Members') },
    INTERNAL: { icon: <LockIcon className="w-3.5 h-3.5" />, label: t('post.visibilityInternal', 'Internal') },
  };

  return (
    <Card className="p-4 space-y-3" data-testid="feed-item">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <UserHoverCard user={post.author}>
            <Link href={`/profile/${post.author.id}`}>
              <UserAvatar
                src={post.author.profilePhoto}
                alt={post.author.displayName || post.author.name}
                size="md"
                className="cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all"
              />
            </Link>
          </UserHoverCard>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href={`/profile/${post.author.id}`}
                className="font-medium hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                {post.author.displayName || post.author.name}
              </Link>
              <VerificationBadge level={post.author.verificationLevel as VerificationLevel} size={14} />
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Link href={`/feed/${post.slug}`} className="hover:text-emerald-600" title={fallbackTimeLabel}>
                {timeAgo}
              </Link>
              {sourceBadge[post.sourceType]}
              {visibilityLabel[currentVisibility] && currentVisibility !== 'PUBLIC' && (
                <span data-testid="post-visibility-badge" className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-[10px] font-medium">
                  {visibilityLabel[currentVisibility]?.icon}
                  {visibilityLabel[currentVisibility]?.label}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3-dots menu */}
        <div className="relative" ref={menuRef}>
          <button
            data-testid="post-options-button"
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500"
            aria-label={t('post.moreOptions', 'More options')}
            onClick={() => { setShowMenu(!showMenu); setShowVisibilitySubmenu(false); }}
          >
            <MoreHorizontalIcon className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1.5 z-20 min-w-[180px]">
              {/* Owner-only actions */}
              {isOwner && (
                <>
                  {/* Change visibility submenu */}
                  <div className="relative">
                    <button
                      data-testid="post-change-visibility-button"
                      onClick={() => setShowVisibilitySubmenu(!showVisibilitySubmenu)}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-50 dark:border-gray-800/50"
                    >
                      <LockIcon className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 text-left">{t('post.changeVisibility', 'Change Visibility')}</span>
                      <ChevronRightIcon className={`w-4 h-4 text-gray-300 transition-transform ${showVisibilitySubmenu ? 'rotate-90' : ''}`} />
                    </button>
                    {showVisibilitySubmenu && (
                      <div className="absolute right-full top-0 mr-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1.5 min-w-[150px]">
                        {(Object.values(PostVisibility) as PostVisibility[]).map((v) => (
                          <button
                            key={v}
                            data-testid={`post-visibility-option-${v}`}
                            onClick={() => handleChangeVisibility(v)}
                            className={`flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                              currentVisibility === v
                                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {visibilityLabel[v]?.icon}
                            {visibilityLabel[v]?.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="my-1 border-t border-gray-100 dark:border-gray-800" />

                  <button
                    data-testid="post-delete-button"
                    onClick={handleDelete}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <Trash2Icon className="w-4 h-4" />
                    {t('post.delete', 'Delete')}
                  </button>
                </>
              )}

              {/* Anyone */}
              <button
                onClick={() => { handleShare(); setShowMenu(false); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
                {t('share.copyLink', 'Copy Link')}
              </button>
            </div>
          )}
        </div>
      </div>

{/* Content with read-more */}
{processedContent && (
<div className="relative">
{/* Render-time sanitization ensuring total XSS protection even against stored payloads */}
<div
ref={contentRef}
className="prose prose-sm dark:prose-invert max-w-none overflow-hidden transition-all"
style={needsReadMore && !isExpanded ? { maxHeight: READ_MORE_HEIGHT, overflow: 'hidden' } : undefined}
// SAFE: Content is sanitized using isomorphic-dompurify before render (memoized on content)
dangerouslySetInnerHTML={{ __html: safeContent }}
/>
          {needsReadMore && !isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
          )}
          {needsReadMore && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {isExpanded ? t('post.showLess') : t('post.readMore')}
            </button>
          )}
        </div>
      )}

      {/* Video embeds (YouTube, Vimeo, Dailymotion, Wistia, Odysee, Archive, PeerTube, Wikimedia) */}
      {post.youtubeLinks?.length > 0 && (
        <div className="space-y-3">
          {post.youtubeLinks.map((stored) => {
            const embedUrl = getEmbedUrl(stored);
            const platform = getPlatformFromEmbedUrl(embedUrl);
            // Wikimedia Commons serves raw video files — use <video> instead of <iframe>
            if (platform === 'wikimedia') {
              return (
                <div key={stored} className="rounded-lg overflow-hidden bg-black">
                  <video
                    controls
                    className="w-full max-h-[360px]"
                    preload="metadata"
                  >
                    <source src={embedUrl} />
                    <a
                      href={embedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-500 underline p-4 block"
                    >
                      {t('post.watchOnWikimedia')}
                    </a>
                  </video>
                </div>
              );
            }
            return (
              <div key={stored} className="aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  title={platform}
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            );
          })}
        </div>
      )}

      <FeedAnnotationBadges rdgAnnotations={post.rdgAnnotations} tagAnnotations={post.tagAnnotations} />

      {user && showAnnotationEditor && (
        <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700" data-testid="feed-annotation-editor">
          <FeedAnnotationPicker
            rdgSlugs={selectedRdgSlugs}
            tagKeys={selectedTagKeys}
            onRdgSlugsChange={setSelectedRdgSlugs}
            onTagKeysChange={setSelectedTagKeys}
            rdgLocked={!isOwner && authorHasRdgs}
            tagsLocked={!isOwner && authorHasTags}
            compact
          />
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowAnnotationEditor(false)} className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
              {t('common:actions.cancel', 'Cancel')}
            </button>
            <button type="button" disabled={savingAnnotations} onClick={() => void handleSaveAnnotations()} className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
              {savingAnnotations ? t('common:actions.loading', 'Saving...') : t('common:actions.save', 'Save')}
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1">
        <FeedReactionTray target="post" targetId={post.id} initialReactions={post.postReactions} />

        <button
          data-testid="post-comments-toggle"
          onClick={() => setShowCommentSection(!showCommentSection)}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 transition-colors"
        >
          <MessageCircleIcon className="w-4 h-4" />
          <span>{post.commentsCount || post._count?.comments || 0}</span>
        </button>

        {user && (
          <button
            type="button"
            data-testid="post-annotation-toggle"
            onClick={() => setShowAnnotationEditor((value) => !value)}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 transition-colors"
          >
            <TagIcon className="w-4 h-4" />
            <span>{t('annotations.annotate', 'Annotate')}</span>
          </button>
        )}

        <button
          onClick={handleShare}
          aria-label={t('share.title', 'Share')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 transition-colors"
        >
          <ShareIcon className="w-4 h-4" />
        </button>
      </div>

      {showCommentSection && <CommentSection postId={post.id} />}
    </Card>
  );
});
