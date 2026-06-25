'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Trash2Icon, SendIcon, Loader2Icon } from 'lucide-react';
import { getIdeaComments, addIdeaComment, deleteIdeaComment } from '@/app/actions/idea-post';
import { IDEA_LIMITS } from '@/lib/validations/idea-post';
import { authorDisplayName, type IdeaCommentItem } from './types';

interface CommentThreadProps {
  ideaPostId: string;
  currentUserId: string;
  isAdmin: boolean;
}

function CommentRow({ comment, canDelete, onDelete }: Readonly<{
  comment: IdeaCommentItem; canDelete: boolean; onDelete: () => void;
}>) {
  const { t, i18n } = useTranslation('roadmap');
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          {authorDisplayName(comment.user, t('ideas.anonymous'))}
          <span className="ml-2 font-normal text-gray-400">
            {new Date(comment.createdAt).toLocaleDateString(i18n.resolvedLanguage)}
          </span>
        </p>
        <p className="whitespace-pre-wrap break-words text-sm text-gray-600 dark:text-gray-400">{comment.content}</p>
      </div>
      {canDelete && (
        <button type="button" onClick={onDelete} aria-label={t('ideas.deleteComment')} className="shrink-0 text-gray-400 hover:text-red-500">
          <Trash2Icon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function CommentThread({ ideaPostId, currentUserId, isAdmin }: Readonly<CommentThreadProps>) {
  const { t } = useTranslation('roadmap');
  const translateRef = useRef(t);
  useEffect(() => { translateRef.current = t; });
  const [comments, setComments] = useState<IdeaCommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    const result = await getIdeaComments(ideaPostId);
    if (result.success) setComments(result.data as IdeaCommentItem[]);
    else toast.error(result.error || translateRef.current('ideas.fetchFailed'));
    setIsLoading(false);
  }, [ideaPostId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleAdd = async () => {
    const content = draft.trim();
    if (!content || isSending) return;
    setIsSending(true);
    const result = await addIdeaComment({ ideaPostId, content });
    if (result.success) {
      setComments((prev) => [...prev, result.data as IdeaCommentItem]);
      setDraft('');
    } else {
      toast.error(result.error || t('ideas.commentFailed'));
    }
    setIsSending(false);
  };

  const handleDelete = async (commentId: string) => {
    const result = await deleteIdeaComment(commentId);
    if (result.success) setComments((prev) => prev.filter((c) => c.id !== commentId));
    else toast.error(result.error || t('ideas.commentDeleteFailed'));
  };

  return (
    <div className="mt-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4">
      {(() => {
        if (isLoading) return <div className="flex justify-center py-4"><Loader2Icon className="h-5 w-5 animate-spin text-gray-400" /></div>;
        if (comments.length === 0) return <p className="text-center text-sm text-gray-400">{t('ideas.noComments')}</p>;
        return comments.map((c) => (
          <CommentRow key={c.id} comment={c} canDelete={isAdmin || c.userId === currentUserId} onDelete={() => handleDelete(c.id)} />
        ));
      })()}
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          maxLength={IDEA_LIMITS.comment}
          placeholder={t('ideas.commentPlaceholder')}
          className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={isSending || !draft.trim()}
          aria-label={t('ideas.submitComment')}
          className="rounded-lg bg-emerald-600 p-2 text-white disabled:opacity-50 hover:bg-emerald-700"
        >
          <SendIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
