'use server';

// Curated batch demo seeding for users, communities, and events.
import { prisma, ProfileType } from "@/lib/prisma";
import { DEMO_BATCH_PREFIX } from "@/types/demo-seed";
import { localizeActionMessage } from '@/lib/action-result-i18n';
import { DEMO_EMAIL_SUFFIX } from "@/lib/demo-seed/geo";
import { BATCH_DEMO_USERS, normalizeDemoRdgAreas } from "@/lib/demo-seed/batch-users";
import { BATCH_DEMO_COMMUNITIES, BATCH_DEMO_EVENTS } from "@/lib/demo-seed/batch-entities";
import { assertAdmin } from './shared';

export async function seedBatchDemoUsers() {
  try {
    await assertAdmin();
    const results: {
      name: string;
      status: "created" | "skipped";
      email: string;
    }[] = [];

    for (const spec of BATCH_DEMO_USERS) {
      const email = `${spec.emailSlug}${DEMO_EMAIL_SUFFIX}`;
      const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existing) {
        results.push({ name: spec.name, status: "skipped", email });
        continue;
      }

      await prisma.user.create({
        data: {
          email,
          name: spec.name,
          displayName: spec.displayName,
          pronouns: spec.pronouns,
          bio: spec.bio,
          motto: spec.motto,
          website: spec.website,
          city: spec.city,
          region: spec.region,
          country: "Magyarország",
          latitude: spec.latitude,
          longitude: spec.longitude,
          locationPrecision: "CITY",
          archetypes: spec.archetypes,
          changemakeLevel: spec.changemakeLevel,
          organizationName: spec.organizationName,
          workingSectors: spec.workingSectors,
          collaborationPreference: spec.collaborationPreference,
          rdgAreas: normalizeDemoRdgAreas(spec.rdgAreas),
          enjoyDoing: spec.enjoyDoing,
          currentIntention: spec.currentIntention,
          primaryLanguage: spec.primaryLanguage,
          spokenLanguages: spec.spokenLanguages,
          availability: spec.availability,
          seekingConnections: spec.seekingConnections,
          seekingCoFounders: spec.seekingCoFounders,
          seekingSupport: spec.seekingSupport,
          profileType: ProfileType.COMMUNITY_SEEKER,
          isEmailVerified: true,
          profileVisibility: "PUBLIC",
          profileCompleteness: 90,
          skills: {
            create: spec.skills.map((s) => ({
              skill: s.skill,
              skillType: s.skillType,
            })),
          },
          values: {
            create: spec.values.map((v) => ({ value: v })),
          },
          interests: {
            create: spec.interests.map((i) => ({ interest: i })),
          },
        },
      });
      results.push({ name: spec.name, status: "created", email });
    }

    const created = results.filter((r) => r.status === "created").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    return {
      success: true,
      message: await localizeActionMessage(skipped > 0 ? 'admin.seed.batchUsersCreatedWithSkipped' : 'admin.seed.batchUsersCreated', { created, skipped }),
      results,
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
      results: [],
    };
  }
}

// ─── Batch Demo Communities & Events (Global) ──────────────────────────────────

export async function seedBatchDemoCommunities() {
  try {
    const admin = await assertAdmin();
    const results: { name: string; status: "created" | "skipped" }[] = [];

    for (const spec of BATCH_DEMO_COMMUNITIES) {
      const fullName = `${DEMO_BATCH_PREFIX}${spec.name}`;
      const existing = await prisma.community.findFirst({
        where: { name: fullName },
        select: { id: true },
      });

      if (existing) {
        results.push({ name: fullName, status: "skipped" });
        continue;
      }

      await prisma.community.create({
        data: {
          name: fullName,
          description: spec.description,
          type: spec.type,
          city: spec.city,
          country: spec.country,
          latitude: spec.latitude,
          longitude: spec.longitude,
          foundingYear: spec.foundingYear,
          seekingVolunteers: spec.seekingVolunteers,
          vision: spec.vision,
          ownerId: admin.id,
          visibility: "PUBLIC",
          moderationStatus: "APPROVED",
          source: "USER",
        },
      });
      results.push({ name: fullName, status: "created" });
    }

    const created = results.filter((r) => r.status === "created").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    return {
      success: true,
      message: await localizeActionMessage(skipped > 0 ? 'admin.seed.batchCommunitiesCreatedWithSkipped' : 'admin.seed.batchCommunitiesCreated', { created, skipped }),
      results,
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
      results: [],
    };
  }
}

export async function seedBatchDemoEvents() {
  try {
    const admin = await assertAdmin();
    const results: { title: string; status: "created" | "skipped" }[] = [];

    for (const spec of BATCH_DEMO_EVENTS) {
      const fullTitle = `${DEMO_BATCH_PREFIX}${spec.title}`;
      const existing = await prisma.event.findFirst({
        where: { title: fullTitle },
        select: { id: true },
      });

      if (existing) {
        results.push({ title: fullTitle, status: "skipped" });
        continue;
      }

      const startDate = new Date(
        Date.now() + spec.daysFromNow * 24 * 60 * 60 * 1000,
      );
      const endDate = new Date(
        startDate.getTime() + spec.durationHours * 60 * 60 * 1000,
      );

      await prisma.event.create({
        data: {
          title: fullTitle,
          description: spec.description,
          category: spec.category,
          location: spec.location,
          address: spec.location,
          latitude: spec.latitude,
          longitude: spec.longitude,
          type: "PUBLIC",
          costType: spec.costType,
          capacity: spec.capacity,
          isOnline: spec.isOnline,
          startDate,
          endDate,
          hostId: admin.id,
          status: "UPCOMING",
          moderationStatus: "APPROVED",
        },
      });
      results.push({ title: fullTitle, status: "created" });
    }

    const created = results.filter((r) => r.status === "created").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    return {
      success: true,
      message: await localizeActionMessage(skipped > 0 ? 'admin.seed.batchEventsCreatedWithSkipped' : 'admin.seed.batchEventsCreated', { created, skipped }),
      results,
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
      results: [],
    };
  }
}

export async function deleteBatchDemoCommunities() {
  try {
    await assertAdmin();
    const communities = await prisma.community.findMany({
      where: { name: { startsWith: DEMO_BATCH_PREFIX } },
      select: { id: true, name: true },
      take: 500,
    });

    let deleted = 0;
    for (const c of communities) {
      await prisma.communityMember.deleteMany({ where: { communityId: c.id } });
      await prisma.community.delete({ where: { id: c.id } });
      deleted++;
    }

    return {
      success: true,
      message: await localizeActionMessage('admin.seed.batchCommunitiesDeleted', { deleted }),
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function deleteBatchDemoEvents() {
  try {
    await assertAdmin();
    const events = await prisma.event.findMany({
      where: { title: { startsWith: DEMO_BATCH_PREFIX } },
      select: { id: true, title: true },
      take: 500,
    });

    let deleted = 0;
    for (const ev of events) {
      await prisma.eventRsvp.deleteMany({ where: { eventId: ev.id } });
      await prisma.event.delete({ where: { id: ev.id } });
      deleted++;
    }

    return { success: true, message: await localizeActionMessage('admin.seed.batchEventsDeleted', { deleted }) };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function listBatchDemoCommunities() {
  try {
    await assertAdmin();
    const communities = await prisma.community.findMany({
      where: { name: { startsWith: DEMO_BATCH_PREFIX } },
      select: {
        id: true,
        name: true,
        type: true,
        city: true,
        country: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
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

export async function listBatchDemoEvents() {
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
      take: 50,
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

export async function deleteBatchDemoUsers() {
  try {
    await assertAdmin();
    const users = await prisma.user.findMany({
      where: { email: { endsWith: DEMO_EMAIL_SUFFIX } },
      select: { id: true, name: true },
      take: 500,
    });

    let deleted = 0;
    for (const u of users) {
      await prisma.user.delete({ where: { id: u.id } });
      deleted++;
    }

    return {
      success: true,
      message: await localizeActionMessage('admin.seed.batchUsersDeleted', { deleted }),
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

// ─── Demo WeakSignal CRUD ────────────────────────────────────────────────────
