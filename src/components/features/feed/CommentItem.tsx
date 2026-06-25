'use client';

import { useEffect, useState } from 'react';
import { FeedReactionTray } from './FeedReactionTray';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui';
import { UserHoverCard } from './UserHoverCard';
import { VerificationBadge } from '@/components/profile/VerificationBadge';
import type { VerificationLevel } from '@/lib/prisma-shared';
import { formatDistanceToNow } from 'date-fns';
import { getCommentsAction } from '@/app/actions/feed';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface CommentUser {
  id: string;
  name: string;
  displayName: string | null;
  profilePhoto: string | null;
  verificationLevel: string;
}

interface FeedComment {
  id: string;
  content: string;
  createdAt: Date;
  author: CommentUser;
  _count?: { replies: number; commentReactions: number };
  commentReactions?: { type: import('@/lib/feed-reactions').FeedReactionType }[];
}

interface CommentItemProps {
  comment: FeedComment;
  postId: string;
  depth?: number;
  onReply?: (commentId: string, userName: string) => void;
}

export function CommentItem({ comment, postId, depth = 0, onReply }: Readonly<CommentItemProps>) {
  const { t } = useTranslation('feed');
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<FeedComment[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);

  // Toggle the reply thread. The Reply button already creates `parentId` comments,
  // but the post-level fetch only returns top-level comments, so replies are loaded
  // on demand here. Refetch on each open so a just-posted reply appears immediately.
  const toggleReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }
    setRepliesLoading(true);
    try {
      const result = await getCommentsAction({ postId, parentId: comment.id, limit: 20 });
      if (result.success && result.data) {
        setReplies(result.data.comments as FeedComment[]);
        setShowReplies(true);
      } else {
        toast.error(result.error || t('errors.repliesFailed'));
      }
    } finally {
      setRepliesLoading(false);
    }
  };

  const createdAtTime = new Date(comment.createdAt).getTime();
  const fallbackTimeLabel = new Date(createdAtTime).toISOString();
  const [timeAgo, setTimeAgo] = useState(fallbackTimeLabel);

  useEffect(() => {
    setTimeAgo(formatDistanceToNow(createdAtTime, { addSuffix: true }));
  }, [createdAtTime]);

  const maxDepth = 3;
  const canNest = depth < maxDepth;

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'ml-8 pl-3 border-l border-gray-200 dark:border-gray-700' : ''}`}>
      <UserHoverCard user={comment.author}>
        <Avatar className="flex-shrink-0 w-8 h-8">
          {comment.author.profilePhoto && (
            <AvatarImage src={comment.author.profilePhoto} alt={comment.author.displayName || comment.author.name} />
          )}
          <AvatarFallback className="text-xs font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400">
            {(comment.author.displayName || comment.author.name).charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </UserHoverCard>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <UserHoverCard user={comment.author}>
            <span className="font-medium text-sm hover:text-emerald-600 cursor-pointer">
              {comment.author.displayName || comment.author.name}
            </span>
            </UserHoverCard>
            <VerificationBadge level={comment.author.verificationLevel as VerificationLevel} size={14} />
            <span className="text-xs text-gray-500 dark:text-gray-400" title={fallbackTimeLabel}>{timeAgo}</span>
        </div>

        <p data-testid="comment-content" className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">
          {comment.content}
        </p>

        <div className="flex items-center gap-4 mt-2">
          <FeedReactionTray target="comment" targetId={comment.id} initialReactions={comment.commentReactions} />

          {canNest && (
            <button
              onClick={() => onReply?.(comment.id, comment.author.displayName || comment.author.name)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-emerald-600 transition-colors"
            >
              {t('comments.reply')}
            </button>
          )}

          {comment._count?.replies ? comment._count.replies > 0 && (
            <button
              onClick={toggleReplies}
              disabled={repliesLoading}
              className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-60"
            >
              {repliesLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              {showReplies
                ? t('comments.hideReplies')
                : t('comments.showRepliesCount', { count: comment._count.replies })}
            </button>
          ) : null}
        </div>

        {showReplies && (
          <div className="mt-3 space-y-3">
            {replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                depth={depth + 1}
                onReply={onReply}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
