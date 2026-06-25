import prisma from '@/lib/prisma';
import { canModerateContent } from './content';
import type { PermissionActor } from './community';

type PrismaLike = Pick<typeof prisma, 'socialCause'>;

export async function isCauseSteward(userId: string, causeId: string, db: PrismaLike = prisma) {
  const cause = await db.socialCause.findUnique({
    where: { id: causeId },
    select: {
      managers: {
        where: { id: userId },
        select: { id: true },
        take: 1,
      },
    },
  });

  return (cause?.managers.length ?? 0) > 0;
}

export async function canEditCause(actor: PermissionActor, causeId: string, db: PrismaLike = prisma) {
  if (canModerateContent(actor)) return true;
  return isCauseSteward(actor.id, causeId, db);
}

export async function assertCanEditCause(actor: PermissionActor, causeId: string, db: PrismaLike = prisma) {
  if (!(await canEditCause(actor, causeId, db))) {
    throw new Error('Forbidden');
  }
}
