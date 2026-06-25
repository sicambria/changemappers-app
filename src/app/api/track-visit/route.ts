import { NextRequest, NextResponse } from 'next/server';
import { trackPageVisit } from '@/app/actions/page-visits';
import { getRouteByPath } from '@/lib/route-loader';
import { verifyAccessToken } from '@/lib/auth';
import { rateLimitAsync } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/request-ip';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const MAX_PATH_LENGTH = 500;
const PATH_REGEX = /^\/[a-zA-Z0-9\-_/.%[\]@]*$/;

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    if (!token || !verifyAccessToken(token)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const ip = getClientIp(req.headers);
    const rl = await rateLimitAsync(`track_visit_${ip}`, 60, 60 * 1000);
    if (!rl.success) {
      return NextResponse.json({ success: false, error: 'Too many requests' }, { status: 429 });
    }
    const { path } = await req.json() as { path: unknown };
    if (!path || typeof path !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid path' }, { status: 400 });
    }
    if (path.length > MAX_PATH_LENGTH) {
      return NextResponse.json({ success: false, error: 'Path too long' }, { status: 400 });
    }
    if (!PATH_REGEX.test(path)) {
      return NextResponse.json({ success: false, error: 'Path contains invalid characters' }, { status: 400 });
    }
    if (path.includes('<') || path.includes('>')) {
      return NextResponse.json({ success: false, error: 'Path contains invalid characters' }, { status: 400 });
    }
    const matchedRoute = getRouteByPath(path);
    if (!matchedRoute) {
      return NextResponse.json({ success: false, error: 'Unknown route' }, { status: 400 });
    }
    const result = await trackPageVisit(path);
    return NextResponse.json(result);
  } catch (error) {
    logger.error({ msg: 'Failed to track page visit', err: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
