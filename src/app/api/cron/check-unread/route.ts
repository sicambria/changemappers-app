import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendUnreadMessageNotification } from '@/lib/email';
import { logger } from '@/lib/logger';
import { DAY_MS } from '@/lib/constants';
import { verifyCronSecret } from '@/lib/security-utils';

export const dynamic = 'force-dynamic';

// Bound a single cron run so a growing backlog of dormant unread messages
// cannot load unbounded user rows into memory or fan out unbounded concurrent
// SMTP sends + DB writes (AUDIT-20260613-015). Never-/least-recently-notified
// users are processed first, so successive runs drain the backlog
// deterministically rather than re-notifying the same head of the list.
const MAX_USERS_PER_RUN = 500;
const NOTIFY_BATCH_SIZE = 25;

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (!verifyCronSecret(authHeader)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
    logger.info({ msg: 'Starting unread message check' });

    // 1. Calculate threshold (24 hours ago)
        const twentyFourHoursAgo = new Date(Date.now() - DAY_MS);

        // 2. Find users with unread messages older than 24h
        // AND who haven't been notified in the last 24h
        const usersToNotify = await prisma.user.findMany({
            where: {
                emailNotificationsEnabled: true,
                // Must have received messages that are unread
                receivedMessages: {
                    some: {
                        isRead: false,
                        createdAt: {
                            lt: twentyFourHoursAgo
                        }
                    }
                },
                // And we haven't bugged them recently
                OR: [
                    { lastUnreadNotificationAt: null },
                    { lastUnreadNotificationAt: { lt: twentyFourHoursAgo } }
                ]
            },
            // Drain never-notified users (null) first, then least-recently
            // notified, so the per-run cap below makes deterministic progress
            // across successive runs instead of re-notifying the same head.
            orderBy: [{ lastUnreadNotificationAt: { sort: 'asc', nulls: 'first' } }],
            // Cap rows loaded per run; the backlog is drained over successive runs.
            take: MAX_USERS_PER_RUN,
            select: {
                id: true,
                email: true,
                name: true,
                // Count unread messages
                _count: {
                    select: {
                        receivedMessages: {
                            where: { isRead: false }
                        }
                    }
                }
            }
        });

        logger.info({ msg: 'Unread message check complete', notifiedCount: usersToNotify.length });

        // 3. Send notifications and update timestamp, in bounded-concurrency
        //    batches. Each batch runs at most NOTIFY_BATCH_SIZE send+update
        //    pairs concurrently; batches run sequentially so total concurrent
        //    SMTP connections and DB writes stay capped. A failed send/update
        //    for one user is isolated (logged + counted) so it never rejects
        //    the batch and aborts the run.
        type NotifyUser = { id: string; email: string; name: string | null; _count: { receivedMessages: number } };
        const candidates = usersToNotify as NotifyUser[];

        let notifiedCount = 0;
        let failedCount = 0;

        for (let i = 0; i < candidates.length; i += NOTIFY_BATCH_SIZE) {
            const batch = candidates.slice(i, i + NOTIFY_BATCH_SIZE);
            const batchResults = await Promise.all(
                batch.map(async (user): Promise<'notified' | 'skipped' | 'failed'> => {
                    const unreadCount = user._count.receivedMessages;

                    if (unreadCount === 0) return 'skipped'; // Safety check

                    try {
                        // Send email (mock)
                        await sendUnreadMessageNotification(user.email, unreadCount, user.name ?? undefined);

                        // Update timestamp
                        await prisma.user.update({
                            where: { id: user.id },
                            data: { lastUnreadNotificationAt: new Date() }
                        });

                        return 'notified';
                    } catch (err) {
                        logger.error({
                            msg: 'Failed to notify user of unread messages',
                            userId: user.id,
                            err: err instanceof Error ? err.message : String(err)
                        });
                        return 'failed';
                    }
                })
            );

            for (const result of batchResults) {
                if (result === 'notified') notifiedCount++;
                else if (result === 'failed') failedCount++;
            }
        }

        logger.info({ msg: 'Unread notifications sent', notifiedCount, failedCount });

        return NextResponse.json({
            success: true,
            notifiedCount,
            failedCount,
        });

  } catch (error) {
    logger.error({ msg: 'Error checking unread messages', err: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
