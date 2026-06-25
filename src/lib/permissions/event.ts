import prisma, { EventRole } from '@/lib/prisma';
import { canManageCommunityEvents, type PermissionActor } from './community';

type PrismaLike = Pick<typeof prisma, 'event' | 'community' | 'communityMember'>;

async function getEventPermissionRecord(userId: string, eventId: string, db: PrismaLike = prisma) {
  return db.event.findUnique({
    where: { id: eventId },
    select: {
      hostId: true,
      communityId: true,
      organizers: {
        where: { userId },
        select: { role: true },
        take: 1,
      },
    },
  });
}

export async function getEventRole(userId: string, eventId: string, db: PrismaLike = prisma) {
  const event = await getEventPermissionRecord(userId, eventId, db);
  if (!event) return null;
  if (event.hostId === userId) return EventRole.HOST;
  return event.organizers?.[0]?.role ?? null;
}

export async function canEditEvent(actor: PermissionActor, eventId: string, db: PrismaLike = prisma) {
  if (actor.isAdmin === true) return true;

  const event = await getEventPermissionRecord(actor.id, eventId, db);
  if (!event) return false;
  if (event.hostId === actor.id) return true;

  const organizerRole = event.organizers?.[0]?.role;
  if (organizerRole === EventRole.HOST || organizerRole === EventRole.CO_HOST) return true;

  if (event.communityId) {
    return canManageCommunityEvents(actor, event.communityId, db);
  }

  return false;
}

export async function canManageEventRsvps(actor: PermissionActor, eventId: string, db: PrismaLike = prisma) {
  if (actor.isAdmin === true) return true;

  const event = await getEventPermissionRecord(actor.id, eventId, db);
  if (!event) return false;
  if (event.hostId === actor.id) return true;

  const organizerRole = event.organizers?.[0]?.role;
  if (organizerRole === EventRole.HOST || organizerRole === EventRole.CO_HOST || organizerRole === EventRole.MODERATOR) {
    return true;
  }

  if (event.communityId) {
    return canManageCommunityEvents(actor, event.communityId, db);
  }

  return false;
}

export async function assertCanEditEvent(actor: PermissionActor, eventId: string, db: PrismaLike = prisma) {
  if (!(await canEditEvent(actor, eventId, db))) {
    throw new Error('Forbidden');
  }
}

export async function assertCanManageEventRsvps(actor: PermissionActor, eventId: string, db: PrismaLike = prisma) {
  if (!(await canManageEventRsvps(actor, eventId, db))) {
    throw new Error('Forbidden');
  }
}
