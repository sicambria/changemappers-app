import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { buildAbsoluteUrl, getSiteHost } from '@/lib/site-url';
import {
  canExposeActivityPubProfile,
  getActivityPubUsername,
  normalizeFediverseSettings,
} from '@/lib/federation/settings';

function jsonResponse(body: unknown, contentType: string) {
  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': contentType,
    },
  });
}

function getUserIdFromResource(resource: string): string | null {
  if (resource.startsWith('acct:')) {
    const handle = resource.slice(5);
    const [localPart, host] = handle.split('@');
    if (!localPart || !host || host !== getSiteHost()) return null;
    if (!localPart.startsWith('cm-')) return null;
    return localPart.slice(3);
  }

  try {
    const url = new URL(resource);
    const match = url.pathname.match(/^\/ap\/actors\/([^/]+)$/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const resource = request.nextUrl.searchParams.get('resource');
  if (!resource) {
    return NextResponse.json({ error: 'Missing resource parameter' }, { status: 400 });
  }

  const userId = getUserIdFromResource(resource);
  if (!userId) {
    return NextResponse.json({ error: 'Unsupported resource' }, { status: 404 });
  }

  // AUDIT-20260612-011: the only API route without a try/catch. A DB failure here
  // must return a structured JSON 500 (WebFinger/federation clients expect JSON),
  // not Next.js' default HTML error page.
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        profileVisibility: true,
        isSuspended: true,
        federationSettings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const settings = normalizeFediverseSettings(user.federationSettings);
    if (!canExposeActivityPubProfile({ profileVisibility: user.profileVisibility, isSuspended: user.isSuspended, settings })) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const username = getActivityPubUsername(user.id);
    const acct = `acct:${username}@${getSiteHost()}`;
    const actorUrl = buildAbsoluteUrl(`/ap/actors/${user.id}`);

    return jsonResponse(
      {
        subject: acct,
        aliases: [buildAbsoluteUrl(`/profile/${user.id}`), actorUrl],
        links: [
          {
            rel: 'self',
            type: 'application/activity+json',
            href: actorUrl,
          },
        ],
      },
      'application/jrd+json; charset=utf-8',
    );
  } catch (error) {
    logger.error({ msg: 'WebFinger lookup failed', err: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
