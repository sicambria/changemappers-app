import type { IdeaPostType, IdeaPostStatus } from '@/lib/prisma-shared';

export interface IdeaAuthor {
  id: string;
  name: string | null;
  displayName: string | null;
  profilePhoto: string | null;
}

export interface IdeaPostListItem {
  id: string;
  title: string;
  description: string;
  type: IdeaPostType;
  status: IdeaPostStatus;
  tags: string[];
  rdgTags: string[];
  voteCount: number;
  feedbackId: string | null;
  createdById: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  createdBy: IdeaAuthor;
  hasVoted: boolean;
  commentCount: number;
}

export interface IdeaCommentItem {
  id: string;
  content: string;
  createdAt: string | Date;
  userId: string;
  user: IdeaAuthor;
}

export const IDEA_TYPES = ['PAIN_POINT', 'FEATURE_IDEA', 'BUG_FIX'] as const satisfies readonly IdeaPostType[];
export const IDEA_STATUSES = ['OPEN', 'PLANNED', 'IN_PROGRESS', 'DONE', 'DECLINED'] as const satisfies readonly IdeaPostStatus[];

export const IDEA_TYPE_ACCENT: Record<IdeaPostType, string> = {
  PAIN_POINT: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  FEATURE_IDEA: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  BUG_FIX: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export const IDEA_STATUS_ACCENT: Record<IdeaPostStatus, string> = {
  OPEN: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  PLANNED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  DONE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  DECLINED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function authorDisplayName(author: IdeaAuthor, fallback: string): string {
  return author.displayName || author.name || fallback;
}
