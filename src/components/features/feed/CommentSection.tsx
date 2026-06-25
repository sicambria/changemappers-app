'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { getCommentsAction, createCommentAction } from '@/app/actions/feed';
import { ActionRequirements } from '@/components/ui/ActionRequirements';
import { Avatar, AvatarImage, AvatarFallback, Button } from '@/components/ui';
import { CommentItem } from './CommentItem';
import { useAuth } from '@/components/providers/AuthProvider';
import { Loader2, UserIcon } from 'lucide-react';
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

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: Readonly<CommentSectionProps>) {
  const { user } = useAuth();
  const { t } = useTranslation('feed');
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }); // §1B: mirror latest t for effects/callbacks below; no deps array on purpose
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getCommentsAction({ postId, limit: 20 });
      if (result.success && result.data) {
        setComments(result.data.comments as FeedComment[]);
        setNextCursor(result.data.nextCursor);
      }
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  const loadMoreComments = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const result = await getCommentsAction({ postId, cursor: nextCursor, limit: 20 });
      if (result.success && result.data) {
        setComments((prev) => [...prev, ...(result.data.comments as FeedComment[])]);
        setNextCursor(result.data.nextCursor);
      } else {
        toast.error(result.error || tRef.current('errors.commentFailed'));
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [postId, nextCursor, isLoadingMore]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await createCommentAction({
        postId,
        content: newComment,
        parentId: replyTo?.id,
      });

      if (result.success) {
        setNewComment('');
        setReplyTo(null);
        loadComments();
      } else {
        toast.error(result.error || t('errors.commentFailed'));
      }
    } catch {
      // The server-action POST can be aborted by an unrelated route refresh/re-render
      // even after the comment was already created server-side (net::ERR_ABORTED ->
      // "Failed to fetch"). Without this branch the thrown rejection was swallowed and
      // the comment silently vanished from the UI until a manual reload. Reconcile
      // against the server instead of dropping it: reload the list (which surfaces the
      // persisted comment) and clear the input so the same text is not double-posted.
      setNewComment('');
      setReplyTo(null);
      loadComments();
    } finally {
      setIsSubmitting(false);
    }
  };

  const commentRequirementsId = 'comment-submit-requirements';
  const commentRequirements = [!newComment.trim() ? t('common:actionRequirements.enterComment') : null];

  const handleReply = (commentId: string, userName: string) => {
    setReplyTo({ id: commentId, name: userName });
    setNewComment(`@${userName} `);
  };

  if (!user) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
        <a href="/login" className="text-emerald-600 hover:underline">{t('comments.loginPrompt')}</a>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex gap-3">
        <Avatar className="w-8 h-8">
          {user.profilePhoto && <AvatarImage src={user.profilePhoto} alt={user.displayName || user.name} />}
          <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400">
            <UserIcon className="w-4 h-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          {replyTo && (
            <div className="text-xs text-gray-500 mb-1">
          {t('comments.replyingTo')} <span className="font-medium">{replyTo.name}</span>
          <button
            onClick={() => {
              setReplyTo(null);
              setNewComment('');
            }}
            className="ml-2 text-emerald-600 hover:underline"
          >
            {t('comments.cancelReply')}
          </button>
            </div>
          )}
          <textarea
            data-testid="post-comment-input"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('comments.placeholder')}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
            rows={2}
          />
          <div className="mt-2 space-y-2">
            <ActionRequirements id={commentRequirementsId} requirements={commentRequirements} />
            <div className="flex justify-end">
            <Button
              data-testid="post-comment-submit"
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
              disabledReasonId={commentRequirements.some(Boolean) ? commentRequirementsId : undefined}
              size="sm"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('comments.submit')}
            </Button>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              onReply={handleReply}
            />
          ))}
          {nextCursor && (
            <div className="flex justify-center pt-1">
              <Button
                data-testid="comments-load-more"
                variant="ghost"
                size="sm"
                onClick={loadMoreComments}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : t('comments.loadMore')}
              </Button>
            </div>
          )}
        </div>
      )}

      {!isLoading && comments.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 py-2">
          {t('comments.noComments')}
        </div>
      )}
    </div>
  );
}
