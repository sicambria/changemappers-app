/**
 * Shared types used across all developmental modality modules.
 * Client-safe: no server-only imports.
 */

export type { ApiResponse } from '@/types/common';

export interface MatchCandidate {
  userId: string;
  name: string;
  displayName?: string | null;
  profilePhoto?: string | null;
  archetypes: string[];
  availabilityMode: string;
  score: number;
}

// Client-safe enum mirrors (no @prisma/client import in client components)
export const TrainingFormatValues = {
  WORKSHOP: 'WORKSHOP',
  COURSE: 'COURSE',
  DEMO: 'DEMO',
  RESOURCE: 'RESOURCE',
  GUIDED_PRACTICE: 'GUIDED_PRACTICE',
} as const;
export type TrainingFormatValue = (typeof TrainingFormatValues)[keyof typeof TrainingFormatValues];

export const TrainingLevelValues = {
  EXPLORER: 'EXPLORER',
  PRACTITIONER: 'PRACTITIONER',
  GUIDE: 'GUIDE',
} as const;
export type TrainingLevelValue = (typeof TrainingLevelValues)[keyof typeof TrainingLevelValues];

export const DeliveryModeValues = {
  ONLINE: 'ONLINE',
  IN_PERSON: 'IN_PERSON',
  HYBRID: 'HYBRID',
} as const;
export type DeliveryModeValue = (typeof DeliveryModeValues)[keyof typeof DeliveryModeValues];

export const ContributionTypeValues = {
  SKILL_OFFERING: 'SKILL_OFFERING',
  ACCOMPANIMENT: 'ACCOMPANIMENT',
  KNOWLEDGE_COMMONS: 'KNOWLEDGE_COMMONS',
  HOLDING_SPACE: 'HOLDING_SPACE',
} as const;
export type ContributionTypeValue = (typeof ContributionTypeValues)[keyof typeof ContributionTypeValues];

export const CanvasNodeTypeValues = {
  PROBLEM: 'PROBLEM',
  PATTERN: 'PATTERN',
  ROOT_CAUSE: 'ROOT_CAUSE',
  SOLUTION_PATTERN: 'SOLUTION_PATTERN',
  INTERVENTION: 'INTERVENTION',
} as const;
export type CanvasNodeTypeValue = (typeof CanvasNodeTypeValues)[keyof typeof CanvasNodeTypeValues];

export const CanvasLinkTypeValues = {
  CAUSES: 'CAUSES',
  REINFORCES: 'REINFORCES',
  CONTRIBUTES_TO: 'CONTRIBUTES_TO',
  MITIGATES: 'MITIGATES',
  SOLVED_BY: 'SOLVED_BY',
  RELATED_PATTERN: 'RELATED_PATTERN',
} as const;
export type CanvasLinkTypeValue = (typeof CanvasLinkTypeValues)[keyof typeof CanvasLinkTypeValues];

export const InitiativeStateValues = {
  IMAGINED: 'IMAGINED',
  EXPLORING: 'EXPLORING',
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  INTEGRATING: 'INTEGRATING',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type InitiativeStateValue = (typeof InitiativeStateValues)[keyof typeof InitiativeStateValues];

// Valid initiative state transitions
export const INITIATIVE_STATE_TRANSITIONS: Record<string, string[]> = {
  IMAGINED: ['EXPLORING', 'ARCHIVED'],
  EXPLORING: ['PLANNED', 'IMAGINED', 'ARCHIVED'],
  PLANNED: ['IN_PROGRESS', 'EXPLORING', 'ARCHIVED'],
  IN_PROGRESS: ['INTEGRATING', 'PLANNED', 'ARCHIVED'],
  INTEGRATING: ['COMPLETED', 'IN_PROGRESS', 'ARCHIVED'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: [],
};
