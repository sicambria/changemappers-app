'use server';

import { logActionError } from '@/lib/action-logger';
import { getCurrentUserData } from '@/lib/get-current-user';
import { prisma } from '@/lib/prisma';
import { getAllExperimentalFeatures, isFeatureEnabledForUser } from '@/lib/experimental-features';
import type { ExperimentalFeature } from '@/lib/prisma';

export type ExperimentalFeatureWithUserState = ExperimentalFeature & {
  userOverride: boolean | null;
  effectiveEnabled: boolean;
};

export async function getMyExperimentalFeaturesAction(): Promise<{
  success: boolean;
  data?: ExperimentalFeatureWithUserState[];
  error?: string;
}> {
  try {
    const userResult = await getCurrentUserData();
    if (!userResult.success || !userResult.data?.user) {
      return { success: false, error: 'Not authenticated' };
    }
    const userId = userResult.data.user.id;

    const [enabledFeatures, userRecord] = await Promise.all([
      getAllExperimentalFeatures(),
      prisma.user.findUnique({
        where: { id: userId },
        select: { experimentalFeatureOverrides: true },
      }),
    ]);

    const globallyEnabled = enabledFeatures.filter((f) => f.globallyEnabled);
    const userOverrides = (userRecord?.experimentalFeatureOverrides ?? {}) as Record<string, boolean>;

    const staleSlugs = Object.keys(userOverrides).filter(
      (slug) => !enabledFeatures.some((f) => f.slug === slug),
    );
    if (staleSlugs.length > 0) {
      const cleaned = { ...userOverrides };
      for (const slug of staleSlugs) {
        delete cleaned[slug];
      }
      await prisma.user.update({
        where: { id: userId },
        data: { experimentalFeatureOverrides: cleaned },
      });
    }

    const result: ExperimentalFeatureWithUserState[] = globallyEnabled.map((f) => {
      const userOverride = f.slug in userOverrides ? Boolean(userOverrides[f.slug]) : null;
      return {
        ...f,
        userOverride,
        effectiveEnabled: isFeatureEnabledForUser(f, userOverrides),
      };
    });

    return { success: true, data: result };
  } catch (error) {
    logActionError('Error fetching experimental features', error);
    return { success: false, error: 'Failed to load experimental features' };
  }
}

export async function updateExperimentalFeatureOverridesAction(
  overrides: Record<string, boolean>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const userResult = await getCurrentUserData();
    if (!userResult.success || !userResult.data?.user) {
      return { success: false, error: 'Not authenticated' };
    }

    await prisma.user.update({
      where: { id: userResult.data.user.id },
      data: { experimentalFeatureOverrides: overrides },
    });

    return { success: true };
  } catch (error) {
    logActionError('Error updating experimental feature overrides', error);
    return { success: false, error: 'Failed to update experimental feature preferences' };
  }
}
