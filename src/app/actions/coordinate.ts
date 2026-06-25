'use server';
import { flattenError } from 'zod';
import { revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  createInitiativeSchema,
  moveInitiativeStateSchema,
  addInitiativeRoleSchema,
  addInitiativeUpdateSchema,
  submitRetrospectiveSchema,
  createBacklogItemSchema,
  INITIATIVE_STATE_TRANSITIONS,
  type CreateInitiativeInput,
  type MoveInitiativeStateInput,
  type AddInitiativeRoleInput,
  type AddInitiativeUpdateInput,
  type SubmitRetrospectiveInput,
  type CreateBacklogItemInput,
} from '@/lib/validations/coordinate';
import {
  initiativeTag,
  CACHE_TAG_INITIATIVES,
  CACHE_TAG_BACKLOG,
} from '@/lib/cache-tags';
import type { ApiResponse } from '@/types/modalities';
import { runAction } from '@/lib/server-action-wrapper';

// ─────────────────────────────────────────
// INITIATIVE CRUD
// ─────────────────────────────────────────

export async function createInitiativeAction(
  input: CreateInitiativeInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createInitiativeAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createInitiativeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const initiative = await prisma.initiative.create({
    data: {
      ...parsed.data,
      createdById: auth.data.id,
      state: 'IMAGINED',
    },
    select: { id: true },
  });

  // Auto-add creator as COORDINATOR
  await prisma.initiativeRole.create({
    data: {
      initiativeId: initiative.id,
      userId: auth.data.id,
      roleType: 'COORDINATOR',
      contributionType: 'Initiative creator',
    },
  });

  revalidateTag(CACHE_TAG_INITIATIVES, 'default');
  return { success: true, data: initiative };
  });
}

export async function editInitiativeAction(
  id: string,
  input: Partial<CreateInitiativeInput>,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('editInitiativeAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const initiative = await prisma.initiative.findUnique({
    where: { id },
    select: { createdById: true, state: true },
  });
  if (!initiative) return { success: false, error: 'Not found' };

  // Only creator or coordinators can edit
  const isCreator = initiative.createdById === auth.data.id;
const isCoordinator = await prisma.initiativeRole.findFirst({
		where: { initiativeId: id, userId: auth.data.id, roleType: 'COORDINATOR', leftAt: null },
		select: { id: true },
	});
  if (!isCreator && !isCoordinator) return { success: false, error: 'Unauthorized' };

  await prisma.initiative.update({ where: { id }, data: input });

  revalidateTag(initiativeTag(id), 'default');
  return { success: true, data: { id } };
  });
}

async function checkWipLimit(
  boardId: string,
  toState: string,
): Promise<string | null> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { wipLimits: true },
  });
  if (!board?.wipLimits) return null;

  const wipLimits = board.wipLimits as Record<string, number | null>;
  const limit = wipLimits[toState];
  if (limit === null || limit === undefined) return null;

  const currentCount = await prisma.initiative.count({
    where: { boardId, state: toState as never },
  });
  if (currentCount >= limit) {
    return `WIP limit reached for ${toState} (max: ${limit})`;
  }
  return null;
}

export async function moveInitiativeStateAction(
  input: MoveInitiativeStateInput,
): Promise<ApiResponse<void>> {
  return runAction('moveInitiativeStateAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = moveInitiativeStateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const initiative = await prisma.initiative.findUnique({
    where: { id: parsed.data.initiativeId },
    select: { state: true, createdById: true, boardId: true },
  });
  if (!initiative) return { success: false, error: 'Initiative not found' };

  const allowedNext = INITIATIVE_STATE_TRANSITIONS[initiative.state as keyof typeof INITIATIVE_STATE_TRANSITIONS] ?? [];
  if (!allowedNext.includes(parsed.data.toState)) {
    return {
      success: false,
      error: `Cannot transition from ${initiative.state} to ${parsed.data.toState}`,
    };
  }

  if (initiative.boardId && parsed.data.toState !== initiative.state) {
    const wipError = await checkWipLimit(initiative.boardId, parsed.data.toState);
    if (wipError) return { success: false, error: wipError };
  }

  const isCreator = initiative.createdById === auth.data.id;
  const isCoordinator = await prisma.initiativeRole.findFirst({
    where: {
      initiativeId: parsed.data.initiativeId,
      userId: auth.data.id,
      roleType: 'COORDINATOR',
      leftAt: null,
    },
    select: { id: true },
  });
  if (!isCreator && !isCoordinator) return { success: false, error: 'Unauthorized' };

  const updateData: Record<string, unknown> = { state: parsed.data.toState };

  if (parsed.data.toState === 'COMPLETED') {
    updateData.completedAt = new Date();
  }
  if (parsed.data.toState === 'ARCHIVED') {
    updateData.archivedAt = new Date();
    updateData.archiveReason = parsed.data.archiveReason;
  }
  if (parsed.data.toState === 'INTEGRATING') {
    const coordinators = await prisma.initiativeRole.findMany({
    where: {
      initiativeId: parsed.data.initiativeId,
      roleType: { in: ['COORDINATOR', 'STEWARD'] },
      leftAt: null,
    },
    select: { userId: true },
    take: 50,
  });
    await Promise.all(
      coordinators.map((r) =>
        prisma.notification.create({
          data: {
            userId: r.userId,
            type: 'ENGAGEMENT_COMPLETE_FEEDBACK',
            title: 'Write a retrospective for this initiative',
            message: 'This initiative is now integrating. Please submit a retrospective.',
            link: `/tasks/initiative/${parsed.data.initiativeId}`,
          },
        }),
      ),
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.initiative.update({
      where: { id: parsed.data.initiativeId },
      data: updateData,
    });

    if (parsed.data.toState === 'IN_PROGRESS') {
      await tx.taskMetric.upsert({
        where: { initiativeId: parsed.data.initiativeId },
        create: {
          initiativeId: parsed.data.initiativeId,
          startedAt: new Date(),
        },
        update: {
          startedAt: new Date(),
        },
      });
    }

    if (parsed.data.toState === 'COMPLETED') {
      const initiative = await tx.initiative.findUnique({
        where: { id: parsed.data.initiativeId },
        select: { createdAt: true },
      });
      if (initiative) {
        const now = new Date();
        const leadTimeHours = Math.floor(
          (now.getTime() - initiative.createdAt.getTime()) / (1000 * 60 * 60),
        );

        const existingMetric = await tx.taskMetric.findUnique({
          where: { initiativeId: parsed.data.initiativeId },
          select: { startedAt: true },
        });

        let cycleTimeHours: number | null = null;
        let waitTimeHours: number | null = null;

        if (existingMetric?.startedAt) {
          cycleTimeHours = Math.floor(
            (now.getTime() - existingMetric.startedAt.getTime()) / (1000 * 60 * 60),
          );
          waitTimeHours = leadTimeHours - cycleTimeHours;
        }

        await tx.taskMetric.upsert({
          where: { initiativeId: parsed.data.initiativeId },
          create: {
            initiativeId: parsed.data.initiativeId,
            startedAt: existingMetric?.startedAt,
            completedAt: now,
            cycleTime: cycleTimeHours,
            leadTime: leadTimeHours,
            waitTime: waitTimeHours,
          },
          update: {
            completedAt: now,
            cycleTime: cycleTimeHours,
            leadTime: leadTimeHours,
            waitTime: waitTimeHours,
          },
        });
      }
    }
  });

  revalidateTag(initiativeTag(parsed.data.initiativeId), 'default');
  revalidateTag(CACHE_TAG_INITIATIVES, 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// ROLES
// ─────────────────────────────────────────

export async function addInitiativeRoleAction(
  input: AddInitiativeRoleInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('addInitiativeRoleAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = addInitiativeRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const role = await prisma.initiativeRole.create({
    data: {
      initiativeId: parsed.data.initiativeId,
      userId: auth.data.id,
      roleType: parsed.data.roleType as never,
      contributionType: parsed.data.contributionType,
    },
    select: { id: true },
  });

  revalidateTag(initiativeTag(parsed.data.initiativeId), 'default');
  return { success: true, data: role };
  });
}

export async function removeInitiativeRoleAction(roleId: string): Promise<ApiResponse<void>> {
  return runAction('removeInitiativeRoleAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const role = await prisma.initiativeRole.findUnique({
    where: { id: roleId },
    select: { userId: true, initiativeId: true },
  });
  if (!role || role.userId !== auth.data.id) return { success: false, error: 'Not found' };

  await prisma.initiativeRole.update({
    where: { id: roleId },
    data: { leftAt: new Date() },
  });

  revalidateTag(initiativeTag(role.initiativeId), 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// UPDATES (narrative stream)
// ─────────────────────────────────────────

export async function addInitiativeUpdateAction(
  input: AddInitiativeUpdateInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('addInitiativeUpdateAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = addInitiativeUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  // Any role member can post an update
const hasRole = await prisma.initiativeRole.findFirst({
		where: { initiativeId: parsed.data.initiativeId, userId: auth.data.id, leftAt: null },
		select: { id: true },
	});
  if (!hasRole) {
    return { success: false, error: 'You must have a role in this initiative to post updates' };
  }

  const update = await prisma.initiativeUpdate.create({
    data: {
      initiativeId: parsed.data.initiativeId,
      authorId: auth.data.id,
      narrative: parsed.data.narrative,
      whatShifting: parsed.data.whatShifting ?? null,
      whatHard: parsed.data.whatHard ?? null,
      helpNeeded: parsed.data.helpNeeded ?? null,
    },
    select: { id: true },
  });

  revalidateTag(initiativeTag(parsed.data.initiativeId), 'default');
  return { success: true, data: update };
  });
}

// ─────────────────────────────────────────
// RETROSPECTIVE
// ─────────────────────────────────────────

export async function submitRetrospectiveAction(
  input: SubmitRetrospectiveInput,
): Promise<ApiResponse<void>> {
  return runAction('submitRetrospectiveAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = submitRetrospectiveSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

const initiative = await prisma.initiative.findUnique({
		where: { id: parsed.data.initiativeId },
		select: {
			id: true,
			state: true,
			retrospective: { select: { id: true } },
		},
	});
  if (!initiative) return { success: false, error: 'Initiative not found' };
  if (!['INTEGRATING', 'COMPLETED'].includes(initiative.state)) {
    return { success: false, error: 'Retrospective requires initiative to be in INTEGRATING or COMPLETED state' };
  }
  if (initiative.retrospective) {
    return { success: false, error: 'Retrospective already submitted' };
  }

  // Only coordinators/stewards can submit
const hasRole = await prisma.initiativeRole.findFirst({
		where: {
			initiativeId: parsed.data.initiativeId,
			userId: auth.data.id,
			roleType: { in: ['COORDINATOR', 'STEWARD'] },
			leftAt: null,
		},
		select: { id: true },
	});
  if (!hasRole) return { success: false, error: 'Only coordinators or stewards can submit retrospectives' };

  await prisma.initiativeRetrospective.create({
    data: {
      initiativeId: parsed.data.initiativeId,
      publicNarrative: parsed.data.publicNarrative,
    },
  });

  revalidateTag(initiativeTag(parsed.data.initiativeId), 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// BACKLOG
async function canAccessBacklogItem(userId: string, item: { communityId: string | null }): Promise<boolean> {
  if (!item.communityId) return true;
  const membership = await prisma.communityMember.findFirst({
    where: { communityId: item.communityId, userId, status: 'ACTIVE' },
    select: { id: true },
  });
  return !!membership;
}

async function getBacklogCommunityIdsForUser(userId: string): Promise<string[]> {
  const memberships = await prisma.communityMember.findMany({
    where: { userId, status: 'ACTIVE' },
    select: { communityId: true },
  });
  return memberships.map((membership) => membership.communityId);
}
// ─────────────────────────────────────────

export async function createBacklogItemAction(
  input: CreateBacklogItemInput,
): Promise<ApiResponse<{ id: string }>> {
  return runAction('createBacklogItemAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createBacklogItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  if (parsed.data.communityId) {
    const canCreateInCommunity = await canAccessBacklogItem(auth.data.id, { communityId: parsed.data.communityId });
    if (!canCreateInCommunity) return { success: false, error: 'Not a member of this community' };
  }

  const item = await prisma.backlogItem.create({
    data: { ...parsed.data, createdById: auth.data.id },
    select: { id: true },
  });

  revalidateTag(CACHE_TAG_BACKLOG, 'default');
  return { success: true, data: item };
  });
}

export async function flagBacklogResonanceAction(backlogItemId: string): Promise<ApiResponse<void>> {
  return runAction('flagBacklogResonanceAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const item = await prisma.backlogItem.findUnique({
    where: { id: backlogItemId },
    select: { communityId: true },
  });
  if (!item || !(await canAccessBacklogItem(auth.data.id, item))) {
    return { success: false, error: 'Backlog item not found' };
  }

  const existing = await prisma.backlogResonance.findUnique({
    where: { backlogItemId_userId: { backlogItemId, userId: auth.data.id } },
    select: { id: true },
  });
  if (existing) return { success: true, data: undefined };

  await prisma.$transaction(async (tx) => {
    await tx.backlogResonance.create({
      data: { backlogItemId, userId: auth.data.id },
    });
    await tx.backlogItem.update({
      where: { id: backlogItemId },
      data: { communityResonance: { increment: 1 } },
    });
  });

  revalidateTag(CACHE_TAG_BACKLOG, 'default');
  return { success: true, data: undefined };
  });
}

export async function unflagBacklogResonanceAction(backlogItemId: string): Promise<ApiResponse<void>> {
  return runAction('unflagBacklogResonanceAction', async () => {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const item = await prisma.backlogItem.findUnique({
    where: { id: backlogItemId },
    select: { communityId: true },
  });
  if (!item || !(await canAccessBacklogItem(auth.data.id, item))) {
    return { success: false, error: 'Backlog item not found' };
  }

  const existing = await prisma.backlogResonance.findUnique({
    where: { backlogItemId_userId: { backlogItemId, userId: auth.data.id } },
    select: { id: true },
  });
  if (!existing) return { success: false, error: 'Resonance not found' };

  await prisma.$transaction(async (tx) => {
    await tx.backlogResonance.delete({
      where: { backlogItemId_userId: { backlogItemId, userId: auth.data.id } },
    });
    await tx.backlogItem.updateMany({
      where: { id: backlogItemId, communityResonance: { gt: 0 } },
      data: { communityResonance: { decrement: 1 } },
    });
  });

  revalidateTag(CACHE_TAG_BACKLOG, 'default');
  return { success: true, data: undefined };
  });
}

// ─────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────

export async function getInitiativesAction(filters?: {
state?: string;
communityId?: string;
}) {
return prisma.initiative.findMany({
where: {
state: { notIn: ['ARCHIVED'] as never[] },
...(filters?.state ? { state: filters.state as never } : {}),
...(filters?.communityId ? { communityId: filters.communityId } : {}),
},
select: {
id: true,
title: true,
description: true,
why: true,
state: true,
createdAt: true,
updatedAt: true,
createdBy: { select: { id: true, name: true, profilePhoto: true } },
roles: {
where: { leftAt: null },
select: {
id: true,
roleType: true,
contributionType: true,
user: { select: { id: true, name: true, profilePhoto: true } }
},
},
_count: { select: { updates: true } },
retrospective: { select: { id: true } },
},
orderBy: { updatedAt: 'desc' },
take: 100,
});
}

export async function getInitiativeAction(id: string) {
return prisma.initiative.findUnique({
where: { id },
select: {
id: true,
title: true,
description: true,
why: true,
state: true,
createdAt: true,
updatedAt: true,
createdBy: { select: { id: true, name: true, profilePhoto: true } },
roles: {
where: { leftAt: null },
select: {
id: true,
roleType: true,
contributionType: true,
user: { select: { id: true, name: true, displayName: true, profilePhoto: true } }
},
},
updates: {
select: {
id: true,
narrative: true,
whatShifting: true,
whatHard: true,
helpNeeded: true,
createdAt: true,
author: { select: { id: true, name: true, profilePhoto: true } }
},
orderBy: { createdAt: 'desc' },
},
retrospective: { select: { id: true, publicNarrative: true } },
},
});
}

export async function getBacklogAction(communityId?: string) {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return [];

  const communityIds = await getBacklogCommunityIdsForUser(auth.data.id);
  if (communityId && !communityIds.includes(communityId)) return [];

  return prisma.backlogItem.findMany({
    where: communityId
      ? { communityId }
      : { OR: [{ communityId: null }, { communityId: { in: communityIds } }] },
		select: {
			id: true,
			title: true,
			description: true,
			communityResonance: true,
			createdAt: true,
			createdBy: { select: { id: true, name: true } },
			_count: { select: { resonances: true } },
		},
		orderBy: { communityResonance: 'desc' },
		take: 100,
	});
}
