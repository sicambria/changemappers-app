'use server';
import { flattenError } from 'zod';

import { revalidateTag } from 'next/cache';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import {
  createEnergyEntitySchema,
  updateEnergyEntitySchema,
  updateEnergyEntityPositionSchema,
  type CreateEnergyEntityInput,
  type UpdateEnergyEntityInput,
  type UpdateEnergyEntityPositionInput,
} from '@/lib/validations/energy';
import { energyCanvasTag } from '@/lib/cache-tags';
import { getEnergyCanvasWriteAccess } from '@/app/actions/energy/access';
import type { ApiResponse } from '@/types/modalities';

export async function createEnergyEntityAction(
  input: CreateEnergyEntityInput,
): Promise<ApiResponse<{ id: string }>> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = createEnergyEntitySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const canvas = await getEnergyCanvasWriteAccess(parsed.data.canvasId, auth.data.id);
  if (!canvas) return { success: false, error: 'Canvas not found' };

  // Entity create + audit log must be atomic (AUDIT-20260613-030).
  const entity = await prisma.$transaction(async (tx) => {
    const created = await tx.energyEntity.create({
      data: {
        canvasId: parsed.data.canvasId,
        roleLabel: parsed.data.roleLabel,
        entityType: parsed.data.entityType as never,
        primaryScale: parsed.data.primaryScale as never,
        multiScale: parsed.data.multiScale ?? [],
        visibility: parsed.data.visibility as never,
        energyState: parsed.data.energyState as never,
        energyMagnitude: parsed.data.energyMagnitude as never,
        energyRate: parsed.data.energyRate as never,
        internalPower: parsed.data.internalPower as never,
        numericValue: parsed.data.numericValue ?? null,
        numericUnit: parsed.data.numericUnit ?? null,
        voiceAccess: parsed.data.voiceAccess as never,
        boundaryPermeability: parsed.data.boundaryPermeability as never,
        selfDetermination: parsed.data.selfDetermination as never,
        positionX: parsed.data.positionX ?? 0,
        positionY: parsed.data.positionY ?? 0,
        scaleBandY: parsed.data.scaleBandY ?? 4,
        notes: parsed.data.notes ?? null,
        widgetContent: parsed.data.widgetContent ?? null,
        uncertaintyFlag: parsed.data.uncertaintyFlag ?? false,
        createdById: auth.data.id,
      },
      select: { id: true, canvasId: true },
    });

    await tx.auditLog.create({
      data: {
        entityType: 'EnergyEntity',
        entityId: created.id,
        action: 'CREATE',
        userId: auth.data.id,
        metadata: { roleLabel: parsed.data.roleLabel, entityType: parsed.data.entityType },
      },
    });

    return created;
  });

  revalidateTag(energyCanvasTag(entity.canvasId), 'default');
  return { success: true, data: { id: entity.id } };
}

// Fields included when truthy (falsy/undefined = omit)
const TRUTHY_UPDATE_FIELDS = [
  'roleLabel', 'entityType', 'primaryScale', 'visibility',
  'energyState', 'energyMagnitude', 'energyRate', 'internalPower',
  'voiceAccess', 'boundaryPermeability', 'selfDetermination',
] as const;

// Fields included whenever explicitly set (even null/false/0)
const DEFINED_UPDATE_FIELDS = [
  'multiScale', 'numericValue', 'numericUnit',
  'notes', 'widgetContent', 'uncertaintyFlag',
] as const;

function buildEntityUpdateData(data: UpdateEnergyEntityInput): Record<string, unknown> {
  const updateData: Record<string, unknown> = {};
  for (const key of TRUTHY_UPDATE_FIELDS) {
    if (data[key]) updateData[key] = data[key];
  }
  for (const key of DEFINED_UPDATE_FIELDS) {
    if (data[key] !== undefined) updateData[key] = data[key];
  }
  return updateData;
}

export async function updateEnergyEntityAction(
  id: string,
  input: UpdateEnergyEntityInput,
): Promise<ApiResponse<{ id: string }>> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const entity = await prisma.energyEntity.findUnique({
    where: { id, deletedAt: null },
    select: { canvasId: true },
  });
  if (!entity) return { success: false, error: 'Not found' };
  const canvas = await getEnergyCanvasWriteAccess(entity.canvasId, auth.data.id);
  if (!canvas) return { success: false, error: 'Not found' };

  const parsed = updateEnergyEntitySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const updateData = buildEntityUpdateData(parsed.data);

  // Entity update + audit log must be atomic (AUDIT-20260613-030).
  await prisma.$transaction(async (tx) => {
    await tx.energyEntity.update({ where: { id }, data: updateData });

    await tx.auditLog.create({
      data: {
        entityType: 'EnergyEntity',
        entityId: id,
        action: 'UPDATE',
        userId: auth.data.id,
        metadata: parsed.data,
      },
    });
  });

  revalidateTag(energyCanvasTag(entity.canvasId), 'default');
  return { success: true, data: { id } };
}

export async function updateEnergyEntityPositionAction(
  id: string,
  input: UpdateEnergyEntityPositionInput,
): Promise<ApiResponse<{ id: string }>> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const parsed = updateEnergyEntityPositionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, errors: flattenError(parsed.error).fieldErrors };
  }

  const entity = await prisma.energyEntity.findUnique({
    where: { id, deletedAt: null },
    select: { canvasId: true },
  });
  if (!entity) return { success: false, error: 'Not found' };
  const canvas = await getEnergyCanvasWriteAccess(entity.canvasId, auth.data.id);
  if (!canvas) return { success: false, error: 'Not found' };

  await prisma.energyEntity.update({
    where: { id },
    data: {
      positionX: parsed.data.positionX,
      positionY: parsed.data.positionY,
      ...(parsed.data.scaleBandY !== undefined && { scaleBandY: parsed.data.scaleBandY }),
    },
  });

  revalidateTag(energyCanvasTag(entity.canvasId), 'default');
  return { success: true, data: { id } };
}

export async function softDeleteEnergyEntityAction(id: string): Promise<ApiResponse<void>> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const entity = await prisma.energyEntity.findUnique({
    where: { id, deletedAt: null },
    select: { canvasId: true },
  });
  if (!entity) return { success: false, error: 'Not found' };
  const canvas = await getEnergyCanvasWriteAccess(entity.canvasId, auth.data.id);
  if (!canvas) return { success: false, error: 'Not found' };

  // Soft-delete update + audit log must be atomic (AUDIT-20260613-030).
  await prisma.$transaction(async (tx) => {
    await tx.energyEntity.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await tx.auditLog.create({
      data: {
        entityType: 'EnergyEntity',
        entityId: id,
        action: 'DELETE',
        userId: auth.data.id,
        metadata: {},
      },
    });
  });

  revalidateTag(energyCanvasTag(entity.canvasId), 'default');
  return { success: true, data: undefined };
}
