'use server';
import { flattenError } from 'zod';

import { revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  createEnergyRelationSchema,
  updateEnergyRelationSchema,
  type CreateEnergyRelationInput,
  type UpdateEnergyRelationInput,
} from '@/lib/validations/energy';
import { energyCanvasTag } from '@/lib/cache-tags';
import { getEnergyCanvasWriteAccess } from '@/app/actions/energy/access';
import type { ApiResponse } from '@/types/modalities';

export async function createEnergyRelationAction(
  input: CreateEnergyRelationInput,
): Promise<ApiResponse<{ id: string }>> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createEnergyRelationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const canvas = await getEnergyCanvasWriteAccess(parsed.data.canvasId, auth.data.id);
  if (!canvas) return { success: false, error: 'Canvas not found' };

  const [fromEntity, toEntity] = await Promise.all([
    prisma.energyEntity.findUnique({
      where: { id: parsed.data.fromEntityId, deletedAt: null },
      select: { canvasId: true, primaryScale: true },
    }),
    prisma.energyEntity.findUnique({
      where: { id: parsed.data.toEntityId, deletedAt: null },
      select: { canvasId: true, primaryScale: true },
    }),
  ]);

  if (!fromEntity || !toEntity) {
    return { success: false, error: 'Entity not found' };
  }
  if (fromEntity.canvasId !== parsed.data.canvasId || toEntity.canvasId !== parsed.data.canvasId) {
    return { success: false, error: 'Entities must be on the same canvas' };
  }

  const isCrossScale = fromEntity.primaryScale !== toEntity.primaryScale;

  const relation = await prisma.energyRelation.create({
    data: {
      canvasId: parsed.data.canvasId,
      fromEntityId: parsed.data.fromEntityId,
      toEntityId: parsed.data.toEntityId,
      powerDistance: parsed.data.powerDistance as never,
      energyFlow: parsed.data.energyFlow as never,
      informationFlow: parsed.data.informationFlow as never,
      visibility: parsed.data.visibility as never,
      consent: parsed.data.consent as never,
      energyMagnitude: parsed.data.energyMagnitude as never,
      numericValue: parsed.data.numericValue ?? null,
      numericUnit: parsed.data.numericUnit ?? null,
      isCrossScale: parsed.data.isCrossScale ?? isCrossScale,
      notes: parsed.data.notes ?? null,
      uncertaintyFlag: parsed.data.uncertaintyFlag ?? false,
      createdById: auth.data.id,
    },
    select: { id: true },
  });

  revalidateTag(energyCanvasTag(parsed.data.canvasId), 'default');
  return { success: true, data: { id: relation.id } };
}

function buildRelationUpdateData(data: UpdateEnergyRelationInput): Record<string, unknown> {
  const updateData: Record<string, unknown> = {};
  if (data.powerDistance) updateData.powerDistance = data.powerDistance;
  if (data.energyFlow) updateData.energyFlow = data.energyFlow;
  if (data.informationFlow) updateData.informationFlow = data.informationFlow;
  if (data.visibility) updateData.visibility = data.visibility;
  if (data.consent) updateData.consent = data.consent;
  if (data.energyMagnitude) updateData.energyMagnitude = data.energyMagnitude;
  if (data.numericValue !== undefined) updateData.numericValue = data.numericValue;
  if (data.numericUnit !== undefined) updateData.numericUnit = data.numericUnit;
  if (data.isCrossScale !== undefined) updateData.isCrossScale = data.isCrossScale;
  if (data.patternDetected !== undefined) updateData.patternDetected = data.patternDetected;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.uncertaintyFlag !== undefined) updateData.uncertaintyFlag = data.uncertaintyFlag;
  return updateData;
}

export async function updateEnergyRelationAction(
  id: string,
  input: UpdateEnergyRelationInput,
): Promise<ApiResponse<{ id: string }>> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const relation = await prisma.energyRelation.findUnique({
    where: { id, deletedAt: null },
    select: { canvasId: true },
  });
  if (!relation) return { success: false, error: 'Not found' };
  const canvas = await getEnergyCanvasWriteAccess(relation.canvasId, auth.data.id);
  if (!canvas) return { success: false, error: 'Not found' };

  const parsed = updateEnergyRelationSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const updateData = buildRelationUpdateData(parsed.data);

  await prisma.energyRelation.update({ where: { id }, data: updateData });

  revalidateTag(energyCanvasTag(relation.canvasId), 'default');
  return { success: true, data: { id } };
}

export async function softDeleteEnergyRelationAction(id: string): Promise<ApiResponse<void>> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const relation = await prisma.energyRelation.findUnique({
    where: { id, deletedAt: null },
    select: { canvasId: true },
  });
  if (!relation) return { success: false, error: 'Not found' };
  const canvas = await getEnergyCanvasWriteAccess(relation.canvasId, auth.data.id);
  if (!canvas) return { success: false, error: 'Not found' };

  await prisma.energyRelation.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  revalidateTag(energyCanvasTag(relation.canvasId), 'default');
  return { success: true, data: undefined };
}
