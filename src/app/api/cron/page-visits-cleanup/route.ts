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
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    const [deletedLogs, deletedDaily, deletedWeekly, deletedMonthly] = await Promise.all([
      prisma.pageVisitLog.deleteMany({
        where: { createdAt: { lt: thirtyDaysAgo } },
      }),
      prisma.pageVisitDaily.deleteMany({
        where: { date: { lt: thirtyDaysAgo } },
      }),
      prisma.pageVisitWeekly.deleteMany({
        where: { weekStart: { lt: sixMonthsAgo } },
      }),
      prisma.pageVisitMonthly.deleteMany({
        where: { monthStart: { lt: twelveMonthsAgo } },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      deleted: {
        logs: deletedLogs.count,
        daily: deletedDaily.count,
        weekly: deletedWeekly.count,
        monthly: deletedMonthly.count,
      },
    });
  } catch (error) {
    logger.error({ msg: 'cron/page-visits-cleanup error', err: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
