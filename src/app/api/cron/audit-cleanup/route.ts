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
    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Scrub PII from older audit logs rather than deleting the logs entirely
    // This preserves the audit trail (who did what and when) without keeping email/IP/UA
    const result = await prisma.auditLog.updateMany({
      where: {
        createdAt: { lt: ninetyDaysAgo },
        OR: [
          { ipAddress: { not: null } },
          { userAgent: { not: null } },
          { userEmail: { not: null } },
        ],
      },
      data: {
        ipAddress: null,
        userAgent: null,
        userEmail: null,
      },
    });

    return NextResponse.json({
      ok: true,
      scrubbedCount: result.count,
    });
  } catch (error) {
    logger.error({ msg: 'cron/audit-cleanup error', err: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
