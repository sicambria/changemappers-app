import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeCommunityHealth } from '@/lib/health';
import { logger } from '@/lib/logger';
import { verifyCronSecret } from '@/lib/security-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all communities that have members
    const communities = await prisma.community.findMany({
      where: { members: { some: {} } },
      select: { id: true },
    });

    const results = await Promise.all(
      communities.map(async ({ id }) => {
        const snapshot = await computeCommunityHealth(id);

        if (snapshot.alertTriggered) {
          // Find stewards/admins/owners of the community
          const stewards = await prisma.communityMember.findMany({
            where: {
              communityId: id,
              role: { in: ['OWNER', 'ADMIN', 'MODERATOR'] },
            },
            select: { userId: true },
          });

          await Promise.all(
            stewards.map(({ userId }) =>
              prisma.notification.create({
                data: {
                  userId,
                  type: 'COMMUNITY_HEALTH_ALERT',
                  title: 'Community health alert',
                  message:
                    'Less than 15% of your community members are in a reflective or resting state.',
                  link: '/admin/health',
                },
              })
            )
          );
        }

        return { communityId: id, alertTriggered: snapshot.alertTriggered };
      })
    );

    return NextResponse.json({ ok: true, processed: results.length, results });
  } catch (error) {
    logger.error({ msg: 'cron/community-health error', err: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
