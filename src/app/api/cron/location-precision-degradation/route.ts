import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { verifyCronSecret } from '@/lib/security-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    logger.info({ msg: 'Starting location precision degradation' });

    // Degrade lat/lon to ~50 km precision for users whose accounts are older
    // than 6 months — keeps region-level matching working while reducing PII.
    // We round to 1 decimal place (~11 km) rather than zeroing completely so
    // community-proximity features continue to work.
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const usersToDegrade = await prisma.user.findMany({
      where: {
        createdAt: { lt: sixMonthsAgo },
        deletedAt: null,
        processingRestricted: false, // GDPR-H4: skip users who restricted processing
        OR: [
          { latitude: { not: null } },
          { longitude: { not: null } },
        ],
        // Only degrade where precision is still stored at full resolution.
        // We use locationPrecision to track this — EXACT means untouched.
        locationPrecision: 'EXACT',
      },
      select: { id: true, latitude: true, longitude: true },
    });

    let degraded = 0;
    for (const user of usersToDegrade) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          // Round to 1 decimal (~11 km grid) — sufficient for region matching
          latitude: user.latitude != null ? Math.round(user.latitude * 10) / 10 : null,
          longitude: user.longitude != null ? Math.round(user.longitude * 10) / 10 : null,
          locationPrecision: 'REGION',
        },
      });
      degraded++;
    }

    logger.info({ msg: 'Location precision degradation complete', degraded });
    return NextResponse.json({ success: true, degraded });
  } catch (error) {
    logger.error({ msg: 'Location precision degradation error', err: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
