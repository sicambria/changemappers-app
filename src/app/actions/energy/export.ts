'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { getEnergyCanvasReadAccess, getEnergyCanvasWriteAccess } from '@/app/actions/energy/access';
import type { ApiResponse } from '@/types/modalities';

interface EnergyCanvasExport {
  id: string;
  title: string;
  description: string | null;
  systemState: string;
  stateReason: string | null;
  createdAt: Date;
  entities: Array<{
    id: string;
    roleLabel: string;
    entityType: string;
    primaryScale: string;
    multiScale: string[];
    visibility: string;
    energyState: string;
    energyMagnitude: string;
    energyRate: string;
    internalPower: string;
    numericValue: number | null;
    numericUnit: string | null;
    voiceAccess: string;
    boundaryPermeability: string;
    selfDetermination: string;
    positionX: number;
    positionY: number;
    scaleBandY: number;
    uncertaintyFlag: boolean;
  }>;
  relations: Array<{
    id: string;
    fromEntityId: string;
    toEntityId: string;
    powerDistance: string;
    energyFlow: string;
    informationFlow: string;
    visibility: string;
    consent: string;
    energyMagnitude: string;
    numericValue: number | null;
    numericUnit: string | null;
    isCrossScale: boolean;
    patternDetected: string | null;
    uncertaintyFlag: boolean;
  }>;
}

export async function exportEnergyCanvasJsonAction(
  canvasId: string,
): Promise<ApiResponse<EnergyCanvasExport>> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) {
    return { success: false, error: 'Unauthorized' };
  }

  const canvas = await prisma.energyCanvas.findUnique({
    where: { id: canvasId, deletedAt: null },
    select: {
      id: true,
      title: true,
      description: true,
      systemState: true,
      stateReason: true,
      createdAt: true,
      createdById: true,
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
          uncertaintyFlag: true,
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
          uncertaintyFlag: true,
        },
      },
    },
  });

  if (!canvas) {
    return { success: false, error: 'Canvas not found' };
  }
  if (canvas.createdById !== auth.data.id) {
    return { success: false, error: 'Unauthorized' };
  }

  const { createdById: _, ...canvasData } = canvas;
  return { success: true, data: canvasData as EnergyCanvasExport };
}

export async function createEnergySnapshotAction(
  canvasId: string,
  name: string,
): Promise<ApiResponse<{ id: string }>> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return { success: false, error: 'Unauthorized' };

  const access = await getEnergyCanvasWriteAccess(canvasId, auth.data.id);
  if (!access) return { success: false, error: 'Canvas not found' };

  const canvas = await prisma.energyCanvas.findUnique({
    where: { id: canvasId, deletedAt: null },
    select: {
      id: true,
      title: true,
      description: true,
      systemState: true,
      stateReason: true,
      entities: {
        where: { deletedAt: null },
      },
      relations: {
        where: { deletedAt: null },
      },
    },
  });

  if (!canvas) return { success: false, error: 'Canvas not found' };

  const snapshot = await prisma.energySnapshot.create({
    data: {
      canvasId,
      name,
      data: canvas as object,
      createdBy: auth.data.id,
    },
    select: { id: true },
  });

  return { success: true, data: { id: snapshot.id } };
}

export async function getEnergySnapshotsAction(canvasId: string) {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) return [];

  const access = await getEnergyCanvasReadAccess(canvasId, auth.data.id);
  if (!access) return [];

  return prisma.energySnapshot.findMany({
    where: { canvasId },
    select: {
      id: true,
      name: true,
      timestamp: true,
      createdBy: true,
      createdAt: true,
    },
    orderBy: { timestamp: 'desc' },
    take: 20,
  });
}
