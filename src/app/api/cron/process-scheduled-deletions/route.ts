import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { eraseUserPersonalData } from '@/lib/gdpr/user-data';
import { verifyCronSecret } from '@/lib/security-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    logger.info({ msg: 'Starting scheduled account deletion processing' });

    const usersToDelete = await prisma.user.findMany({
      where: {
        scheduledDeletionAt: { lte: now },
        deletedAt: null,
      },
      select: { id: true },
    });

    let processed = 0;
    for (const { id: userId } of usersToDelete) {
      try {
        await eraseUserPersonalData(prisma, userId, now);

        processed++;
        logger.info({ msg: 'Account deletion processed', userId });
      } catch (err) {
        logger.error({ msg: 'Failed to process deletion for user', userId, err: err instanceof Error ? err.message : String(err) });
      }
    }

    logger.info({ msg: 'Scheduled deletions complete', processed });
    return NextResponse.json({ success: true, processed });
  } catch (error) {
    logger.error({ msg: 'process-scheduled-deletions error', err: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
