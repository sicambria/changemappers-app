import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { runPendingRegistrationMaintenance } from '@/lib/pending-registration-maintenance';
import { verifyCronSecret } from '@/lib/security-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runPendingRegistrationMaintenance();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    logger.error({ msg: 'cron/pending-registration-maintenance error', err: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
