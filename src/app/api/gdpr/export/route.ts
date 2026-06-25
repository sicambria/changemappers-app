import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { rateLimitAsync } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { DAY_MS } from '@/lib/constants';
import { buildGdprExportPayload } from '@/lib/gdpr/user-data';

function getAuthenticatedUserId(data: unknown): string | null {
  const authData = data as { id?: unknown; user?: { id?: unknown } };
  const id = authData.user?.id ?? authData.id;
  return typeof id === 'string' ? id : null;
}

export async function GET() {
  try {
    const auth = await getCurrentUser();
    if (!auth || !auth.success || !auth.data) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = getAuthenticatedUserId(auth.data);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // GDPR-H2: rate-limit exports to 2 per user per day to prevent data scraping
    const rl = await rateLimitAsync(`gdpr_export_${userId}`, 2, DAY_MS);
    if (!rl.success) {
      return NextResponse.json({ error: 'Rate limit exceeded. You may export your data at most twice per day.' }, { status: 429 });
    }

    const gdprPayload = await buildGdprExportPayload(userId);
    if (!gdprPayload) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const fileName = `changemappers_data_export_${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(JSON.stringify(gdprPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    logger.error({ msg: 'GDPR Export Error', err: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
