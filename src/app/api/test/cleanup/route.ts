import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

function isLocalHostname(hostname: string | null | undefined): boolean {
  return hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname === '0.0.0.0'
    || hostname === '::1'
    || hostname === '[::1]'
    || hostname === '::ffff:127.0.0.1'
    || hostname === '[::ffff:127.0.0.1]';
}

function isCleanupRuntimeAllowed(request: NextRequest): boolean {
  if (process.env.E2E_CLEANUP_ENABLED !== 'true') return false;
  if (process.env.CI_E2E !== '1' && process.env.PLAYWRIGHT_TEST !== '1') return false;
  return isLocalHostname(request.nextUrl.hostname);
}

function safeSecretEquals(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.byteLength === expectedBuffer.byteLength && timingSafeEqual(actualBuffer, expectedBuffer);
}

export async function POST(request: NextRequest) {
  // Block unless E2E_CLEANUP_ENABLED is explicitly set.
  // We cannot rely on NODE_ENV here: the Next.js standalone server always
  // hard-codes process.env.NODE_ENV = 'production' at startup, so a NODE_ENV
  // check would permanently block cleanup even during local E2E runs against
  // the production build.  E2E_CLEANUP_ENABLED is a server-side variable
  // (no NEXT_PUBLIC_ prefix) that is injected only via playwright.config.ts
  // webServer.env — it is never present in a real production deployment.
  if (!isCleanupRuntimeAllowed(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const E2E_SECRET = process.env.E2E_CLEANUP_SECRET;
  if (!E2E_SECRET) {
    return NextResponse.json({ error: 'E2E_CLEANUP_SECRET not configured' }, { status: 500 });
  }

  const secret = request.headers.get('x-e2e-secret');
  if (!secret || !safeSecretEquals(secret, E2E_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure kill switches that E2E tests depend on are enabled.
  // In CI the DB starts fresh (all switches default to false), which causes
  // the proxy to redirect /register → / and break registration/onboarding tests.
  await prisma.systemKillSwitch.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      activityPubEnabled: true,
      lanDiscoveryEnabled: true,
      externalExportsEnabled: true,
      userRegistrationEnabled: true,
      rssFetchingEnabled: true,
    },
    update: { userRegistrationEnabled: true },
  });

  const [feedPosts, events, communities, pitches, trainingOffers, weakSignals, compassProfiles, connections, messages, _pageVisitLogs, _auditLogs] = await Promise.all([
    prisma.feedPost.deleteMany({ where: { content: { startsWith: 'E2E-' } } }),
    prisma.event.deleteMany({ where: { title: { startsWith: 'E2E-' } } }),
    prisma.community.deleteMany({ where: { name: { startsWith: 'E2E-' } } }),
    prisma.pitch.deleteMany({ where: { name: { startsWith: 'E2E-' } } }),
    prisma.trainingOffer.deleteMany({ where: { description: { startsWith: 'E2E-' } } }),
    // WeakSignal (Signals Observatory) was previously uncleaned, so E2E-Signal-* rows accumulated
    // forever → DB bloat → signals.spec.ts create-nav stalls. Child rows cascade (onDelete: Cascade).
    prisma.weakSignal.deleteMany({ where: { title: { startsWith: 'E2E-' } } }),
    prisma.compassProfile.deleteMany({
      where: {
        User: {
          email: { in: ['test@changemappers.hu', 'gazda@changemappers.hu'] }
        }
      }
    }),
    prisma.connection.deleteMany({
      where: {
        OR: [
          { sender: { email: { in: ['test@changemappers.hu', 'gazda@changemappers.hu'] } } },
          { receiver: { email: { in: ['test@changemappers.hu', 'gazda@changemappers.hu'] } } }
        ]
      }
    }),
    prisma.message.deleteMany({
      where: {
        OR: [
          { sender: { email: { in: ['test@changemappers.hu', 'gazda@changemappers.hu'] } } },
          { receiver: { email: { in: ['test@changemappers.hu', 'gazda@changemappers.hu'] } } }
        ]
      }
    }),
    prisma.pageVisitLog.deleteMany({
      where: {
        User: {
          OR: [
            { email: { startsWith: 'e2e-onboarding-' } },
            { displayName: 'E2E Builder' }
          ]
        }
      }
    }),
    prisma.auditLog.deleteMany({
      where: {
        User: {
          OR: [
            { email: { startsWith: 'e2e-onboarding-' } },
            { displayName: 'E2E Builder' }
          ]
        }
      }
    }),
  ]);

  const usersCount = await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { startsWith: 'e2e-onboarding-' } },
        { displayName: 'E2E Builder' }
      ]
    }
  });

  return NextResponse.json({
    deleted: {
      feedPosts: feedPosts.count,
      events: events.count,
      communities: communities.count,
      pitches: pitches.count,
      trainingOffers: trainingOffers.count,
      weakSignals: weakSignals.count,
      compassProfiles: compassProfiles.count,
      connections: connections.count,
      messages: messages.count,
      users: usersCount.count,
    },
  });
}
