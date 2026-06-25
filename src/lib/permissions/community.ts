import prisma, { CommunityRole } from '@/lib/prisma';

type PrismaLike = Pick<typeof prisma, 'community' | 'communityMember'>;

export type PermissionActor = {
  id: string;
  isAdmin?: boolean | null;
  isModerator?: boolean | null;
};

export async function getCommunityRole(userId: string, communityId: string, db: PrismaLike = prisma) {
  const community = await db.community.findUnique({
    where: { id: communityId },
    select: {
      ownerId: true,
      members: {
        where: { userId, status: 'ACTIVE' },
        select: { role: true },
        take: 1,
      },
    },
  });

  if (!community) return null;
  if (community.ownerId === userId) return CommunityRole.OWNER;
  return community.members?.[0]?.role ?? null;
}

export async function canEditCommunity(actor: PermissionActor, communityId: string, db: PrismaLike = prisma) {
  if (actor.isAdmin === true) return true;
  const role = await getCommunityRole(actor.id, communityId, db);
  return role === CommunityRole.OWNER || role === CommunityRole.ADMIN;
}

export async function canModerateCommunity(actor: PermissionActor, communityId: string, db: PrismaLike = prisma) {
  if (actor.isAdmin === true) return true;
  const role = await getCommunityRole(actor.id, communityId, db);
  return role === CommunityRole.OWNER || role === CommunityRole.ADMIN || role === CommunityRole.MODERATOR;
}

// NOSONAR(S4144) — intentionally a separate permission predicate from canEditCommunity.
// The two gates are currently identical (OWNER/ADMIN) but are semantically distinct:
// event-management rights must be able to diverge from community-edit rights without
// silently coupling them. Keeping them independent is the conservative default for
// authorization checks (avoid one broadening accidentally widening the other).
export async function canManageCommunityEvents(actor: PermissionActor, communityId: string, db: PrismaLike = prisma) { // NOSONAR
  if (actor.isAdmin === true) return true;
  const role = await getCommunityRole(actor.id, communityId, db);
  return role === CommunityRole.OWNER || role === CommunityRole.ADMIN;
}

export async function assertCanEditCommunity(actor: PermissionActor, communityId: string, db: PrismaLike = prisma) {
  if (!(await canEditCommunity(actor, communityId, db))) {
    throw new Error('Forbidden');
  }
}

export async function assertCanModerateCommunity(actor: PermissionActor, communityId: string, db: PrismaLike = prisma) {
  if (!(await canModerateCommunity(actor, communityId, db))) {
    throw new Error('Forbidden');
  }
}

export async function assertCanManageCommunityEvents(actor: PermissionActor, communityId: string, db: PrismaLike = prisma) {
  if (!(await canManageCommunityEvents(actor, communityId, db))) {
    throw new Error('Forbidden');
  }
}
