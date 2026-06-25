import { NextResponse } from 'next/server';
import { grantWeeklyInviteSlots, expireOldInvites } from '@/lib/invite-utils';
import { logger } from '@/lib/logger';
import { verifyCronSecret } from '@/lib/security-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await grantWeeklyInviteSlots();
    await expireOldInvites();

    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error({ msg: 'cron/invite-maintenance error', err: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
