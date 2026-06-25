'use server';
import { flattenError } from 'zod';

import { revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  createEnergyCanvasSchema,
  updateEnergyCanvasSchema,
  type CreateEnergyCanvasInput,
  type UpdateEnergyCanvasInput,
} from '@/lib/validations/energy';
import { energyCanvasTag, CACHE_TAG_ENERGY_CANVASES } from '@/lib/cache-tags';
import type { ApiResponse } from '@/types/modalities';

export async function createEnergyCanvasAction(
  input: CreateEnergyCanvasInput,
): Promise<ApiResponse<{ id: string }>> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createEnergyCanvasSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  if (parsed.data.privacy === 'MY_COMMUNITY' && parsed.data.communityId) {
    const membership = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: parsed.data.communityId,
          userId: auth.data.id,
        },
      },
      select: { id: true, status: true },
    });
    if (membership?.status !== 'ACTIVE') {
      return { success: false, error: 'Must be community member' };
    }
  }

  const canvas = await prisma.energyCanvas.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      privacy: parsed.data.privacy,
      communityId: parsed.data.communityId ?? null,
      systemState: 'CONTESTED',
      createdById: auth.data.id,
    },
    select: { id: true },
  });

  revalidateTag(energyCanvasTag(canvas.id), 'default');
  revalidateTag(CACHE_TAG_ENERGY_CANVASES, 'default');
  return { success: true, data: canvas };
}

export async function updateEnergyCanvasAction(
  id: string,
  input: UpdateEnergyCanvasInput,
): Promise<ApiResponse<{ id: string }>> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const canvas = await prisma.energyCanvas.findUnique({
    where: { id, deletedAt: null },
    select: { createdById: true },
  });
  if (!canvas || canvas.createdById !== auth.data.id) {
    return { success: false, error: 'Not found' };
  }

  const parsed = updateEnergyCanvasSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  await prisma.energyCanvas.update({
    where: { id },
    data: parsed.data,
  });

  revalidateTag(energyCanvasTag(id), 'default');
  return { success: true, data: { id } };
}

export async function archiveEnergyCanvasAction(id: string): Promise<ApiResponse<void>> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const canvas = await prisma.energyCanvas.findUnique({
    where: { id, deletedAt: null },
    select: { createdById: true },
  });
  if (!canvas || canvas.createdById !== auth.data.id) {
    return { success: false, error: 'Not found' };
  }

  await prisma.energyCanvas.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidateTag(energyCanvasTag(id), 'default');
  revalidateTag(CACHE_TAG_ENERGY_CANVASES, 'default');
  return { success: true, data: undefined };
}

export async function getEnergyCanvasAction(id: string) {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return null;
  const userId = auth.data.id;

  const memberships = await prisma.communityMember.findMany({
    where: { userId, status: 'ACTIVE' },
    select: { communityId: true },
    take: 100,
  });
  const memberCommunityIds = memberships.map(m => m.communityId);

  // findFirst is required because the OR visibility filter is not a unique lookup.
  return prisma.energyCanvas.findFirst({
    where: {
      id,
      deletedAt: null,
      OR: [
        { privacy: 'PUBLIC' },
        { privacy: 'MY_COMMUNITY', communityId: { in: memberCommunityIds } },
        { createdById: userId },
      ],
    },
    select: {
      id: true,
      title: true,
      description: true,
      systemState: true,
      stateReason: true,
      privacy: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: { id: true, name: true, profilePhoto: true },
      },
      entities: {
        where: { deletedAt: null },
        select: {
          id: true,
          roleLabel: true,
          entityType: true,
          primaryScale: true,
          multiScale: true,
          visibility: true,
          energyState: true,
          energyMagnitude: true,
          energyRate: true,
          internalPower: true,
          numericValue: true,
          numericUnit: true,
          voiceAccess: true,
          boundaryPermeability: true,
          selfDetermination: true,
          positionX: true,
          positionY: true,
          scaleBandY: true,
          notes: true,
          widgetContent: true,
          uncertaintyFlag: true,
          createdAt: true,
        },
      },
      relations: {
        where: { deletedAt: null },
        select: {
          id: true,
          fromEntityId: true,
          toEntityId: true,
          powerDistance: true,
          energyFlow: true,
          informationFlow: true,
          visibility: true,
          consent: true,
          energyMagnitude: true,
          numericValue: true,
          numericUnit: true,
          isCrossScale: true,
          patternDetected: true,
          notes: true,
          uncertaintyFlag: true,
        },
      },
    },
  });
}

export async function getEnergyCanvasesAction(communityId?: string) {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return [];
  const userId = auth.data.id;

  const memberships = await prisma.communityMember.findMany({
    where: { userId, status: 'ACTIVE' },
    select: { communityId: true },
    take: 100,
  });
  const memberCommunityIds = memberships.map(m => m.communityId);

  return prisma.energyCanvas.findMany({
    where: {
      deletedAt: null,
      ...(communityId ? { communityId } : {}),
      OR: [
        { privacy: 'PUBLIC' },
        { privacy: 'MY_COMMUNITY', communityId: { in: memberCommunityIds } },
        { createdById: userId },
      ],
    },
    select: {
      id: true,
      title: true,
      description: true,
      systemState: true,
      privacy: true,
      createdAt: true,
      updatedAt: true,
      createdBy: {
        select: { id: true, name: true },
      },
      _count: {
        select: { entities: { where: { deletedAt: null } }, relations: { where: { deletedAt: null } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
}
