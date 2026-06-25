'use server';
import { flattenError } from 'zod';
import prisma, { BoardScope, Visibility, InitiativeState, Prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  createBoardSchema,
  updateBoardSchema,
  moveInitiativeBetweenBoardsSchema,
  getDefaultWipLimitsForScope,
  type CreateBoardInput,
  type UpdateBoardInput,
  type MoveInitiativeBetweenBoardsInput,
} from '@/lib/validations/board';
import type { ApiResponse } from '@/types/modalities';
import { runAction } from '@/lib/server-action-wrapper';

// ─────────────────────────────────────────
// AUTHORIZATION HELPERS
// ─────────────────────────────────────────

async function canCreateBoard(
  userId: string,
  scope: string,
  communityId?: string,
): Promise<{ allowed: boolean; error?: string }> {
  if (scope === 'PERSONAL') return { allowed: true };

  if (scope === 'COMMUNITY_INTERNAL' || scope === 'COMMUNITY_PUBLIC') {
    if (!communityId) return { allowed: false, error: 'Community ID required for community boards' };
    const membership = await prisma.communityMember.findFirst({
      where: { communityId, userId, status: 'ACTIVE' },
      select: { role: true },
    });
    if (!membership) return { allowed: false, error: 'Not a member of this community' };
    if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
      return { allowed: false, error: 'Only community admins can create boards' };
    }
  }

  if (scope === 'BIOREGIONAL' || scope === 'NATIONAL' || scope === 'INTERNATIONAL') {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    if (!user?.isAdmin) return { allowed: false, error: 'Only admins can create regional boards' };
  }

  return { allowed: true };
}

async function canConfigureBoard(
  userId: string,
  board: { scope: string; ownerId: string | null; communityId: string | null },
): Promise<boolean> {
  if (board.scope === 'PERSONAL') return board.ownerId === userId;

  if (board.scope === 'COMMUNITY_INTERNAL' || board.scope === 'COMMUNITY_PUBLIC') {
    if (!board.communityId) return false;
    const membership = await prisma.communityMember.findFirst({
      where: { communityId: board.communityId, userId, status: 'ACTIVE' },
      select: { role: true },
    });
    return membership?.role === 'OWNER' || membership?.role === 'ADMIN';
  }

  if (['BIOREGIONAL', 'NATIONAL', 'INTERNATIONAL'].includes(board.scope)) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true },
    });
    return user?.isAdmin ?? false;
  }

  return false;
}

async function canAccessBoard(
  userId: string | null,
  board: { id?: string; scope: string; visibility: string; ownerId: string | null; communityId: string | null },
): Promise<boolean> {
  if (board.visibility === 'PUBLIC') return true;
  if (!userId) return false;

  if (board.visibility === 'REGISTERED') return true;
  if (board.scope === 'PERSONAL' && board.ownerId === userId) return true;

  if (board.scope === 'COMMUNITY_INTERNAL' && board.communityId) {
    const membership = await prisma.communityMember.findFirst({
      where: { communityId: board.communityId, userId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (membership) return true;
  }

  if (!board.id) return false;
  const audienceMatch = await prisma.boardCommunityAudience.findFirst({
    where: {
      boardId: board.id,
      community: { members: { some: { userId, status: 'ACTIVE' } } },
    },
    select: { id: true },
  });
  return !!audienceMatch;
}


async function assertCommunityAudienceMembership(
  userId: string,
  communityIds: string[] | undefined,
): Promise<{ allowed: boolean; error?: string; communityIds: string[] }> {
  const uniqueCommunityIds = Array.from(new Set(communityIds ?? []));
  if (uniqueCommunityIds.length === 0) return { allowed: true, communityIds: [] };

  const memberships = await prisma.communityMember.findMany({
    where: { userId, status: 'ACTIVE', communityId: { in: uniqueCommunityIds } },
    select: { communityId: true },
  });
  const memberCommunityIds = new Set(memberships.map((membership) => membership.communityId));
  const unauthorizedCommunityId = uniqueCommunityIds.find((communityId) => !memberCommunityIds.has(communityId));

  if (unauthorizedCommunityId) {
    return { allowed: false, error: 'Can only share boards with communities you belong to', communityIds: uniqueCommunityIds };
  }

  return { allowed: true, communityIds: uniqueCommunityIds };
}
// ─────────────────────────────────────────
// BOARD CRUD
// ─────────────────────────────────────────

export async function createBoardAction(
  input: CreateBoardInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createBoardAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createBoardSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const authCheck = await canCreateBoard(
    auth.data.id,
    parsed.data.scope,
    parsed.data.communityId,
  );
  if (!authCheck.allowed) {
    return { success: false, error: authCheck.error };
  }

  const audienceCheck = await assertCommunityAudienceMembership(auth.data.id, parsed.data.communityIds);
  if (!audienceCheck.allowed) {
    return { success: false, error: audienceCheck.error };
  }

  const wipLimits = parsed.data.wipLimits ?? getDefaultWipLimitsForScope(parsed.data.scope);
  const columns = parsed.data.columns ?? null;

  const defaultVisibility = parsed.data.scope === 'PERSONAL' || parsed.data.scope === 'COMMUNITY_INTERNAL' ? 'PRIVATE' : 'REGISTERED';

  const board = await prisma.board.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      scope: parsed.data.scope as BoardScope,
      visibility: (parsed.data.visibility ?? defaultVisibility) as Visibility,
      ownerId: parsed.data.scope === 'PERSONAL' ? auth.data.id : null,
      communityId: parsed.data.communityId ?? null,
      bioregion: parsed.data.bioregion ?? null,
      country: parsed.data.country ?? null,
      wipLimits: wipLimits as Prisma.InputJsonValue,
      columns: columns as Prisma.InputJsonValue,
      communityAudience: audienceCheck.communityIds.length > 0
        ? { create: audienceCheck.communityIds.map((communityId) => ({ communityId })) }
        : undefined,
    },
    select: { id: true },
  });

  return { success: true, data: { id: board.id } };
  });
}

export async function getBoardsAction(
  filters?: { scope?: string; communityId?: string; bioregion?: string; country?: string },
): Promise<ApiResponse<Array<{
  id: string;
  name: string;
  description: string | null;
  scope: string;
  visibility: string;
  ownerId: string | null;
  communityId: string | null;
  bioregion: string | null;
  country: string | null;
}>>> {
  return runAction('getBoardsAction', async () => {
  const auth = await getCurrentUser();
  const userId = auth.success && auth.data ? auth.data.id : null;

  const where: Prisma.BoardWhereInput = { deletedAt: null };

  if (filters?.scope) where.scope = filters.scope as BoardScope;
  if (filters?.communityId) where.communityId = filters.communityId;
  if (filters?.bioregion) where.bioregion = filters.bioregion;
  if (filters?.country) where.country = filters.country;

  const accessConditions: Prisma.BoardWhereInput[] = [{ visibility: 'PUBLIC' as Visibility }];

  if (userId) {
    const memberships = await prisma.communityMember.findMany({
      where: { userId, status: 'ACTIVE' },
      select: { communityId: true },
    });
    const communityIds = memberships.map((membership) => membership.communityId);

    accessConditions.push(
      { visibility: 'REGISTERED' as Visibility },
      { scope: 'PERSONAL' as BoardScope, ownerId: userId },
    );

    if (communityIds.length > 0) {
      accessConditions.push(
        {
          scope: 'COMMUNITY_INTERNAL' as BoardScope,
          communityId: { in: communityIds },
        },
        {
          communityAudience: { some: { communityId: { in: communityIds } } },
        },
      );
    }
  }

  where.OR = accessConditions;

  const boards = await prisma.board.findMany({
    where,
    select: {
      id: true,
      name: true,
      description: true,
      scope: true,
      visibility: true,
      ownerId: true,
      communityId: true,
      bioregion: true,
      country: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return { success: true, data: boards };
  });
}

export async function getBoardAction(
  id: string,
): Promise<ApiResponse<{
  id: string;
  name: string;
  description: string | null;
  scope: string;
  visibility: string;
  wipLimits: Prisma.JsonValue | null;
  columns: Prisma.JsonValue | null;
  ownerId: string | null;
  communityId: string | null;
  bioregion: string | null;
  country: string | null;
  initiatives: Array<{
    id: string;
    title: string;
    description: string;
    why: string;
    state: string;
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
    assigneeId: string | null;
    assignee: { id: string; name: string | null; profilePhoto: string | null } | null;
    createdBy: { id: string; name: string | null; profilePhoto: string | null };
    roles: Array<{ roleType: string; user: { name: string | null; profilePhoto: string | null } }>;
    _count: { updates: number; roles: number };
  }>;
}>> {
  return runAction('getBoardAction', async () => {
  const auth = await getCurrentUser();
  const userId = auth.success && auth.data ? auth.data.id : null;

  const board = await prisma.board.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      description: true,
      scope: true,
      visibility: true,
      wipLimits: true,
      columns: true,
      ownerId: true,
      communityId: true,
      bioregion: true,
      country: true,
      initiatives: {
        where: { state: { not: 'ARCHIVED' } },
        select: {
          id: true,
          title: true,
          description: true,
          why: true,
          state: true,
          createdAt: true,
          updatedAt: true,
          completedAt: true,
          assigneeId: true,
          assignee: {
            select: { id: true, name: true, profilePhoto: true },
          },
          createdBy: {
            select: { id: true, name: true, profilePhoto: true },
          },
          roles: {
            where: { leftAt: null },
            select: {
              roleType: true,
              user: { select: { name: true, profilePhoto: true } },
            },
          },
          _count: { select: { updates: true, roles: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!board) return { success: false, error: 'Board not found' };

  if (!(await canAccessBoard(userId, board))) {
    return { success: false, error: 'Access denied' };
  }

  return { success: true, data: board };
  });
}

export async function updateBoardAction(
  id: string,
  input: UpdateBoardInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('updateBoardAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = updateBoardSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const board = await prisma.board.findUnique({
    where: { id, deletedAt: null },
    select: { scope: true, ownerId: true, communityId: true },
  });

  if (!board) return { success: false, error: 'Board not found' };

  if (!(await canConfigureBoard(auth.data.id, board))) {
    return { success: false, error: 'Not authorized to configure this board' };
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.visibility) updateData.visibility = parsed.data.visibility as Visibility;
  if (parsed.data.wipLimits) updateData.wipLimits = parsed.data.wipLimits as Prisma.InputJsonValue;
  if (parsed.data.columns) updateData.columns = parsed.data.columns as Prisma.InputJsonValue;

  const audienceCheck = await assertCommunityAudienceMembership(auth.data.id, parsed.data.communityIds);
  if (!audienceCheck.allowed) {
    return { success: false, error: audienceCheck.error };
  }

  await prisma.$transaction(async (tx) => {
    await tx.board.update({
      where: { id },
      data: updateData,
    });

    if (parsed.data.communityIds !== undefined) {
      await tx.boardCommunityAudience.deleteMany({ where: { boardId: id } });
      if (audienceCheck.communityIds.length > 0) {
        await tx.boardCommunityAudience.createMany({
          data: audienceCheck.communityIds.map((communityId) => ({ boardId: id, communityId })),
        });
      }
    }
  });

  return { success: true, data: { id } };
  });
}

export async function deleteBoardAction(id: string): Promise<ApiResponse<void>> {
  return runAction('deleteBoardAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const board = await prisma.board.findUnique({
    where: { id, deletedAt: null },
    select: { scope: true, ownerId: true, communityId: true },
  });

  if (!board) return { success: false, error: 'Board not found' };

  if (!(await canConfigureBoard(auth.data.id, board))) {
    return { success: false, error: 'Not authorized to delete this board' };
  }

  await prisma.board.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// WIP LIMIT CHECK
// ─────────────────────────────────────────

export async function checkWipLimitAction(
  boardId: string,
  targetState: string,
): Promise<ApiResponse<{ allowed: boolean; current: number; limit: number | null }>> {
  return runAction('checkWipLimitAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const board = await prisma.board.findUnique({
    where: { id: boardId, deletedAt: null },
    select: { id: true, wipLimits: true, scope: true, visibility: true, ownerId: true, communityId: true },
  });

  if (!board) return { success: false, error: 'Board not found' };
  if (!(await canAccessBoard(auth.data.id, board))) {
    return { success: false, error: 'Access denied' };
  }

  const wipLimits = board.wipLimits as Record<string, number | null> | null;
  const limit = wipLimits?.[targetState] ?? null;

  if (limit === null) {
    return { success: true, data: { allowed: true, current: 0, limit: null } };
  }

  const current = await prisma.initiative.count({
    where: { boardId, state: targetState as InitiativeState },
  });

  const allowed = current < limit;

  return { success: true, data: { allowed, current, limit } };
  });
}

// ─────────────────────────────────────────
// MOVE INITIATIVE BETWEEN BOARDS
// ─────────────────────────────────────────

export async function moveInitiativeBetweenBoardsAction(
  input: MoveInitiativeBetweenBoardsInput,
): Promise<ApiResponse<void>> {
  return runAction('moveInitiativeBetweenBoardsAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = moveInitiativeBetweenBoardsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const initiative = await prisma.initiative.findUnique({
    where: { id: parsed.data.initiativeId },
    select: { createdById: true, boardId: true },
  });

  if (!initiative) return { success: false, error: 'Initiative not found' };
  if (!initiative.boardId) return { success: false, error: 'Source board not found' };

  const sourceBoard = await prisma.board.findUnique({
    where: { id: initiative.boardId, deletedAt: null },
    select: { scope: true, ownerId: true, communityId: true },
  });

  if (!sourceBoard) return { success: false, error: 'Source board not found' };

  const targetBoard = await prisma.board.findUnique({
    where: { id: parsed.data.targetBoardId, deletedAt: null },
    select: { scope: true, ownerId: true, communityId: true },
  });

  if (!targetBoard) return { success: false, error: 'Target board not found' };

  if (!(await canConfigureBoard(auth.data.id, sourceBoard))) {
    return { success: false, error: 'Not authorized to move from source board' };
  }

  if (!(await canConfigureBoard(auth.data.id, targetBoard))) {
    return { success: false, error: 'Not authorized to move to target board' };
  }

  await prisma.initiative.update({
    where: { id: parsed.data.initiativeId },
    data: { boardId: parsed.data.targetBoardId },
  });

  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// GET DEFAULT BOARD FOR USER
// ─────────────────────────────────────────

export async function getDefaultBoardForUserAction(): Promise<ApiResponse<{
  id: string;
  name: string;
  scope: string;
} | null>> {
  return runAction('getDefaultBoardForUserAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const user = await prisma.user.findUnique({
    where: { id: auth.data.id },
    select: { region: true, country: true },
  });

  if (user?.region) {
    const bioregionBoard = await prisma.board.findFirst({
      where: { scope: 'BIOREGIONAL', bioregion: user.region, deletedAt: null },
      select: { id: true, name: true, scope: true },
    });
    if (bioregionBoard) return { success: true, data: bioregionBoard };
  }

  if (user?.country) {
    const nationalBoard = await prisma.board.findFirst({
      where: { scope: 'NATIONAL', country: user.country, deletedAt: null },
      select: { id: true, name: true, scope: true },
    });
    if (nationalBoard) return { success: true, data: nationalBoard };
  }

  let personalBoard = await prisma.board.findFirst({
    where: { scope: 'PERSONAL', ownerId: auth.data.id, deletedAt: null },
    select: { id: true, name: true, scope: true },
  });

  personalBoard ??= await prisma.board.create({
    data: {
      name: 'My Tasks',
      scope: 'PERSONAL',
      visibility: 'PRIVATE',
      ownerId: auth.data.id,
      wipLimits: getDefaultWipLimitsForScope('PERSONAL') as Prisma.InputJsonValue,
    },
    select: { id: true, name: true, scope: true },
  });

  return { success: true, data: personalBoard };
  });
}

// ─────────────────────────────────────────
// METRICS ACTIONS
// ─────────────────────────────────────────

export async function getBoardMetricsAction(
  boardId: string,
): Promise<ApiResponse<{
  totalInitiatives: number;
  completedInitiatives: number;
  avgCycleTime: number | null;
  avgLeadTime: number | null;
  throughput: number;
  wip: number;
  flowEfficiency: number | null;
  byState: Record<string, number>;
  blockedItems: Array<{ id: string; title: string; state: string; daysInState: number }>;
}>> {
  return runAction('getBoardMetricsAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const board = await prisma.board.findUnique({
    where: { id: boardId, deletedAt: null },
    select: { id: true, scope: true, visibility: true, ownerId: true, communityId: true },
  });

  if (!board) return { success: false, error: 'Board not found' };

  if (!(await canAccessBoard(auth.data.id, board))) {
    return { success: false, error: 'Access denied' };
  }

  const initiatives = await prisma.initiative.findMany({
    where: { boardId },
    select: {
      id: true,
      title: true,
      state: true,
      createdAt: true,
      updatedAt: true,
      completedAt: true,
      metrics: {
        select: {
          cycleTime: true,
          leadTime: true,
          startedAt: true,
          completedAt: true,
        },
      },
    },
    take: 100,
  });

  const totalInitiatives = initiatives.length;
  const completedInitiatives = initiatives.filter((i) => i.state === 'COMPLETED').length;
  const activeStates = new Set(['EXPLORING', 'PLANNED', 'IN_PROGRESS', 'INTEGRATING']);
  const wip = initiatives.filter((i) => activeStates.has(i.state)).length;

  const metricsWithData = initiatives.filter((i) => i.metrics?.cycleTime !== null);
  const avgCycleTime = metricsWithData.length > 0
    ? metricsWithData.reduce((sum, i) => sum + (i.metrics?.cycleTime ?? 0), 0) / metricsWithData.length
    : null;
  const avgLeadTime = metricsWithData.length > 0
    ? metricsWithData.reduce((sum, i) => sum + (i.metrics?.leadTime ?? 0), 0) / metricsWithData.length
    : null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const throughput = initiatives.filter(
    (i) => i.completedAt != null && i.completedAt >= thirtyDaysAgo,
  ).length;

  let flowEfficiency: number | null = null;
  if (avgLeadTime != null && avgLeadTime > 0 && avgCycleTime !== null) {
    flowEfficiency = (avgCycleTime / avgLeadTime) * 100;
  }

  const byState: Record<string, number> = {};
  for (const state of Object.values(InitiativeState)) {
    byState[state] = initiatives.filter((i) => i.state === state).length;
  }

  const thirtyDaysAgoForBlocked = new Date();
  thirtyDaysAgoForBlocked.setDate(thirtyDaysAgoForBlocked.getDate() - 30);
  const blockedItems = initiatives
    .filter((i) => {
      if (i.state === 'COMPLETED' || i.state === 'ARCHIVED') return false;
      return i.updatedAt <= thirtyDaysAgoForBlocked;
    })
    .map((i) => ({
      id: i.id,
      title: i.title,
      state: i.state,
      daysInState: Math.floor(
        (new Date().getTime() - i.updatedAt.getTime()) / (1000 * 60 * 60 * 24),
      ),
    }))
    .sort((a, b) => b.daysInState - a.daysInState);

  return {
    success: true,
    data: {
      totalInitiatives,
      completedInitiatives,
      avgCycleTime,
      avgLeadTime,
      throughput,
      wip,
      flowEfficiency,
      byState,
      blockedItems,
    },
  };
  });
}
