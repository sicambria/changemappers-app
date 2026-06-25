'use server';

// Demo weak-signal and social-issue seeding actions.
import { prisma, SignalDomain, SocialIssueCategory, IssueSeverity, SignalConfidence, SignalNovelty, SignalScale } from "@/lib/prisma";
import type { DemoWeakSignalInput, DemoSocialIssueInput } from "@/types/demo-seed";
import { BATCH_DEMO_WEAK_SIGNALS, BATCH_DEMO_SOCIAL_ISSUES, DEMO_BATCH_PREFIX } from "@/types/demo-seed";
import { localizeActionMessage } from '@/lib/action-result-i18n';
import { withDemoPrefix, resolveDemoCoords } from "@/lib/demo-seed/geo";
import { assertAdmin } from './shared';

export async function createDemoWeakSignal(input: DemoWeakSignalInput) {
  try {
    const admin = await assertAdmin();
    const signal = await prisma.weakSignal.create({
      data: {
        title: withDemoPrefix(input.title),
        description: input.description,
        domain: (input.domain) || SignalDomain.OTHER,
        confidence:
          (input.confidence as SignalConfidence) || SignalConfidence.LOW,
        novelty: (input.novelty as SignalNovelty) || SignalNovelty.COMMON,
        scale: (input.scale as SignalScale) || SignalScale.INDIVIDUAL,
        isLocalizable: true,
        latitude: resolveDemoCoords({
          latitude: input.latitude,
          longitude: input.longitude,
          place: input.locationName,
        }).lat,
        longitude: resolveDemoCoords({
          latitude: input.latitude,
          longitude: input.longitude,
          place: input.locationName,
        }).lng,
        locationName: resolveDemoCoords({
          latitude: input.latitude,
          longitude: input.longitude,
          place: input.locationName,
        }).locationName,
        status: "PUBLISHED",
        verificationLevel: "ADMIN_VERIFIED",
        moderationStatus: "APPROVED",
        createdById: admin.id,
      },
    });
    return {
      success: true,
      message: await localizeActionMessage('admin.seed.demoWeakSignalCreated', { title: signal.title }),
      id: signal.id,
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function deleteDemoWeakSignal(id: string) {
  try {
    await assertAdmin();
    const signal = await prisma.weakSignal.findUnique({
      where: { id },
      select: { title: true },
    });
    if (!signal)
      return { success: false, error: await localizeActionMessage('admin.seed.weakSignalNotFound') };
    if (!signal.title.startsWith(DEMO_BATCH_PREFIX)) {
      return {
        success: false,
        error: await localizeActionMessage('admin.seed.onlyDemoWeakSignalsDelete'),
      };
    }
    await prisma.weakSignal.delete({ where: { id } });
    return { success: true, message: await localizeActionMessage('admin.seed.weakSignalDeleted', { title: signal.title }) };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function listDemoWeakSignals() {
  try {
    await assertAdmin();
    const signals = await prisma.weakSignal.findMany({
      where: { title: { startsWith: DEMO_BATCH_PREFIX } },
      select: {
        id: true,
        title: true,
        domain: true,
        confidence: true,
        locationName: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return { success: true, data: signals };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
      data: [],
    };
  }
}

// ─── Demo SocialIssue CRUD ────────────────────────────────────────────────────

export async function createDemoSocialIssue(input: DemoSocialIssueInput) {
  try {
    const admin = await assertAdmin();
    const issue = await prisma.socialIssue.create({
      data: {
        title: withDemoPrefix(input.title),
        description: input.description || null,
        category:
          (input.category) || SocialIssueCategory.OTHER,
        severity: (input.severity as IssueSeverity) || IssueSeverity.MODERATE,
        isLocalizable: true,
        latitude: resolveDemoCoords({
          latitude: input.latitude,
          longitude: input.longitude,
          place: input.locationName,
        }).lat,
        longitude: resolveDemoCoords({
          latitude: input.latitude,
          longitude: input.longitude,
          place: input.locationName,
        }).lng,
        locationName: resolveDemoCoords({
          latitude: input.latitude,
          longitude: input.longitude,
          place: input.locationName,
        }).locationName,
        status: "PUBLISHED",
        verificationLevel: "ADMIN_VERIFIED",
        createdById: admin.id,
      },
    });
    return {
      success: true,
      message: await localizeActionMessage('admin.seed.demoSocialIssueCreated', { title: issue.title }),
      id: issue.id,
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function deleteDemoSocialIssue(id: string) {
  try {
    await assertAdmin();
    const issue = await prisma.socialIssue.findUnique({
      where: { id },
      select: { title: true },
    });
    if (!issue)
      return { success: false, error: await localizeActionMessage('admin.seed.socialIssueNotFound') };
    if (!issue.title.startsWith(DEMO_BATCH_PREFIX)) {
      return {
        success: false,
        error: await localizeActionMessage('admin.seed.onlyDemoSocialIssuesDelete'),
      };
    }
    await prisma.socialIssue.delete({ where: { id } });
    return {
      success: true,
      message: await localizeActionMessage('admin.seed.socialIssueDeleted', { title: issue.title }),
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function listDemoSocialIssues() {
  try {
    await assertAdmin();
    const issues = await prisma.socialIssue.findMany({
      where: { title: { startsWith: DEMO_BATCH_PREFIX } },
      select: {
        id: true,
        title: true,
        category: true,
        severity: true,
        locationName: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return { success: true, data: issues };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
      data: [],
    };
  }
}

// ─── Batch Demo WeakSignals & SocialIssues ────────────────────────────────────

export async function seedBatchDemoWeakSignals() {
  try {
    const admin = await assertAdmin();
    const results: { title: string; status: "created" | "skipped" }[] = [];

    for (const spec of BATCH_DEMO_WEAK_SIGNALS) {
      const fullTitle = `${DEMO_BATCH_PREFIX}${spec.title}`;
      const existing = await prisma.weakSignal.findFirst({
        where: { title: fullTitle },
        select: { id: true },
      });

      if (existing) {
        results.push({ title: fullTitle, status: "skipped" });
        continue;
      }

      await prisma.weakSignal.create({
        data: {
          title: fullTitle,
          description: spec.description,
          domain: spec.domain,
          confidence: spec.confidence,
          novelty: spec.novelty,
          scale: spec.scale,
          isLocalizable: true,
          latitude: spec.latitude,
          longitude: spec.longitude,
          locationName: spec.locationName,
          status: "PUBLISHED",
          verificationLevel: "ADMIN_VERIFIED",
          moderationStatus: "APPROVED",
          createdById: admin.id,
        },
      });
      results.push({ title: fullTitle, status: "created" });
    }

    const created = results.filter((r) => r.status === "created").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    return {
      success: true,
      message: await localizeActionMessage(skipped > 0 ? 'admin.seed.batchWeakSignalsCreatedWithSkipped' : 'admin.seed.batchWeakSignalsCreated', { created, skipped }),
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

export async function seedBatchDemoSocialIssues() {
  try {
    const admin = await assertAdmin();
    const results: { title: string; status: "created" | "skipped" }[] = [];

    for (const spec of BATCH_DEMO_SOCIAL_ISSUES) {
      const fullTitle = `${DEMO_BATCH_PREFIX}${spec.title}`;
      const existing = await prisma.socialIssue.findFirst({
        where: { title: fullTitle },
        select: { id: true },
      });

      if (existing) {
        results.push({ title: fullTitle, status: "skipped" });
        continue;
      }

      await prisma.socialIssue.create({
        data: {
          title: fullTitle,
          description: spec.description,
          category: spec.category,
          severity: spec.severity,
          isLocalizable: true,
          latitude: spec.latitude,
          longitude: spec.longitude,
          locationName: spec.locationName,
          status: "PUBLISHED",
          verificationLevel: "ADMIN_VERIFIED",
          createdById: admin.id,
        },
      });
      results.push({ title: fullTitle, status: "created" });
    }

    const created = results.filter((r) => r.status === "created").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    return {
      success: true,
      message: await localizeActionMessage(skipped > 0 ? 'admin.seed.batchSocialIssuesCreatedWithSkipped' : 'admin.seed.batchSocialIssuesCreated', { created, skipped }),
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

export async function deleteBatchDemoWeakSignals() {
  try {
    await assertAdmin();
    const signals = await prisma.weakSignal.findMany({
      where: { title: { startsWith: DEMO_BATCH_PREFIX } },
      select: { id: true, title: true },
      take: 500,
    });

    let deleted = 0;
    for (const s of signals) {
      await prisma.weakSignal.delete({ where: { id: s.id } });
      deleted++;
    }

    return {
      success: true,
      message: await localizeActionMessage('admin.seed.batchWeakSignalsDeleted', { deleted }),
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function deleteBatchDemoSocialIssues() {
  try {
    await assertAdmin();
    const issues = await prisma.socialIssue.findMany({
      where: { title: { startsWith: DEMO_BATCH_PREFIX } },
      select: { id: true, title: true },
      take: 500,
    });

    let deleted = 0;
    for (const i of issues) {
      await prisma.socialIssue.delete({ where: { id: i.id } });
      deleted++;
    }

    return {
      success: true,
      message: await localizeActionMessage('admin.seed.batchSocialIssuesDeleted', { deleted }),
    };
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
