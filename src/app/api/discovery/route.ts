import { NextResponse } from 'next/server';
import { getDiscoveredPeers } from '@/lib/discovery';
import { getCurrentUser } from '@/app/actions/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Hard block in production or unauthenticated access
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const peers = await getDiscoveredPeers();
  return NextResponse.json({
    peers,
    enabled: process.env.ENABLE_MDNS_DISCOVERY === 'true' || process.env.NODE_ENV === 'development',
    timestamp: new Date().toISOString(),
  });
}
