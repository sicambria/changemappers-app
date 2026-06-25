import { RDG_GOALS, formatRdgLabel } from '@/lib/taxonomy';

export const FEED_REACTION_TYPES = [
  'INSPIRED',
  'LEARNED',
  'CAN_HELP',
  'CAN_CONNECT',
  'WORTH_DEEPER_LISTENING',
  'REGENERATIVE',
] as const;

export type FeedReactionType = (typeof FEED_REACTION_TYPES)[number];

export const FEED_REACTION_LABELS: Record<FeedReactionType, string> = {
  INSPIRED: 'Inspired',
  LEARNED: 'Learned',
  CAN_HELP: 'Can help',
  CAN_CONNECT: 'Can connect',
  WORTH_DEEPER_LISTENING: 'Deeper listening',
  REGENERATIVE: 'Regenerative',
};


export interface FeedReactionUser {
  id: string;
  name: string;
  displayName: string | null;
  profilePhoto: string | null;
}

export interface FeedReactionGroup {
  type: FeedReactionType;
  label: string;
  count: number;
  users: FeedReactionUser[];
}

export interface FeedRdgOption {
  slug: string;
  title: string;
}

export interface FeedTagOption {
  key: string;
  label: string;
  category: string;
}

export const FEED_RDG_OPTIONS: FeedRdgOption[] = RDG_GOALS.map((goal) => ({
  slug: goal.id,
  title: formatRdgLabel(goal.id),
}));

export const STATIC_FEED_TAG_OPTIONS = [
  { key: 'COMMUNITY_BUILDING', label: 'Community building', category: 'initiative' },
  { key: 'RESEARCH_DEVELOPMENT', label: 'Research and development', category: 'initiative' },
  { key: 'ADVOCACY_CAMPAIGN', label: 'Advocacy campaign', category: 'initiative' },
  { key: 'EDUCATION_TRAINING', label: 'Education and training', category: 'initiative' },
  { key: 'SYSTEMS_CHANGE', label: 'Systems change', category: 'initiative' },
  { key: 'ECOLOGICAL_RESTORATION', label: 'Ecological restoration', category: 'initiative' },
  { key: 'ECONOMIC_INNOVATION', label: 'Economic innovation', category: 'initiative' },
  { key: 'CULTURAL_ARTS', label: 'Cultural arts', category: 'initiative' },
  { key: 'HEALTH_WELLBEING', label: 'Health and wellbeing', category: 'initiative' },
  { key: 'GOVERNANCE_POLITICS', label: 'Governance and politics', category: 'initiative' },
  { key: 'TECHNOLOGY_INFRASTRUCTURE', label: 'Technology infrastructure', category: 'initiative' },
  { key: 'WORKSHOP', label: 'Workshop', category: 'event' },
  { key: 'MEETUP', label: 'Meetup', category: 'event' },
  { key: 'WORKDAY', label: 'Workday', category: 'event' },
  { key: 'TRAINING', label: 'Training', category: 'event' },
  { key: 'RETREAT', label: 'Retreat', category: 'event' },
  { key: 'SKILL_OFFERING', label: 'Skill offering', category: 'contribution' },
  { key: 'ACCOMPANIMENT', label: 'Accompaniment', category: 'contribution' },
  { key: 'KNOWLEDGE_COMMONS', label: 'Knowledge commons', category: 'contribution' },
  { key: 'HOLDING_SPACE', label: 'Holding space', category: 'contribution' },
  { key: 'COURSE', label: 'Course', category: 'training' },
  { key: 'DEMO', label: 'Demo', category: 'training' },
  { key: 'RESOURCE', label: 'Resource', category: 'training' },
  { key: 'GUIDED_PRACTICE', label: 'Guided practice', category: 'training' },
] satisfies readonly FeedTagOption[];

export const MAX_FEED_RDG_ANNOTATIONS = 3;
export const MAX_FEED_TAG_ANNOTATIONS = 5;

export function getFeedRdgOption(slug: string): FeedRdgOption | undefined {
  return FEED_RDG_OPTIONS.find((option) => option.slug === slug);
}

export function getStaticFeedTagOption(key: string): FeedTagOption | undefined {
  return STATIC_FEED_TAG_OPTIONS.find((option) => option.key === key);
}
