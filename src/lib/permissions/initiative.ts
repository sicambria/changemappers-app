import prisma from '@/lib/prisma';
import type { PermissionActor } from './community';

type PrismaLike = Pick<typeof prisma, 'initiative'>;

/**
 * A user can attach content (e.g. weak-signal links) to an initiative when
 * they are a platform admin/moderator, the initiative's creator or assignee,
 * or hold an active role on it. Non-existent initiatives return false so
 * callers can answer with a generic "not found or not authorized" message.
 */
export async function canContributeToInitiative(
  actor: PermissionActor,
  initiativeId: string,
  db: PrismaLike = prisma
) {
  if (actor.isAdmin === true || actor.isModerator === true) return true;

  const initiative = await db.initiative.findUnique({
    where: { id: initiativeId },
    select: {
      createdById: true,
      assigneeId: true,
      roles: {
        where: { userId: actor.id, leftAt: null },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!initiative) return false;
  return (
    initiative.createdById === actor.id ||
    initiative.assigneeId === actor.id ||
    initiative.roles.length > 0
  );
}
