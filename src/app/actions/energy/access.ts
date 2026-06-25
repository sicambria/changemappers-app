'use server';

import prisma from '@/lib/prisma';

const ACTIVE_MEMBER_STATUS = 'ACTIVE';
const COMMUNITY_CANVAS_WRITER_ROLES = new Set(['OWNER', 'ADMIN', 'MODERATOR']);

type EnergyCanvasAccessRecord = {
  id: string;
  createdById: string;
  privacy: string;
  communityId: string | null;
};

async function getActiveMembership(communityId: string, userId: string) {
  const membership = await prisma.communityMember.findUnique({
    where: {
      communityId_userId: {
        communityId,
        userId,
      },
    },
    select: { role: true, status: true },
  });

  if (membership?.status !== ACTIVE_MEMBER_STATUS) {
    return null;
  }

  return membership;
}

function isOwner(canvas: EnergyCanvasAccessRecord, userId: string) {
  return canvas.createdById === userId;
}

export async function getEnergyCanvasReadAccess(canvasId: string, userId: string) {
  const canvas = await prisma.energyCanvas.findUnique({
    where: { id: canvasId, deletedAt: null },
    select: { id: true, createdById: true, privacy: true, communityId: true },
  });

  if (!canvas) return null;
  if (isOwner(canvas, userId)) return canvas;
  if (canvas.privacy === 'PUBLIC') return canvas;

  if (canvas.privacy === 'MY_COMMUNITY' && canvas.communityId) {
    const membership = await getActiveMembership(canvas.communityId, userId);
    if (membership) return canvas;
  }

  return null;
}

export async function getEnergyCanvasWriteAccess(canvasId: string, userId: string) {
  const canvas = await prisma.energyCanvas.findUnique({
    where: { id: canvasId, deletedAt: null },
    select: { id: true, createdById: true, privacy: true, communityId: true },
  });

  if (!canvas) return null;
  if (isOwner(canvas, userId)) return canvas;

  if (canvas.privacy === 'MY_COMMUNITY' && canvas.communityId) {
    const membership = await getActiveMembership(canvas.communityId, userId);
    if (membership && COMMUNITY_CANVAS_WRITER_ROLES.has(membership.role)) {
      return canvas;
    }
  }

  return null;
}
