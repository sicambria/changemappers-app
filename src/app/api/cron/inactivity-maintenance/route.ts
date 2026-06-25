import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { verifyCronSecret } from '@/lib/security-utils';
import { runInactivityMaintenance } from '@/lib/inactivity-maintenance';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!verifyCronSecret(authHeader)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runInactivityMaintenance(new Date());
    logger.info({ msg: 'Inactivity maintenance complete', ...result });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error({ msg: 'inactivity-maintenance error', err: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
