'use server';

import { logActionError } from '@/lib/action-logger';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/app/actions/auth';
import { canContributeToInitiative, canModerateContent, getCommunityRole } from '@/lib/permissions';
import type { ApiResponse } from '@/types/weak-signal';

export async function linkSignalToProject(
  signalId: string,
  projectId: string,
  note?: string
): Promise<ApiResponse<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const signal = await prisma.weakSignal.findUnique({
      where: { id: signalId },
      select: { id: true, deletedAt: true, createdById: true },
    });

    if (!signal || signal.deletedAt) {
      return { success: false, error: 'Signal not found' };
    }

    const userId = currentUser.data.user.id;
    const canModerate = canModerateContent(currentUser.data.user);
    if (signal.createdById !== userId && !canModerate) {
      return { success: false, error: 'Not authorized to link this signal' };
    }

    // AUDIT-20260613-002: the caller must also have a relationship with the
    // target initiative; a generic message avoids an existence oracle.
    const canLinkTarget = await canContributeToInitiative(currentUser.data.user, projectId);
    if (!canLinkTarget) {
      return { success: false, error: 'Project not found or not authorized' };
    }

    await prisma.signalProjectLink.upsert({
      where: { signalId_projectId: { signalId, projectId } },
      create: {
        signalId,
        projectId,
        linkedById: userId,
        note: note || null,
      },
      update: {
        note: note || null,
      },
    });

    revalidatePath(`/signals/${signalId}`);

    return { success: true, data: undefined };
  } catch (error: unknown) {
    logActionError('Error linking signal to project', error);
    return { success: false, error: 'Failed to link signal to project' };
  }
}

export async function unlinkSignalFromProject(
  signalId: string,
  projectId: string
): Promise<ApiResponse<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const signal = await prisma.weakSignal.findUnique({
      where: { id: signalId },
      select: { id: true, deletedAt: true, createdById: true },
    });

    if (!signal || signal.deletedAt) {
      return { success: false, error: 'Signal not found' };
    }

    const userId = currentUser.data.user.id;
    const canModerate = canModerateContent(currentUser.data.user);
    if (signal.createdById !== userId && !canModerate) {
      return { success: false, error: 'Not authorized to unlink this signal' };
    }

    // AUDIT-20260613-002: the original linker may always remove their own
    // link (e.g. after leaving the initiative); anyone else needs target-side
    // rights or moderation powers.
    const existingLink = await prisma.signalProjectLink.findUnique({
      where: { signalId_projectId: { signalId, projectId } },
      select: { linkedById: true },
    });
    if (!existingLink) {
      return { success: true, data: undefined };
    }
    const canUnlinkTarget =
      existingLink.linkedById === userId ||
      canModerate ||
      (await canContributeToInitiative(currentUser.data.user, projectId));
    if (!canUnlinkTarget) {
      return { success: false, error: 'Project not found or not authorized' };
    }

    await prisma.signalProjectLink.deleteMany({
      where: { signalId, projectId },
    });

    revalidatePath(`/signals/${signalId}`);

    return { success: true, data: undefined };
  } catch (error: unknown) {
    logActionError('Error unlinking signal from project', error);
    return { success: false, error: 'Failed to unlink signal from project' };
  }
}

export async function linkSignalToCommunity(
  signalId: string,
  communityId: string,
  note?: string
): Promise<ApiResponse<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const signal = await prisma.weakSignal.findUnique({
      where: { id: signalId },
      select: { id: true, deletedAt: true, createdById: true },
    });

    if (!signal || signal.deletedAt) {
      return { success: false, error: 'Signal not found' };
    }

    const userId = currentUser.data.user.id;
    const canModerate = canModerateContent(currentUser.data.user);
    if (signal.createdById !== userId && !canModerate) {
      return { success: false, error: 'Not authorized to link this signal' };
    }

    // AUDIT-20260613-002: linking requires an active membership in the target
    // community (any role) or moderation powers; a generic message avoids an
    // existence oracle for non-public communities.
    const communityRole = canModerate ? null : await getCommunityRole(userId, communityId);
    if (!canModerate && communityRole === null) {
      return { success: false, error: 'Community not found or not authorized' };
    }

    await prisma.signalCommunityLink.upsert({
      where: { signalId_communityId: { signalId, communityId } },
      create: {
        signalId,
        communityId,
        linkedById: userId,
        note: note || null,
      },
      update: {
        note: note || null,
      },
    });

    revalidatePath(`/signals/${signalId}`);

    return { success: true, data: undefined };
  } catch (error: unknown) {
    logActionError('Error linking signal to community', error);
    return { success: false, error: 'Failed to link signal to community' };
  }
}

export async function unlinkSignalFromCommunity(
  signalId: string,
  communityId: string
): Promise<ApiResponse<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const signal = await prisma.weakSignal.findUnique({
      where: { id: signalId },
      select: { id: true, deletedAt: true, createdById: true },
    });

    if (!signal || signal.deletedAt) {
      return { success: false, error: 'Signal not found' };
    }

    const userId = currentUser.data.user.id;
    const canModerate = canModerateContent(currentUser.data.user);
    if (signal.createdById !== userId && !canModerate) {
      return { success: false, error: 'Not authorized to unlink this signal' };
    }

    // AUDIT-20260613-002: the original linker may always remove their own
    // link; anyone else needs community membership or moderation powers.
    const existingLink = await prisma.signalCommunityLink.findUnique({
      where: { signalId_communityId: { signalId, communityId } },
      select: { linkedById: true },
    });
    if (!existingLink) {
      return { success: true, data: undefined };
    }
    const canUnlinkTarget =
      existingLink.linkedById === userId ||
      canModerate ||
      (await getCommunityRole(userId, communityId)) !== null;
    if (!canUnlinkTarget) {
      return { success: false, error: 'Community not found or not authorized' };
    }

    await prisma.signalCommunityLink.deleteMany({
      where: { signalId, communityId },
    });

    revalidatePath(`/signals/${signalId}`);

    return { success: true, data: undefined };
  } catch (error: unknown) {
    logActionError('Error unlinking signal from community', error);
    return { success: false, error: 'Failed to unlink signal from community' };
  }
}

/**
 * AUDIT-20260613-023: bounded picker source for the signal→initiative link UI.
 * Lists initiatives the current user may contribute to (mirrors
 * `canContributeToInitiative`: platform admin/moderator → all; otherwise
 * creator, assignee, or an active role). A search filter and a hard cap are
 * applied on every path (the admin/moderator branch included) so the picker
 * never dumps the whole initiative table. Archived initiatives are excluded.
 * Server-side link authorization still runs independently (AUDIT-20260613-002);
 * this only makes the UI honest about what is selectable.
 */
export async function listContributableInitiativesAction(input?: {
  query?: string;
  limit?: number;
}): Promise<ApiResponse<Array<{ id: string; name: string }>>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const user = currentUser.data.user;
    const userId = user.id;
    const take = Math.min(Math.max(input?.limit ?? 10, 1), 25);
    const query = (input?.query ?? '').trim();

    const searchFilter = query
      ? { title: { contains: query, mode: 'insensitive' as const } }
      : {};

    const canModerate = canModerateContent(user);
    const scopeFilter = canModerate
      ? {}
      : {
          OR: [
            { createdById: userId },
            { assigneeId: userId },
            { roles: { some: { userId, leftAt: null } } },
          ],
        };

    const initiatives = await prisma.initiative.findMany({
      where: {
        archivedAt: null,
        ...searchFilter,
        ...scopeFilter,
      },
      select: { id: true, title: true },
      orderBy: { updatedAt: 'desc' },
      take,
    });

    return {
      success: true,
      data: initiatives.map((i) => ({ id: i.id, name: i.title })),
    };
  } catch (error: unknown) {
    logActionError('Error listing contributable initiatives', error);
    return { success: false, error: 'Failed to list initiatives' };
  }
}

export async function getSignalEntityLinks(signalId: string): Promise<ApiResponse<{
  projectLinks: unknown[];
  communityLinks: unknown[];
}>> {
  try {
    const [projectLinks, communityLinks] = await Promise.all([
    prisma.signalProjectLink.findMany({
    where: { signalId },
    take: 50,
    include: {
    linkedBy: { select: { id: true, name: true, displayName: true } },
    },
  }),
  prisma.signalCommunityLink.findMany({
    where: { signalId },
    take: 50,
    include: {
          community: { select: { id: true, name: true } },
          linkedBy: { select: { id: true, name: true, displayName: true } },
        },
      }),
    ]);

    return {
      success: true,
      data: { projectLinks, communityLinks },
    };
  } catch (error: unknown) {
    logActionError('Error fetching signal entity links', error);
    return { success: false, error: 'Failed to fetch entity links' };
  }
}
