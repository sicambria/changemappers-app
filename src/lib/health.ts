import prisma, { AvailabilityMode } from '@/lib/prisma';

export interface CommunityHealthResult {
  communityId: string;
  totalActiveMembers: number;
  deliveringCount: number;
  buildingCount: number;
  betweenCount: number;
  reflectingCount: number;
  restingCount: number;
  restingOrReflectingRatio: number;
  alertTriggered: boolean;
}

/**
 * Computes the community health snapshot for a given community.
 * Alert fires when fewer than 15% of members are in REFLECTING or RESTING —
 * meaning the community is burning through contributors without recovery.
 *
 * Persists a CommunityHealthSnapshot record for trend tracking.
 */
export async function computeCommunityHealth(
  communityId: string,
): Promise<CommunityHealthResult> {
  const members = await prisma.communityMember.findMany({
    where: { communityId, status: 'ACTIVE' },
    select: {
      userId: true,
      user: {
        select: {
          functionalProfile: {
            select: { availabilityMode: true },
          },
        },
      },
    },
  });

  const totalActiveMembers = members.length;

  const counts = {
    [AvailabilityMode.DELIVERING]: 0,
    [AvailabilityMode.BUILDING]: 0,
    [AvailabilityMode.BETWEEN]: 0,
    [AvailabilityMode.REFLECTING]: 0,
    [AvailabilityMode.RESTING]: 0,
  };

  for (const member of members) {
    const mode = member.user.functionalProfile?.availabilityMode ?? AvailabilityMode.DELIVERING;
    counts[mode] = (counts[mode] ?? 0) + 1;
  }

  const restingOrReflecting = counts[AvailabilityMode.REFLECTING] + counts[AvailabilityMode.RESTING];
  const restingOrReflectingRatio = totalActiveMembers > 0 ? restingOrReflecting / totalActiveMembers : 0;
  const alertTriggered = totalActiveMembers > 0 && restingOrReflectingRatio < 0.15;

  await prisma.communityHealthSnapshot.create({
    data: {
      communityId,
      totalActiveMembers,
      deliveringCount: counts[AvailabilityMode.DELIVERING],
      buildingCount: counts[AvailabilityMode.BUILDING],
      betweenCount: counts[AvailabilityMode.BETWEEN],
      reflectingCount: counts[AvailabilityMode.REFLECTING],
      restingCount: counts[AvailabilityMode.RESTING],
      alertTriggered,
    },
  });

  return {
    communityId,
    totalActiveMembers,
    deliveringCount: counts[AvailabilityMode.DELIVERING],
    buildingCount: counts[AvailabilityMode.BUILDING],
    betweenCount: counts[AvailabilityMode.BETWEEN],
    reflectingCount: counts[AvailabilityMode.REFLECTING],
    restingCount: counts[AvailabilityMode.RESTING],
    restingOrReflectingRatio,
    alertTriggered,
  };
}

/**
 * Returns the latest health snapshot for a community without recomputing.
 */
export async function getLatestCommunityHealth(
  communityId: string,
): Promise<CommunityHealthResult | null> {
const snapshot = await prisma.communityHealthSnapshot.findFirst({
		where: { communityId },
		orderBy: { snapshotAt: 'desc' },
		select: {
			id: true,
			communityId: true,
			snapshotAt: true,
			totalActiveMembers: true,
			deliveringCount: true,
			buildingCount: true,
			betweenCount: true,
			reflectingCount: true,
			restingCount: true,
			alertTriggered: true,
		},
	});

  if (!snapshot) return null;

  const total = snapshot.totalActiveMembers;
  const restingOrReflecting = snapshot.reflectingCount + snapshot.restingCount;

  return {
    communityId: snapshot.communityId,
    totalActiveMembers: total,
    deliveringCount: snapshot.deliveringCount,
    buildingCount: snapshot.buildingCount,
    betweenCount: snapshot.betweenCount,
    reflectingCount: snapshot.reflectingCount,
    restingCount: snapshot.restingCount,
    restingOrReflectingRatio: total > 0 ? restingOrReflecting / total : 0,
    alertTriggered: snapshot.alertTriggered,
  };
}
