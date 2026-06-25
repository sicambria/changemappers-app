'use server';

import { logActionError } from '@/lib/action-logger';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/app/actions/auth';
import { canModerateContent } from '@/lib/permissions';
import type { SignalCollection, ApiResponse } from '@/types/weak-signal';
import { shouldSuppressPrismaErrorLogForBuild } from '@/lib/prisma-build-env';
import { createCollectionSchema } from '@/lib/validations/weak-signal';
import { normalizeOffsetPagination } from '@/lib/pagination';

export async function createSignalCollection(
  data: Record<string, unknown>
): Promise<ApiResponse<SignalCollection>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const validated = createCollectionSchema.parse(data);

    const collection = await prisma.signalCollection.create({
      data: {
        name: validated.name,
        description: validated.description || null,
        createdById: currentUser.data.user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
        _count: { select: { items: true } },
      },
    });

    revalidatePath('/signals/collections');

    return {
      success: true,
      data: {
        ...collection,
        signalCount: collection._count?.items ?? 0,
      } as unknown as SignalCollection,
    };
  } catch (error: unknown) {
    logActionError('Error creating collection', error);
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
    return { success: false, error: 'Failed to create collection' };
  }
}

export async function getSignalCollections(
  filters?: { isFeatured?: boolean; createdById?: string; skip?: number; take?: number }
): Promise<ApiResponse<SignalCollection[]>> {
  try {
    if (shouldSuppressPrismaErrorLogForBuild(process.env.DATABASE_URL)) {
      return { success: true, data: [] };
    }

    const where: Record<string, unknown> = {};
    if (filters?.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
    if (filters?.createdById) where.createdById = filters.createdById;

    const { skip, take } = normalizeOffsetPagination(filters);

    const collections = await prisma.signalCollection.findMany({
      where,
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take,
      include: {
        createdBy: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
        _count: { select: { items: true } },
      },
    });

    return {
      success: true,
      data: collections.map((c) => ({
        ...c,
        signalCount: c._count?.items ?? 0,
      })) as unknown as SignalCollection[],
    };
  } catch (error: unknown) {
    logActionError('Error fetching collections', error);
    return { success: false, error: 'Failed to fetch collections' };
  }
}

export async function getSignalCollectionById(
  id: string
): Promise<ApiResponse<SignalCollection & { items: unknown[] }>> {
  try {
    const collection = await prisma.signalCollection.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
        _count: { select: { items: true } },
      items: {
        orderBy: { addedAt: 'desc' },
        take: 50,
        include: {
          signal: {
            select: {
              id: true,
              title: true,
              domain: true,
              confidence: true,
              novelty: true,
              tags: true,
              createdById: true,
              createdAt: true,
            },
          },
            addedBy: { select: { id: true, name: true, displayName: true } },
          },
        },
      },
    });

    if (!collection) {
      return { success: false, error: 'Collection not found' };
    }

  return {
    success: true,
    data: {
      ...collection,
      signalCount: (collection as Record<string, unknown>)._count
        ? ((collection as Record<string, unknown>)._count as Record<string, number>).items ?? 0
        : 0,
    } as unknown as SignalCollection & { items: unknown[] },
  };
  } catch (error: unknown) {
    logActionError('Error fetching collection', error);
    return { success: false, error: 'Failed to fetch collection' };
  }
}

export async function addSignalToCollection(
  signalId: string,
  collectionId: string,
  note?: string
): Promise<ApiResponse<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const signal = await prisma.weakSignal.findUnique({
      where: { id: signalId },
      select: { id: true, deletedAt: true },
    });

    if (!signal || signal.deletedAt) {
      return { success: false, error: 'Signal not found' };
    }

    const collection = await prisma.signalCollection.findUnique({
      where: { id: collectionId },
      select: { id: true, createdById: true },
    });

    if (!collection) {
      return { success: false, error: 'Collection not found' };
    }

    const userId = currentUser.data.user.id;
    const canModerate = canModerateContent(currentUser.data.user);
    if (collection.createdById !== userId && !canModerate) {
      return { success: false, error: 'Not authorized to update this collection' };
    }

    await prisma.signalCollectionItem.upsert({
      where: { collectionId_signalId: { collectionId, signalId } },
      create: {
        collectionId,
        signalId,
        addedById: userId,
        note: note || null,
      },
      update: {
        note: note || null,
      },
    });

    revalidatePath('/signals/collections');
    revalidatePath(`/signals/collections/${collectionId}`);

    return { success: true, data: undefined };
  } catch (error: unknown) {
    logActionError('Error adding signal to collection', error);
    return { success: false, error: 'Failed to add signal to collection' };
  }
}

export async function removeSignalFromCollection(
  signalId: string,
  collectionId: string
): Promise<ApiResponse<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const collection = await prisma.signalCollection.findUnique({
      where: { id: collectionId },
      select: { id: true, createdById: true },
    });

    if (!collection) {
      return { success: false, error: 'Collection not found' };
    }

    const userId = currentUser.data.user.id;
    const canModerate = canModerateContent(currentUser.data.user);
    if (collection.createdById !== userId && !canModerate) {
      return { success: false, error: 'Not authorized to update this collection' };
    }

    await prisma.signalCollectionItem.deleteMany({
      where: { collectionId, signalId },
    });

    revalidatePath('/signals/collections');
    revalidatePath(`/signals/collections/${collectionId}`);

    return { success: true, data: undefined };
  } catch (error: unknown) {
    logActionError('Error removing signal from collection', error);
    return { success: false, error: 'Failed to remove signal from collection' };
  }
}

export async function toggleCollectionFeatured(
  collectionId: string
): Promise<ApiResponse<SignalCollection>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!canModerateContent(currentUser.data.user)) {
      return { success: false, error: 'Not authorized to feature collections' };
    }

    const collection = await prisma.signalCollection.findUnique({
      where: { id: collectionId },
      select: { isFeatured: true },
    });

    if (!collection) {
      return { success: false, error: 'Collection not found' };
    }

    const updated = await prisma.signalCollection.update({
      where: { id: collectionId },
      data: { isFeatured: !collection.isFeatured },
      include: {
        createdBy: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
        _count: { select: { items: true } },
      },
    });

    revalidatePath('/signals/collections');

    return {
      success: true,
      data: {
        ...updated,
        signalCount: updated._count?.items ?? 0,
      } as unknown as SignalCollection,
    };
  } catch (error: unknown) {
    logActionError('Error toggling collection featured', error);
    return { success: false, error: 'Failed to toggle featured status' };
  }
}
