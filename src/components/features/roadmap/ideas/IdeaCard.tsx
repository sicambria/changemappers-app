'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquareIcon } from 'lucide-react';
import { Card } from '@/components/ui';
import { VoteButton } from './VoteButton';
import { IdeaTags } from './IdeaTags';
import { CommentThread } from './CommentThread';
import { authorDisplayName, IDEA_TYPE_ACCENT, IDEA_STATUS_ACCENT, type IdeaPostListItem } from './types';

interface IdeaCardProps {
  post: IdeaPostListItem;
  currentUserId: string;
  isAdmin: boolean;
}

export function IdeaCard({ post, currentUserId, isAdmin }: Readonly<IdeaCardProps>) {
  const { t } = useTranslation('roadmap');
  const [showComments, setShowComments] = useState(false);

  return (
    <Card className="p-5">
      <div className="flex gap-4">
        <VoteButton ideaPostId={post.id} voteCount={post.voteCount} hasVoted={post.hasVoted} />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${IDEA_TYPE_ACCENT[post.type]}`}>
              {t(`ideas.types.${post.type}`)}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${IDEA_STATUS_ACCENT[post.status]}`}>
              {t(`ideas.statuses.${post.status}`)}
            </span>
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white">{post.title}</h3>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-600 dark:text-gray-400">{post.description}</p>
          <div className="mt-3"><IdeaTags rdgTags={post.rdgTags} tags={post.tags} /></div>
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
            <span>{authorDisplayName(post.createdBy, t('ideas.anonymous'))}</span>
            <button
              type="button"
              onClick={() => setShowComments((s) => !s)}
              className="flex items-center gap-1 hover:text-emerald-600"
            >
              <MessageSquareIcon className="h-3.5 w-3.5" />
              {t('ideas.commentsCount', { count: post.commentCount })}
            </button>
          </div>
          {showComments && (
            <CommentThread ideaPostId={post.id} currentUserId={currentUserId} isAdmin={isAdmin} />
          )}
        </div>
      </div>
    </Card>
  );
}
