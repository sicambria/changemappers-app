'use server';
import { prisma } from '@/lib/prisma';
import { LocationPrecision, Visibility, type Prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
import { canExposeProfileField, getProfileExposureSettings, splitProfileSkills, toVisibleStringArray } from '@/lib/profile-exposure';
import { getPublicMemberWhereInput } from '@/lib/public-member-eligibility';
import { isRecentlyActive } from '@/lib/user-activity';
import { getCurrentUserData } from '@/lib/get-current-user';
import { getBlockedUserIds } from '@/lib/blocking';
import { getCountryCentroid } from '@/lib/country-centroids';
import { entityImageUrl } from '@/lib/entity-image';

export type MapEntity = {
  id: string;
  type: 'individual' | 'community' | 'event' | 'issue' | 'signal';
  latitude: number;
  longitude: number;
  name: string;
  avatar?: string | null;
  description?: string;
  tags?: string[];
  communityType?: string;
  eventType?: string;
  changemakeLevel?: string;
  archetypes?: string[];
  rdgAreas?: string[];
  availabilityDetails?: unknown;
  skills?: string[];
  offers?: string[];
  needs?: string[];
  values?: string[];
  issueCategory?: string;
  issueSeverity?: string;
  signalDomain?: string;
  signalConfidence?: string;
  signalNovelty?: string;
  isRecentlyActive?: boolean;
};

type Coordinate = {
  latitude: number;
  longitude: number;
};

function roundCoordinate(value: number, decimals: number): number {
  return Number(value.toFixed(decimals));
}

function normalizeMapPrecision(precision: LocationPrecision): LocationPrecision {
  return precision === LocationPrecision.REGION ? LocationPrecision.COUNTRY : precision;
}

function degradeCoordinates(
  latitude: number,
  longitude: number,
  precision: LocationPrecision,
): Coordinate {
  const normalizedPrecision = normalizeMapPrecision(precision);

  if (normalizedPrecision === LocationPrecision.EXACT) {
    return { latitude, longitude };
  }

  if (normalizedPrecision === LocationPrecision.CITY) {
    return {
      latitude: roundCoordinate(latitude, 2),
      longitude: roundCoordinate(longitude, 2),
    };
  }

  return {
    latitude: roundCoordinate(latitude, 0),
    longitude: roundCoordinate(longitude, 0),
  };
}

function resolveUserCoordinates(user: {
  latitude: number | null;
  longitude: number | null;
  country: string | null;
  locationPrecision: LocationPrecision;
}, audience: MapAudience): Coordinate | null {
  const centroid = getCountryCentroid(user.country);
  const shouldUseCountry = audience === 'public' || normalizeMapPrecision(user.locationPrecision) === LocationPrecision.COUNTRY;

  if (shouldUseCountry && centroid) {
    return centroid;
  }

  if (user.latitude == null || user.longitude == null) {
    return centroid;
  }

  return degradeCoordinates(user.latitude, user.longitude, user.locationPrecision);
}

// Raw fetch — never call directly, always use the cached wrapper below
type MapAudience = 'public' | 'registered';

function getUserMapVisibilityWhere(audience: MapAudience): Prisma.UserWhereInput {
  const registeredAudience = audience === 'registered';

  return {
    OR: [
      { latitude: { not: null }, longitude: { not: null } },
      { country: { not: null } },
    ],
    profileVisibility: registeredAudience ? { in: [Visibility.PUBLIC, Visibility.REGISTERED] } : Visibility.PUBLIC,
    locationVisibility: registeredAudience ? { in: [Visibility.PUBLIC, Visibility.REGISTERED] } : Visibility.PUBLIC,
    showOnMap: true,
  };
}

async function getMapEntitiesRaw(audience: MapAudience): Promise<MapEntity[]> {
  const [users, communities, events, issues, signals] = await Promise.all([
    prisma.user.findMany({
      where: getPublicMemberWhereInput(getUserMapVisibilityWhere(audience)),
      take: 500,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        country: true,
        displayName: true,
        federationSettings: true,
        locationPrecision: true,
        name: true,
        profilePhoto: true,
        bio: true,
        changemakeLevel: true,
        archetypes: true,
        rdgAreas: true,
        availabilityDetails: true,
        interests: { select: { interest: true } },
        skills: { select: { skill: true, skillType: true } },
        values: { select: { value: true } },
        lastActiveAt: true,
      },
    }),
    prisma.community.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      take: 300,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        name: true,
        coverImage: true,
        description: true,
        type: true,
        focusAreas: { select: { focusArea: true } },
      },
    }),
    prisma.event.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        status: 'UPCOMING',
      },
      take: 200,
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        title: true,
        coverImage: true,
        description: true,
        type: true,
        category: true,
      },
    }),
    prisma.socialIssue.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        isLocalizable: true,
        status: { in: ['PUBLISHED', 'VERIFIED'] },
        deletedAt: null,
      },
      take: 200,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        title: true,
        description: true,
        category: true,
        severity: true,
        tags: true,
      },
    }),
    prisma.weakSignal.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        isLocalizable: true,
        status: { in: ['PUBLISHED', 'VERIFIED'] },
        deletedAt: null,
      },
      take: 200,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        title: true,
        description: true,
        domain: true,
        confidence: true,
        novelty: true,
        tags: true,
      },
    }),
  ]);

  const userEntities: MapEntity[] = users.flatMap((u) => {
    const coordinates = resolveUserCoordinates(u, audience);
    if (!coordinates) return [];

    if (audience === 'public') {
      return [{
        id: u.id,
        type: 'individual' as const,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        name: u.displayName || u.name,
      }];
    }

    const publicProfile = getProfileExposureSettings(u.federationSettings);
    const { skills, offers, needs } = splitProfileSkills(u.skills, publicProfile);
    const values = canExposeProfileField(publicProfile, 'showValues') ? u.values?.map((v: { value: string }) => v.value) || [] : [];
    const interests = canExposeProfileField(publicProfile, 'showInterests') ? u.interests?.map((i: { interest: string }) => i.interest) || [] : [];

    return [{
      id: u.id,
      type: 'individual' as const,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      name: u.displayName || u.name,
      // AUDIT-20260613-012: never inline base64 image bytes in list payloads —
      // ship a lazily-fetched, HTTP-cached image URL instead.
      avatar: publicProfile.showAvatar && u.profilePhoto ? entityImageUrl('user-avatar', u.id) : undefined,
      description: publicProfile.showBio ? u.bio || undefined : undefined,
      changemakeLevel: canExposeProfileField(publicProfile, 'showChangemakerLevel') ? u.changemakeLevel || undefined : undefined,
      archetypes: toVisibleStringArray(u.archetypes, publicProfile, 'showArchetypes'),
      rdgAreas: toVisibleStringArray(u.rdgAreas, publicProfile, 'showRdgAreas'),
      availabilityDetails: canExposeProfileField(publicProfile, 'showIntentions') ? u.availabilityDetails ?? undefined : undefined,
      skills,
      offers,
      needs,
      values,
      tags: [...interests, ...skills, ...offers, ...needs],
      isRecentlyActive: isRecentlyActive(u.lastActiveAt),
    }];
  });

  const communityEntities: MapEntity[] = communities.map((c) => ({
    id: c.id,
    type: 'community',
    latitude: c.latitude!,
    longitude: c.longitude!,
    name: c.name,
    avatar: c.coverImage ? entityImageUrl('community-cover', c.id) : undefined,
    description: c.description || undefined,
    communityType: c.type ? String(c.type) : undefined,
    tags: c.focusAreas?.map((f: { focusArea: string }) => f.focusArea) || [],
  }));

  const eventEntities: MapEntity[] = events.map((e) => ({
    id: e.id,
    type: 'event',
    latitude: e.latitude!,
    longitude: e.longitude!,
    name: e.title,
    avatar: e.coverImage ? entityImageUrl('event-cover', e.id) : undefined,
    description: e.description || undefined,
    eventType: e.type ? String(e.type) : undefined,
    tags: e.category ? [String(e.category)] : [],
  }));

  const issueEntities: MapEntity[] = issues.map((i) => ({
    id: i.id,
    type: 'issue',
    latitude: i.latitude!,
    longitude: i.longitude!,
    name: i.title,
    description: i.description || undefined,
    tags: i.tags,
    issueCategory: String(i.category),
    issueSeverity: String(i.severity),
  }));

  const signalEntities: MapEntity[] = signals.map((s) => ({
    id: s.id,
    type: 'signal' as const,
    latitude: s.latitude!,
    longitude: s.longitude!,
    name: s.title,
    description: s.description || undefined,
    tags: s.tags,
    signalDomain: String(s.domain),
    signalConfidence: String(s.confidence),
    signalNovelty: String(s.novelty),
  }));

  return [...userEntities, ...communityEntities, ...eventEntities, ...issueEntities, ...signalEntities];
}

// Cached version — 5 minute TTL, tag-based invalidation
// The first call hits the DB; every subsequent call within 5 min is instant.
// This prevents /home and /map from hanging when the Prisma proxy is slow.
// NOTE: exported as a proper async function (not a const) per ACTIVE_DEV_RULES —
// 'use server' files must only export async functions, never bare consts.
const _cachedPublicMapEntities = unstable_cache(
    () => getMapEntitiesRaw('public'),
    ['map-entities', 'public'],
    { revalidate: 300, tags: ['map', 'signals'] }
);

const _cachedRegisteredMapEntities = unstable_cache(
    () => getMapEntitiesRaw('registered'),
    ['map-entities', 'registered'],
    { revalidate: 300, tags: ['map', 'signals'] }
);

export async function getMapEntities(): Promise<MapEntity[]> {
    const userResult = await getCurrentUserData();
    if (userResult.success && userResult.data?.user) {
        const entities = await _cachedRegisteredMapEntities();
        // The cached set is viewer-independent; drop symmetrically-blocked individuals
        // for this viewer post-cache (anonymous viewers have no blocks).
        const blocked = await getBlockedUserIds(userResult.data.user.id);
        if (blocked.size === 0) return entities;
        return entities.filter((entity) => entity.type !== 'individual' || !blocked.has(entity.id));
    }

    return _cachedPublicMapEntities();
}
