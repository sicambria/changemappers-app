export const StoryTypeValues = {
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
} as const;

export type StoryTypeValue = (typeof StoryTypeValues)[keyof typeof StoryTypeValues];

export interface StoryCommentView {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoryView {
  id: string;
  authorId: string;
  authorName: string;
  authorProfilePhoto: string | null;
  storyType: StoryTypeValue;
  title: string;
  summary: string;
  context: string;
  challenge: string;
  whatHappened: string;
  outcome: string;
  lessonsLearned: string;
  retrospectiveWhatWorked: string | null;
  retrospectiveWhatToChange: string | null;
  retrospectiveAdvice: string | null;
  publishedAt: string;
  editDeadline: string;
  createdAt: string;
  updatedAt: string;
  isOwner: boolean;
  canEdit: boolean;
  comments: StoryCommentView[];
}

export interface StoriesPageData {
  stories: StoryView[];
  currentUserId: string | null;
  currentUserName: string | null;
}
