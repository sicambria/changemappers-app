import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    logger.error({ msg: 'Healthcheck DB error', err: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ status: 'error' }, { status: 503 });
  }
}
