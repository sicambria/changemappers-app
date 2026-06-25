'use server';

// Single demo user/community/event CRUD actions.
import type { DemoUserInput, DemoCommunityInput, DemoEventInput } from '@/types/demo-seed';
import { prisma, Archetype, CommunityType, EventCategory, ProfileType } from "@/lib/prisma";
import { DEMO_BATCH_PREFIX } from "@/types/demo-seed";
import { localizeActionMessage } from '@/lib/action-result-i18n';
import { DEFAULT_DEMO_LOCATION, withDemoPrefix, resolveDemoCoords, DEMO_EMAIL_SUFFIX } from "@/lib/demo-seed/geo";
import { assertAdmin } from './shared';

export async function createDemoUser(input: DemoUserInput) {
  try {
    await assertAdmin();
    const slug = input.name
      .toLowerCase()
      .replaceAll(/\s+/g, ".")
      .replaceAll(/[^a-z0-9.]/g, "");
    const email = `${slug}.${Date.now()}${DEMO_EMAIL_SUFFIX}`;
    const user = await prisma.user.create({
      data: {
        email,
        name: input.name,
        displayName: input.displayName || input.name,
        bio: input.bio || null,
        city: input.city || DEFAULT_DEMO_LOCATION.name,
        country: input.country || "Magyarország",
        latitude: resolveDemoCoords({ place: input.city }).lat,
        longitude: resolveDemoCoords({ place: input.city }).lng,
        archetypes: (input.archetypes as Archetype[] | undefined) || [],
        profileType: ProfileType.COMMUNITY_SEEKER,
        isEmailVerified: true,
      },
    });
    return {
      success: true,
      message: await localizeActionMessage('admin.seed.demoUserCreated', { name: user.name, email: user.email }),
      id: user.id,
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function createDemoCommunity(input: DemoCommunityInput) {
  try {
    const admin = await assertAdmin();
    const cityCoords = resolveDemoCoords({
      latitude: input.latitude,
      longitude: input.longitude,
      place: input.city,
    });
    const community = await prisma.community.create({
      data: {
        name: withDemoPrefix(input.name),
        description: input.description || "",
        type:
          (input.type as CommunityType) ||
          CommunityType.INCLUSIVE_SUPPORT_NETWORK,
        city: cityCoords.locationName,
        country: input.country || "Magyarország",
        ...(cityCoords
          ? { latitude: cityCoords.lat, longitude: cityCoords.lng }
          : {}),
        ownerId: admin.id,
        visibility: "PUBLIC",
        moderationStatus: "APPROVED",
      },
    });
    return {
      success: true,
      message: await localizeActionMessage('admin.seed.demoCommunityCreated', { name: community.name }),
      id: community.id,
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function createDemoEvent(input: DemoEventInput) {
  try {
    const admin = await assertAdmin();
    const startDate = new Date(input.startDate);
    const endDate = input.endDate
      ? new Date(input.endDate)
      : new Date(startDate.getTime() + 4 * 60 * 60 * 1000);
    const eventCoords = resolveDemoCoords({
      latitude: input.latitude,
      longitude: input.longitude,
      place: input.location,
    });
    const event = await prisma.event.create({
      data: {
        title: withDemoPrefix(input.title),
        description: input.description || "",
        location: eventCoords.locationName,
        address: eventCoords.locationName,
        ...(eventCoords
          ? { latitude: eventCoords.lat, longitude: eventCoords.lng }
          : {}),
        type: "PUBLIC",
        category: (input.category as EventCategory) || EventCategory.MEETUP,
        hostId: admin.id,
        status: "UPCOMING",
        moderationStatus: "APPROVED",
        startDate,
        endDate,
      },
    });
    return {
      success: true,
      message: await localizeActionMessage('admin.seed.demoEventCreated', { title: event.title }),
      id: event.id,
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function deleteDemoUser(id: string) {
  try {
    await assertAdmin();
    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true, name: true },
    });
    if (!user) return { success: false, error: await localizeActionMessage('user.notFound') };
    if (!user.email.endsWith(DEMO_EMAIL_SUFFIX)) {
      return {
        success: false,
        error: await localizeActionMessage('admin.seed.onlyDemoUsersDelete'),
      };
    }
    await prisma.user.delete({ where: { id } });
    return { success: true, message: await localizeActionMessage('admin.seed.demoUserDeleted', { name: user.name }) };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function deleteDemoCommunity(id: string) {
  try {
    await assertAdmin();
    const community = await prisma.community.findUnique({
      where: { id },
      select: { name: true },
    });
    if (!community) return { success: false, error: await localizeActionMessage('community.notFound') };
    if (!community.name.startsWith(DEMO_BATCH_PREFIX)) {
      return {
        success: false,
        error: await localizeActionMessage('admin.seed.onlyDemoCommunitiesDelete'),
      };
    }
    await prisma.communityMember.deleteMany({ where: { communityId: id } });
    await prisma.community.delete({ where: { id } });
    return { success: true, message: await localizeActionMessage('admin.seed.communityDeleted', { name: community.name }) };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function deleteDemoEvent(id: string) {
  try {
    await assertAdmin();
    const event = await prisma.event.findUnique({
      where: { id },
      select: { title: true },
    });
    if (!event) return { success: false, error: await localizeActionMessage('event.notFound') };
    if (!event.title.startsWith(DEMO_BATCH_PREFIX)) {
      return {
        success: false,
        error: await localizeActionMessage('admin.seed.onlyDemoEventsDelete'),
      };
    }
    await prisma.eventRsvp.deleteMany({ where: { eventId: id } });
    await prisma.event.delete({ where: { id } });
    return { success: true, message: await localizeActionMessage('admin.seed.eventDeleted', { title: event.title }) };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function listDemoUsers() {
  try {
    await assertAdmin();
    const users = await prisma.user.findMany({
      where: { email: { endsWith: DEMO_EMAIL_SUFFIX } },
      select: {
        id: true,
        name: true,
        email: true,
        city: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { success: true, data: users };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
      data: [],
    };
  }
}

export async function listDemoCommunities() {
  try {
    await assertAdmin();
    const communities = await prisma.community.findMany({
      where: { name: { startsWith: DEMO_BATCH_PREFIX } },
      select: { id: true, name: true, type: true, city: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return { success: true, data: communities };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
      data: [],
    };
  }
}

export async function listDemoEvents() {
  try {
    await assertAdmin();
    const events = await prisma.event.findMany({
      where: { title: { startsWith: DEMO_BATCH_PREFIX } },
      select: {
        id: true,
        title: true,
        category: true,
        location: true,
        startDate: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return { success: true, data: events };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
      data: [],
    };
  }
}

// ─── Batch Demo Users ──────────────────────────────────────────────────────────
