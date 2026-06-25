/**
 * Serves stored entity images (user avatars, community/event covers) as real
 * HTTP image responses so list payloads (map/home/graph) can reference URLs
 * instead of embedding base64 bytes (AUDIT-20260613-012).
 *
 * Access: registered users only — mirrors the map's registered-audience
 * gating, the surface these URLs are minted for. User avatars additionally
 * honor the owner's `showAvatar` exposure setting and member-visibility
 * eligibility, like the map payload did when it inlined the bytes.
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma, { Visibility } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { decodeStoredImage, isEntityImageType } from '@/lib/entity-image';
import { getProfileExposureSettings } from '@/lib/profile-exposure';
import { isEligibleVisibleMemberAccount } from '@/lib/public-member-eligibility';

export const dynamic = 'force-dynamic';

const CACHE_CONTROL = 'private, max-age=3600, stale-while-revalidate=86400';

async function loadStoredImage(type: string, id: string): Promise<string | null> {
  if (type === 'user-avatar') {
    // AUDIT-20260613-032: gate with the SAME canonical member predicate the
    // map/graph payloads use (isEligibleVisibleMemberAccount covers
    // processingRestricted, pending registration, inactiveAt, email
    // verification, suspension, deletion) — never a partial re-implementation.
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        profilePhoto: true,
        federationSettings: true,
        deletedAt: true,
        inactiveAt: true,
        email: true,
        isAdmin: true,
        name: true,
        isEmailVerified: true,
        isRegistrationPending: true,
        isSuspended: true,
        processingRestricted: true,
        profileVisibility: true,
        termsAcceptedAt: true,
        onboardingState: { select: { lastStageCompleted: true } },
      },
    });
    if (
      !user ||
      !isEligibleVisibleMemberAccount(user) ||
      !(user.profileVisibility === Visibility.PUBLIC || user.profileVisibility === Visibility.REGISTERED)
    ) {
      return null;
    }
    const exposure = getProfileExposureSettings(user.federationSettings);
    if (!exposure.showAvatar) return null;
    return user.profilePhoto;
  }

  if (type === 'community-cover') {
    const community = await prisma.community.findUnique({
      where: { id },
      select: { coverImage: true, deletedAt: true, visibility: true },
    });
    if (
      !community ||
      community.deletedAt ||
      !(community.visibility === Visibility.PUBLIC || community.visibility === Visibility.REGISTERED)
    ) {
      return null;
    }
    return community.coverImage;
  }

  // event-cover — events on the map are UPCOMING and not deleted; covers of
  // deleted events must not be servable.
  const event = await prisma.event.findUnique({
    where: { id },
    select: { coverImage: true, deletedAt: true },
  });
  if (!event || event.deletedAt) return null;
  return event.coverImage;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ type: string; id: string }> }
) {
  try {
    const { type, id } = await context.params;

    if (!isEntityImageType(type) || !id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    const payload = token ? verifyAccessToken(token) : null;
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stored = await loadStoredImage(type, id);
    if (!stored) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const decoded = decodeStoredImage(stored);
    if (decoded) {
      return new NextResponse(new Uint8Array(decoded.bytes), {
        status: 200,
        headers: {
          'Content-Type': decoded.contentType,
          'Content-Length': String(decoded.bytes.length),
          'Cache-Control': CACHE_CONTROL,
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }

    // Legacy externally-hosted https image: redirect instead of proxying.
    try {
      const url = new URL(stored);
      if (url.protocol === 'https:') {
        return NextResponse.redirect(url, 302);
      }
    } catch {
      // fall through to 404
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    logger.error({
      msg: 'entity-image route error',
      err: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
