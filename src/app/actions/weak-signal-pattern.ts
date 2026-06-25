'use server';

import { logActionError } from '@/lib/action-logger';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/app/actions/auth';
import { canModerateContent } from '@/lib/permissions';
import type {
  WeakSignalPattern,
  ApiResponse,
} from '@/types/weak-signal';
import type {
  PatternTrajectory,
  PatternLibraryStatus,
} from '@/lib/prisma';
import { createPatternSchema } from '@/lib/validations/weak-signal';
import { normalizeOffsetPagination } from '@/lib/pagination';
import { assertCanonicalRdgIds } from '@/lib/taxonomy';

export async function createWeakSignalPattern(
  data: Record<string, unknown>
): Promise<ApiResponse<WeakSignalPattern>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const validated = createPatternSchema.parse(data);

    const pattern = await prisma.weakSignalPattern.create({
      data: {
        name: validated.name,
        description: validated.description,
        trajectory: validated.trajectory as PatternTrajectory,
        hypothesis: validated.hypothesis || null,
        relatedRdgs: validated.relatedRdgs || [],
        status: 'PROPOSED' as PatternLibraryStatus,
        proposedById: currentUser.data.user.id,
      },
      include: {
        proposedBy: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
        _count: { select: { signals: true } },
      },
    });

    revalidatePath('/signals/patterns');

    return {
      success: true,
      data: {
        ...pattern,
        signalCount: pattern._count?.signals ?? 0,
      } as unknown as WeakSignalPattern,
    };
  } catch (error: unknown) {
    logActionError('Error creating pattern', error);
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues: { path: string[]; message: string }[] };
      const errors: Record<string, string[]> = {};
      zodError.issues.forEach((issue) => {
        const key = issue.path.join('.') || 'form';
        if (!errors[key]) errors[key] = [];
        errors[key].push(issue.message);
      });
      return { success: false, errors };
    }
    return { success: false, error: 'Failed to create pattern' };
  }
}

export async function getWeakSignalPatterns(
  filters?: { trajectory?: string; status?: string; skip?: number; take?: number }
): Promise<ApiResponse<WeakSignalPattern[]>> {
  try {
    const where: Record<string, unknown> = {};
    if (filters?.trajectory) where.trajectory = filters.trajectory;
    if (filters?.status) where.status = filters.status;

    const { skip, take } = normalizeOffsetPagination(filters);

    const patterns = await prisma.weakSignalPattern.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        proposedBy: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
        _count: { select: { signals: true } },
      },
    });

    return {
      success: true,
      data: patterns.map((p) => ({
        ...p,
        signalCount: p._count?.signals ?? 0,
      })) as unknown as WeakSignalPattern[],
    };
  } catch (error: unknown) {
    logActionError('Error fetching patterns', error);
    return { success: false, error: 'Failed to fetch patterns' };
  }
}

export async function getWeakSignalPatternById(
  id: string
): Promise<ApiResponse<WeakSignalPattern & { signals: unknown[] }>> {
  try {
    const pattern = await prisma.weakSignalPattern.findUnique({
      where: { id },
      include: {
        proposedBy: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
        _count: { select: { signals: true } },
        signals: {
          where: { deletedAt: null },
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { resonances: true, corroborations: true } },
            resonances: { select: { vote: true } },
            createdBy: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
          },
        },
      },
    });

    if (!pattern) {
      return { success: false, error: 'Pattern not found' };
    }

    return {
      success: true,
      data: {
        ...pattern,
        signalCount: pattern._count?.signals ?? 0,
      } as unknown as WeakSignalPattern & { signals: unknown[] },
    };
  } catch (error: unknown) {
    logActionError('Error fetching pattern', error);
    return { success: false, error: 'Failed to fetch pattern' };
  }
}

export async function updateWeakSignalPattern(
  id: string,
  data: Record<string, unknown>
): Promise<ApiResponse<WeakSignalPattern>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const existing = await prisma.weakSignalPattern.findUnique({
      where: { id },
      select: { proposedById: true },
    });

    if (!existing) {
      return { success: false, error: 'Pattern not found' };
    }

    if (existing.proposedById !== currentUser.data.user.id) {
      return { success: false, error: 'Not authorized to edit this pattern' };
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name as string;
    if (data.description !== undefined) updateData.description = data.description as string;
    if (data.trajectory !== undefined) updateData.trajectory = data.trajectory as PatternTrajectory;
    if (data.hypothesis !== undefined) updateData.hypothesis = (data.hypothesis as string) || null;
    if (data.relatedRdgs !== undefined) updateData.relatedRdgs = assertCanonicalRdgIds(data.relatedRdgs as string[]);

    const pattern = await prisma.weakSignalPattern.update({
      where: { id },
      data: updateData,
      include: {
        proposedBy: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
        _count: { select: { signals: true } },
      },
    });

    revalidatePath('/signals/patterns');
    revalidatePath(`/signals/patterns/${id}`);

    return {
      success: true,
      data: {
        ...pattern,
        signalCount: pattern._count?.signals ?? 0,
      } as unknown as WeakSignalPattern,
    };
  } catch (error: unknown) {
    logActionError('Error updating pattern', error);
    return { success: false, error: 'Failed to update pattern' };
  }
}

export async function addSignalToPattern(
  signalId: string,
  patternId: string
): Promise<ApiResponse<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const signal = await prisma.weakSignal.findUnique({
      where: { id: signalId },
      select: { createdById: true, deletedAt: true },
    });

    if (!signal || signal.deletedAt) {
      return { success: false, error: 'Signal not found' };
    }

    if (signal.createdById !== currentUser.data.user.id) {
      return { success: false, error: 'Not authorized to link this signal' };
    }

    const pattern = await prisma.weakSignalPattern.findUnique({
      where: { id: patternId },
      select: { id: true },
    });

    if (!pattern) {
      return { success: false, error: 'Pattern not found' };
    }

    await prisma.weakSignal.update({
      where: { id: signalId },
      data: { patternId },
    });

    revalidatePath('/signals/patterns');
    revalidatePath(`/signals/patterns/${patternId}`);
    revalidatePath(`/signals/${signalId}`);

    return { success: true, data: undefined };
  } catch (error: unknown) {
    logActionError('Error adding signal to pattern', error);
    return { success: false, error: 'Failed to add signal to pattern' };
  }
}

export async function removeSignalFromPattern(
  signalId: string
): Promise<ApiResponse<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const signal = await prisma.weakSignal.findUnique({
      where: { id: signalId },
      select: { createdById: true, patternId: true },
    });

    if (!signal) {
      return { success: false, error: 'Signal not found' };
    }

    if (signal.createdById !== currentUser.data.user.id) {
      return { success: false, error: 'Not authorized to unlink this signal' };
    }

    if (!signal.patternId) {
      return { success: false, error: 'Signal is not linked to any pattern' };
    }

    const patternId = signal.patternId;

    await prisma.weakSignal.update({
      where: { id: signalId },
      data: { patternId: null },
    });

    revalidatePath('/signals/patterns');
    revalidatePath(`/signals/patterns/${patternId}`);
    revalidatePath(`/signals/${signalId}`);

    return { success: true, data: undefined };
  } catch (error: unknown) {
    logActionError('Error removing signal from pattern', error);
    return { success: false, error: 'Failed to remove signal from pattern' };
  }
}

export async function promoteClusterToPattern(
  clusterData: {
    name: string;
    description: string;
    trajectory: string;
    hypothesis?: string;
    relatedRdgs?: string[];
    signalIds: string[];
  }
): Promise<ApiResponse<WeakSignalPattern>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!canModerateContent(currentUser.data.user)) {
      return { success: false, error: 'Not authorized to promote clusters' };
    }

    if (clusterData.signalIds.length > 100) {
      return { success: false, error: 'Too many signals in cluster promotion' };
    }

    const validated = createPatternSchema.parse(clusterData);
    const signalIds = [...new Set(clusterData.signalIds.filter((id) => typeof id === 'string' && id.length > 0))];

    const pattern = await prisma.weakSignalPattern.create({
      data: {
        name: validated.name,
        description: validated.description,
        trajectory: validated.trajectory as PatternTrajectory,
        hypothesis: validated.hypothesis || null,
        relatedRdgs: validated.relatedRdgs || [],
        status: 'PROPOSED' as PatternLibraryStatus,
        proposedById: currentUser.data.user.id,
      },
    });

    if (signalIds.length > 0) {
      await prisma.weakSignal.updateMany({
        where: {
          id: { in: signalIds },
          deletedAt: null,
        },
        data: { patternId: pattern.id },
      });
    }

    revalidatePath('/signals/patterns');
    revalidatePath('/signals');

    const result = await prisma.weakSignalPattern.findUnique({
      where: { id: pattern.id },
      include: {
        proposedBy: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
        _count: { select: { signals: true } },
      },
    });

    return {
      success: true,
      data: {
        ...result,
        signalCount: result?._count?.signals ?? 0,
      } as unknown as WeakSignalPattern,
    };
  } catch (error: unknown) {
    logActionError('Error promoting cluster to pattern', error);
    return { success: false, error: 'Failed to promote cluster to pattern' };
  }
}
