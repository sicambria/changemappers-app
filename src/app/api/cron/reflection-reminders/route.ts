import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { verifyCronSecret } from '@/lib/security-utils';
import { DAY_MS } from '@/lib/constants';
import { prioritiseReflections } from '@/lib/reflection-cadence';
import { createNotificationRecord } from '@/lib/notifications';
import { type ReflectionLevel } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Minimum gap between two reminder notifications for the same user.
// Matches the shortest reflection cadence (L1_PULSE = 7 days) so we
// never remind faster than the pulse window itself.
const REMINDER_COOLDOWN_MS = 7 * DAY_MS;

const MAX_USERS_PER_RUN = 200;
const NOTIFY_BATCH_SIZE = 25;

function lastByLevelFromRecords(
  records: Array<{ level: ReflectionLevel; createdAt: Date }>,
): Partial<Record<ReflectionLevel, Date | null>> {
  const map: Partial<Record<ReflectionLevel, Date | null>> = {};
  for (const r of records) {
    const existing = map[r.level];
    if (!existing || r.createdAt > existing) {
      map[r.level] = r.createdAt;
    }
  }
  return map;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    logger.info({ msg: 'Starting reflection reminders cron' });

    const cooldownThreshold = new Date(Date.now() - REMINDER_COOLDOWN_MS);

    const candidates = await prisma.user.findMany({
      where: {
        reflectionReminderOptOut: false,
        deletedAt: null,
        OR: [
          { lastReflectionReminderAt: null },
          { lastReflectionReminderAt: { lt: cooldownThreshold } },
        ],
        ReflectionRecord: {
          some: {},
        },
      },
      orderBy: [{ lastReflectionReminderAt: { sort: 'asc', nulls: 'first' } }],
      take: MAX_USERS_PER_RUN,
      select: {
        id: true,
        ReflectionRecord: {
          orderBy: { createdAt: 'desc' },
          select: { level: true, createdAt: true },
          // Latest record per level — fetch recent records, compute max in memory
          take: 20,
        },
      },
    });

    logger.info({ msg: 'Reflection reminder candidates found', count: candidates.length });

    const now = new Date();
    let notifiedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < candidates.length; i += NOTIFY_BATCH_SIZE) {
      const batch = candidates.slice(i, i + NOTIFY_BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (user): Promise<'notified' | 'skipped' | 'failed'> => {
          const lastByLevel = lastByLevelFromRecords(user.ReflectionRecord);
          const top = prioritiseReflections(lastByLevel, now)[0];
          if (!top) return 'skipped';

          try {
            await createNotificationRecord({
              userId: user.id,
              type: 'REFLECTION_RITUAL_PROMPT',
              title: 'Time for a reflection',
              link: top.href,
            });
            await prisma.user.update({
              where: { id: user.id },
              data: { lastReflectionReminderAt: now },
              select: { id: true },
            });
            return 'notified';
          } catch (err) {
            logger.error({
              msg: 'Failed to send reflection reminder',
              userId: user.id,
              err: err instanceof Error ? err.message : String(err),
            });
            return 'failed';
          }
        }),
      );

      for (const result of batchResults) {
        if (result === 'notified') notifiedCount++;
        else if (result === 'skipped') skippedCount++;
        else failedCount++;
      }
    }

    logger.info({ msg: 'Reflection reminders sent', notifiedCount, skippedCount, failedCount });

    return NextResponse.json({ success: true, notifiedCount, skippedCount, failedCount });
  } catch (error) {
    logger.error({ msg: 'Error in reflection-reminders cron', err: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
