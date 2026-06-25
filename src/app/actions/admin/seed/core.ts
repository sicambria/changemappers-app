'use server';

// Network-wide demo seeding, clearing, and count reporting.
import { logActionError } from '@/lib/action-logger';
import { prisma, CommunityType, EventCategory } from "@/lib/prisma";
import { DEMO_BATCH_PREFIX } from "@/types/demo-seed";
import { localizeActionMessage } from '@/lib/action-result-i18n';
import { resolveCityCoords, resolveEventCoords, DEMO_EMAIL_SUFFIX } from "@/lib/demo-seed/geo";
import { assertAdmin } from './shared';
import * as fs from "node:fs";
import * as path from "node:path";

type SeedInitiative = {
  name: string;
  description: string;
  // Preferred: an explicit CommunityType enum value. Legacy `type` (a Hungarian
  // topic string) is still honoured via SEED_COMMUNITY_TYPE_MAP for back-compat.
  communityType?: string;
  type?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  foundingYear?: number;
  website?: string;
  focusAreas?: string[];
  url?: string;
  leaders?: string;
  size?: string;
};

type SeedEvent = {
  name: string;
  description?: string;
  // Preferred: an explicit EventCategory enum value + ISO start/end dates. Legacy
  // `topic`/`date`/`season` remain supported via SEED_EVENT_CATEGORY_MAP.
  category?: string;
  topic?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  isOnline?: boolean;
  startDate?: string;
  endDate?: string;
  website?: string;
  dateConfidence?: string;
  date?: string;
  season?: string;
};

// Static initiative-type → CommunityType mapping (hoisted to module scope; computed once).
const SEED_COMMUNITY_TYPE_MAP: Record<string, CommunityType> = {
  Permakultúra: CommunityType.EARTH_REGENERATION_CENTER,
  CSA: CommunityType.REGENERATIVE_ECONOMIC,
  Kosárközösség: CommunityType.REGENERATIVE_ECONOMIC,
  Ökofalu: CommunityType.NATURE_CONNECTED_ECO_HUB,
  "Társadalmi Igazságosság": CommunityType.FRONTLINE_ACTIVIST,
  Állatvédelem: CommunityType.NATURE_CONNECTED_ECO_HUB,
  Oktatás: CommunityType.KNOWLEDGE_HUB,
  Spiritualitás: CommunityType.SPIRITUAL_HAVEN,
  Energiaközösségek: CommunityType.REGENERATIVE_ECONOMIC,
};

// Static event-topic → EventCategory mapping (hoisted to module scope; computed once).
const SEED_EVENT_CATEGORY_MAP: Record<string, EventCategory> = {
  "Oktatás, szemléletformálás": EventCategory.WORKSHOP,
  "Környezetvédelem, vízkincs": EventCategory.MEETUP,
  "Civil szféra támogatása": EventCategory.OPEN_SPACE,
  "Ökológiai nevelés": EventCategory.WORKSHOP,
  "Közösségépítés, ünneplés": EventCategory.CELEBRATION,
  Természetvédelem: EventCategory.OPEN_DAY,
  "Kertészet, Permakultúra": EventCategory.WORKDAY,
  "Spiritualitás, Önismeret, Zene": EventCategory.RETREAT,
  "Zene, közösség": EventCategory.CELEBRATION,
  "Erőszakmentes kommunikáció": EventCategory.WORKSHOP,
  "Védikus lelkigyakorlat": EventCategory.RETREAT,
  "Integrál pszichológia, elvonulás": EventCategory.RETREAT,
  "Fenntartható közlekedés": EventCategory.OTHER,
  "Civil szféra koordináció": EventCategory.MEETUP,
  "Állatvédelem, edukáció": EventCategory.WORKSHOP,
  "Nyílt napok, örökbefogadás": EventCategory.OPEN_DAY,
  "Permakultúra tudomány": EventCategory.OTHER,
  "Évzáró elvonulás": EventCategory.RETREAT,
  "Fenntarthatósági Expo": EventCategory.OTHER,
  "Gazdasági tudatosság": EventCategory.WORKSHOP,
  "Ökológia, klímavédelem": EventCategory.OTHER,
  "Oktatás, Spiritualitás": EventCategory.OPEN_DAY,
};

const COMMUNITY_TYPE_VALUES = new Set<string>(Object.values(CommunityType));
const EVENT_CATEGORY_VALUES = new Set<string>(Object.values(EventCategory));

// Prefer an explicit CommunityType enum value; fall back to the legacy
// Hungarian-topic map, then a safe default.
function resolveCommunityType(init: SeedInitiative): CommunityType {
  if (init.communityType && COMMUNITY_TYPE_VALUES.has(init.communityType)) {
    return init.communityType as CommunityType;
  }
  return (init.type ? SEED_COMMUNITY_TYPE_MAP[init.type] : undefined) ?? CommunityType.INCLUSIVE_SUPPORT_NETWORK;
}

// Prefer an explicit EventCategory enum value; fall back to the legacy topic map.
function resolveEventCategory(ev: SeedEvent): EventCategory {
  if (ev.category && EVENT_CATEGORY_VALUES.has(ev.category)) {
    return ev.category as EventCategory;
  }
  return (ev.topic ? SEED_EVENT_CATEGORY_MAP[ev.topic] : undefined) ?? EventCategory.MEETUP;
}

function explicitCoords(lat?: number, lng?: number): { lat: number; lng: number } | null {
  return typeof lat === "number" && typeof lng === "number" ? { lat, lng } : null;
}

// Prefer explicit lat/long from the dataset; fall back to the city/location lookup.
function resolveInitiativeCoords(init: SeedInitiative): { lat: number; lng: number } | null {
  return explicitCoords(init.latitude, init.longitude) ?? (init.city ? resolveCityCoords(init.city) : null);
}

function resolveEventLatLng(ev: SeedEvent): { lat: number; lng: number } | null {
  return explicitCoords(ev.latitude, ev.longitude) ?? (ev.location ? resolveEventCoords(ev.location) : null);
}

function parseSeedDate(value?: string): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildInitiativeDescription(init: SeedInitiative): string {
  const focus = init.focusAreas?.length ? `\n\nFókusz: ${init.focusAreas.join(", ")}` : "";
  const founded = init.foundingYear ? `\n\nAlapítva: ${init.foundingYear}` : "";
  const website = init.website ?? init.url;
  return (
    init.description +
    focus +
    founded +
    (website ? `\n\nWeboldal: ${website}` : "") +
    (init.leaders ? `\n\nVezetők: ${init.leaders}` : "") +
    (init.size ? `\n\nMéret: ${init.size}` : "")
  );
}

function buildEventDescription(ev: SeedEvent): string {
  if (ev.description) {
    return (
      ev.description +
      (ev.website ? `\n\nWeboldal: ${ev.website}` : "") +
      (ev.dateConfidence === "estimated" ? `\n\n(A dátum becsült / date estimated)` : "")
    );
  }
  // Legacy shape (topic/date/season) — kept for back-compat with older datasets.
  return (
    `${ev.topic ?? ev.name}` +
    (ev.date ? `\n\nDátum: ${ev.date}` : "") +
    (ev.season ? `\nIdőszak: ${ev.season}` : "")
  );
}

// Seed communities sequentially (existing-check-then-create order matters);
// returns the count of newly created records.
async function seedCommunities(initiatives: SeedInitiative[], adminId: string): Promise<number> {
  let initCount = 0;
  for (const init of initiatives) {
    const mappedType = resolveCommunityType(init);
    const existing = await prisma.community.findFirst({
      where: { name: init.name },
      select: { id: true },
    });
    if (existing) continue;
    const coords = resolveInitiativeCoords(init);
    await prisma.community.create({
      data: {
        name: init.name,
        description: buildInitiativeDescription(init),
        type: mappedType,
        city: init.city || "Országos",
        ...(init.region ? { region: init.region } : {}),
        country: init.country || "Magyarország",
        ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
        ...(init.foundingYear ? { foundingYear: init.foundingYear } : {}),
        ...(init.website ? { website: init.website } : {}),
        ownerId: adminId,
        visibility: "PUBLIC",
        moderationStatus: "APPROVED",
      },
    });
    initCount++;
  }
  return initCount;
}

// Seed events sequentially (existing-check-then-create order matters); returns
// the count of newly created records. Honours explicit ISO start/end dates from
// the dataset (the prior version hardcoded "now + 10 days" for every event).
async function seedEvents(events: SeedEvent[], adminId: string): Promise<number> {
  let evCount = 0;
  for (const ev of events) {
    const mappedCat = resolveEventCategory(ev);
    const existing = await prisma.event.findFirst({
      where: { title: ev.name },
      select: { id: true },
    });
    if (existing) continue;
    const coords = resolveEventLatLng(ev);
    const startDate = parseSeedDate(ev.startDate) ?? new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const endDate = parseSeedDate(ev.endDate) ?? new Date(startDate.getTime() + 4 * 60 * 60 * 1000);
    await prisma.event.create({
      data: {
        title: ev.name,
        description: buildEventDescription(ev),
        location: ev.location,
        address: ev.location,
        ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
        ...(typeof ev.isOnline === "boolean" ? { isOnline: ev.isOnline } : {}),
        type: "PUBLIC",
        category: mappedCat,
        hostId: adminId,
        status: "UPCOMING",
        moderationStatus: "APPROVED",
        startDate,
        endDate,
      },
    });
    evCount++;
  }
  return evCount;
}

export async function seedNetworkData() {
  try {
    await assertAdmin();
    const admin = await prisma.user.findUnique({
      where: { email: "admin@changemappers.hu" },
      select: { id: true },
    });
    if (!admin) return { success: false, error: "Admin account not found." };

    const dataPath = path.join(
      process.cwd(),
      "docs",
      "data",
      "hu",
      "initiatives.json",
    );
    if (!fs.existsSync(dataPath))
      return { success: false, error: "Initiatives data file not found" };

    const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    const initCount = await seedCommunities(data.initiatives, admin.id);
    const evCount = await seedEvents(data.events, admin.id);

    return {
      success: true,
      message: await localizeActionMessage('admin.seed.networkUpdated', { communities: initCount, events: evCount }),
    };
  } catch (error) {
    logActionError('Seed Network Data Error', error);
    return { success: false, error: await localizeActionMessage('admin.seed.uploadFailed') };
  }
}

// Delete every event that has fully elapsed (ended before the start of today, or
// — when no end date is set — started before today). Admin-gated. Uses the same
// `event.deleteMany` path as the admin "Manage Events" delete (children cascade).
export async function deletePastEvents() {
  try {
    await assertAdmin();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const result = await prisma.event.deleteMany({
      where: {
        OR: [
          { endDate: { lt: startOfToday } },
          { AND: [{ endDate: null }, { startDate: { lt: startOfToday } }] },
        ],
      },
    });
    return {
      success: true,
      message: await localizeActionMessage('admin.seed.pastEventsDeleted', { count: result.count }),
    };
  } catch (error) {
    logActionError('Delete Past Events Error', error);
    return { success: false, error: await localizeActionMessage('common.deleteFailed') };
  }
}

export async function clearDemoData() {
  try {
    await assertAdmin();
    const demoEvents = await prisma.event.findMany({
      where: { title: { startsWith: DEMO_BATCH_PREFIX } },
      select: { id: true },
      take: 500,
    });
    for (const ev of demoEvents) {
      await prisma.eventRsvp.deleteMany({ where: { eventId: ev.id } });
      await prisma.event.delete({ where: { id: ev.id } });
    }
    await prisma.weakSignal.deleteMany({
      where: { title: { startsWith: DEMO_BATCH_PREFIX } },
    });
    await prisma.socialIssue.deleteMany({
      where: { title: { startsWith: DEMO_BATCH_PREFIX } },
    });

    const demoCommunities = await prisma.community.findMany({
      where: { name: { startsWith: DEMO_BATCH_PREFIX } },
      select: { id: true },
      take: 500,
    });
    for (const c of demoCommunities) {
      await prisma.communityMember.deleteMany({ where: { communityId: c.id } });
      await prisma.community.delete({ where: { id: c.id } });
    }

    return {
      success: true,
      message: await localizeActionMessage('admin.seed.clearDemoSuccess'),
    };
  } catch (error) {
    logActionError('Clear Data Error', error);
    return { success: false, error: await localizeActionMessage('common.deleteFailed') };
  }
}

export async function getCounts() {
  await assertAdmin();
  const userCount = await prisma.user.count({
    where: { email: { endsWith: DEMO_EMAIL_SUFFIX } },
  });
  const communityCount = await prisma.community.count({
    where: { name: { startsWith: DEMO_BATCH_PREFIX } },
  });
  const eventCount = await prisma.event.count({
    where: { title: { startsWith: DEMO_BATCH_PREFIX } },
  });
  const signalCount = await prisma.weakSignal.count({
    where: { title: { startsWith: DEMO_BATCH_PREFIX } },
  });
  const issueCount = await prisma.socialIssue.count({
    where: { title: { startsWith: DEMO_BATCH_PREFIX } },
  });

  return { userCount, communityCount, eventCount, signalCount, issueCount };
}

// ─── Demo Entity CRUD ──────────────────────────────────────────────────────────

