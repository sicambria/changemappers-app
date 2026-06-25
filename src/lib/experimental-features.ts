import { prisma, ExperimentalFeature, AuditAction } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

let cachedFeatures: ExperimentalFeature[] | null = null;
let lastFetch = 0;
const CACHE_TTL = 30000;

export async function getAllExperimentalFeatures(): Promise<ExperimentalFeature[]> {
  const now = Date.now();
  if (cachedFeatures && now - lastFetch < CACHE_TTL) {
    return cachedFeatures;
  }

  try {
    const features = await prisma.experimentalFeature.findMany({
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
      select: {
        id: true,
        slug: true,
        label: true,
        description: true,
        globallyEnabled: true,
        optInByDefault: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    cachedFeatures = features;
    lastFetch = now;
    return features;
  } catch {
    return cachedFeatures ?? [];
  }
}

export async function getGloballyEnabledFeatures(): Promise<ExperimentalFeature[]> {
  const all = await getAllExperimentalFeatures();
  return all.filter((f) => f.globallyEnabled);
}

export function isFeatureEnabledForUser(
  feature: ExperimentalFeature | undefined,
  userOverrides: Record<string, boolean> | null | undefined,
): boolean {
  if (!feature?.globallyEnabled) return false;

  if (userOverrides && feature.slug in userOverrides) {
    return userOverrides[feature.slug];
  }

  return !feature.optInByDefault;
}

export async function toggleGlobalFeature(
  slug: string,
  enabled: boolean,
  userId: string,
  userEmail: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const previous = await getAllExperimentalFeatures();
    const prevFeature = previous.find((f) => f.slug === slug);

    const updated = await prisma.experimentalFeature.update({
      where: { slug },
      data: { globallyEnabled: enabled },
    });

    const idx = cachedFeatures?.findIndex((f) => f.slug === slug) ?? -1;
    if (cachedFeatures && idx !== -1) {
      const updatedList = [...cachedFeatures];
      updatedList[idx] = updated;
      cachedFeatures = updatedList;
    }
    lastFetch = Date.now();

    await createAuditLog({
      userId,
      userEmail,
      action: AuditAction.EXPERIMENTAL_FEATURE_TOGGLE,
      entityType: 'ExperimentalFeature',
      entityId: slug,
      previousState: prevFeature ? { globallyEnabled: prevFeature.globallyEnabled } : undefined,
      newState: { globallyEnabled: enabled },
      metadata: { feature: slug },
    });

    return { success: true };
  } catch (error) {
    console.error(`[experimental-features] Failed to toggle ${slug}:`, error);
    return { success: false, error: 'Failed to toggle feature' };
  }
}

export async function setOptInDefault(
  slug: string,
  optInByDefault: boolean,
  userId: string,
  userEmail: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const previous = await getAllExperimentalFeatures();
    const prevFeature = previous.find((f) => f.slug === slug);

    const updated = await prisma.experimentalFeature.update({
      where: { slug },
      data: { optInByDefault },
    });

    const idx = cachedFeatures?.findIndex((f) => f.slug === slug) ?? -1;
    if (cachedFeatures && idx !== -1) {
      const updatedList = [...cachedFeatures];
      updatedList[idx] = updated;
      cachedFeatures = updatedList;
    }
    lastFetch = Date.now();

    await createAuditLog({
      userId,
      userEmail,
      action: AuditAction.EXPERIMENTAL_FEATURE_TOGGLE,
      entityType: 'ExperimentalFeature',
      entityId: slug,
      previousState: prevFeature ? { optInByDefault: prevFeature.optInByDefault } : undefined,
      newState: { optInByDefault },
      metadata: { feature: slug },
    });

    return { success: true };
  } catch (error) {
    console.error(`[experimental-features] Failed to set opt-in default for ${slug}:`, error);
    return { success: false, error: 'Failed to update feature default' };
  }
}

export async function createFeature(
  slug: string,
  label: string,
  description: string | undefined,
  userId: string,
  userEmail: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const created = await prisma.experimentalFeature.create({
      data: { slug, label, description },
    });

    if (cachedFeatures) {
      cachedFeatures = [...cachedFeatures, created];
    }
    lastFetch = Date.now();

    await createAuditLog({
      userId,
      userEmail,
      action: AuditAction.EXPERIMENTAL_FEATURE_TOGGLE,
      entityType: 'ExperimentalFeature',
      entityId: slug,
      newState: { slug, label, description },
      metadata: { action: 'create' },
    });

    return { success: true };
  } catch (error) {
    console.error(`[experimental-features] Failed to create ${slug}:`, error);
    return { success: false, error: 'Failed to create feature' };
  }
}

export async function deleteFeature(
  slug: string,
  userId: string,
  userEmail: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.experimentalFeature.delete({ where: { slug } });

    if (cachedFeatures) {
      cachedFeatures = cachedFeatures.filter((f) => f.slug !== slug);
    }
    lastFetch = Date.now();

    await createAuditLog({
      userId,
      userEmail,
      action: AuditAction.EXPERIMENTAL_FEATURE_TOGGLE,
      entityType: 'ExperimentalFeature',
      entityId: slug,
      metadata: { action: 'delete' },
    });

    return { success: true };
  } catch (error) {
    console.error(`[experimental-features] Failed to delete ${slug}:`, error);
    return { success: false, error: 'Failed to delete feature' };
  }
}

export function clearExperimentalFeaturesCacheForTests() {
  cachedFeatures = null;
  lastFetch = 0;
}
