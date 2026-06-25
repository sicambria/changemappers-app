import { z } from 'zod';
import { assertCanonicalRdgIds, normalizeRdgId } from '@/lib/taxonomy';

export const createInitiativeSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(20).max(2000),
  why: z.string().min(20).max(1000),
  initiativeType: z.enum([
    'COMMUNITY_BUILDING',
    'RESEARCH_DEVELOPMENT',
    'ADVOCACY_CAMPAIGN',
    'EDUCATION_TRAINING',
    'SYSTEMS_CHANGE',
    'ECOLOGICAL_RESTORATION',
    'ECONOMIC_INNOVATION',
    'CULTURAL_ARTS',
    'HEALTH_WELLBEING',
    'GOVERNANCE_POLITICS',
    'TECHNOLOGY_INFRASTRUCTURE',
    'OTHER',
  ]),
  rdgAlignment: z.array(z.string().min(1).max(100)).min(1).max(5).transform((values): string[] => assertCanonicalRdgIds(values)),
  canvasNodeId: z.cuid().optional(),
  communityId: z.cuid().optional(),
  boardId: z.cuid().optional(),
});

export const moveInitiativeStateSchema = z.object({
  initiativeId: z.cuid(),
  toState: z.enum([
    'IMAGINED', 'EXPLORING', 'PLANNED', 'IN_PROGRESS',
    'INTEGRATING', 'COMPLETED', 'ARCHIVED',
  ]),
  archiveReason: z.string().max(500).optional(),
}).refine(
  (data) => {
    // archiveReason required when archiving
    if (data.toState === 'ARCHIVED' && !data.archiveReason) {
      return false;
    }
    return true;
  },
  { message: 'Archive reason is required when archiving an initiative', path: ['archiveReason'] }
);

export const addInitiativeRoleSchema = z.object({
  initiativeId: z.cuid(),
  roleType: z.enum(['CONTRIBUTOR', 'COORDINATOR', 'STEWARD', 'NODE_FACILITATOR', 'SYSTEMS_STEWARD']),
  contributionType: z.string().min(2).max(200),
});

export const addInitiativeUpdateSchema = z.object({
  initiativeId: z.cuid(),
  narrative: z.string().min(10).max(2000),
  whatShifting: z.string().max(500).optional(),
  whatHard: z.string().max(500).optional(),
  helpNeeded: z.string().max(500).optional(),
});

export const submitRetrospectiveSchema = z.object({
  initiativeId: z.cuid(),
  publicNarrative: z.string().min(50).max(5000),
});

export const createBacklogItemSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10).max(1000),
  communityId: z.cuid().optional(),
  rdgGoal: z.string().max(100).optional().transform((value) => value ? normalizeRdgId(value) ?? value : value),
  domain: z.string().max(120).optional(),
});

export { INITIATIVE_STATE_TRANSITIONS } from '@/types/modalities';
export type CreateInitiativeInput = z.infer<typeof createInitiativeSchema>;
export type MoveInitiativeStateInput = z.infer<typeof moveInitiativeStateSchema>;
export type AddInitiativeRoleInput = z.infer<typeof addInitiativeRoleSchema>;
export type AddInitiativeUpdateInput = z.infer<typeof addInitiativeUpdateSchema>;
export type SubmitRetrospectiveInput = z.infer<typeof submitRetrospectiveSchema>;
export type CreateBacklogItemInput = z.infer<typeof createBacklogItemSchema>;
