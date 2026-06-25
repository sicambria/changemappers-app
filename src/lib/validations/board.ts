import { z } from 'zod';

export const BoardScopeEnum = z.enum([
  'PERSONAL',
  'COMMUNITY_INTERNAL',
  'COMMUNITY_PUBLIC',
  'BIOREGIONAL',
  'NATIONAL',
  'INTERNATIONAL',
]);

export const InitiativeStateEnum = z.enum([
  'IMAGINED',
  'EXPLORING',
  'PLANNED',
  'IN_PROGRESS',
  'INTEGRATING',
  'COMPLETED',
  'ARCHIVED',
]);

export const createBoardSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  scope: BoardScopeEnum,
  visibility: z.enum(['PUBLIC', 'REGISTERED', 'CONNECTIONS', 'PRIVATE']).optional(),
  communityId: z.cuid().optional(),
  communityIds: z.array(z.cuid()).max(50).optional(),
  bioregion: z.string().max(100).optional(),
  country: z.string().max(2).optional(),
  wipLimits: z.record(InitiativeStateEnum, z.number().int().positive().nullable()).optional(),
  columns: z.array(InitiativeStateEnum).optional(),
});

export const updateBoardSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(1000).optional(),
  visibility: z.enum(['PUBLIC', 'REGISTERED', 'CONNECTIONS', 'PRIVATE']).optional(),
  communityIds: z.array(z.cuid()).max(50).optional(),
  wipLimits: z.record(InitiativeStateEnum, z.number().int().positive().nullable()).optional(),
  columns: z.array(InitiativeStateEnum).optional(),
});

export const getBoardsFilterSchema = z.object({
  scope: BoardScopeEnum.optional(),
  communityId: z.cuid().optional(),
  communityIds: z.array(z.cuid()).max(50).optional(),
  bioregion: z.string().max(100).optional(),
  country: z.string().max(2).optional(),
});

export const moveInitiativeBetweenBoardsSchema = z.object({
  initiativeId: z.cuid(),
  targetBoardId: z.cuid(),
});

export const DEFAULT_WIP_LIMITS: Record<string, number> = {
  PERSONAL: 3,
  COMMUNITY_INTERNAL: 5,
  COMMUNITY_PUBLIC: 5,
  BIOREGIONAL: 10,
  NATIONAL: 10,
  INTERNATIONAL: 10,
};

export function getDefaultWipLimitsForScope(scope: string): Record<string, number | null> {
  const limit = DEFAULT_WIP_LIMITS[scope] ?? 5;
  return {
    IMAGINED: null,
    EXPLORING: limit,
    PLANNED: limit,
    IN_PROGRESS: limit,
    INTEGRATING: limit,
    COMPLETED: null,
    ARCHIVED: null,
  };
}

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
export type GetBoardsFilter = z.infer<typeof getBoardsFilterSchema>;
export type MoveInitiativeBetweenBoardsInput = z.infer<typeof moveInitiativeBetweenBoardsSchema>;
