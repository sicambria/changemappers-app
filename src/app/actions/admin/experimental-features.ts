'use server';

import { getCurrentUser } from '@/lib/get-current-user';
import {
  getAllExperimentalFeatures,
  toggleGlobalFeature,
  setOptInDefault,
  createFeature,
  deleteFeature,
} from '@/lib/experimental-features';
import { revalidatePath } from 'next/cache';

export async function getExperimentalFeaturesAction() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data.isAdmin) {
    return { success: false as const, error: 'common:errors.unauthorized' };
  }

  const features = await getAllExperimentalFeatures();
  return { success: true as const, data: features };
}

export async function toggleGlobalFeatureAction(
  slug: string,
  enabled: boolean,
) {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data.isAdmin) {
    return { success: false as const, error: 'common:errors.unauthorized' };
  }

  const result = await toggleGlobalFeature(slug, enabled, auth.data.id, auth.data.email);
  if (result.success) {
    revalidatePath('/admin');
  }
  return result;
}

export async function setOptInDefaultAction(
  slug: string,
  optInByDefault: boolean,
) {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data.isAdmin) {
    return { success: false as const, error: 'common:errors.unauthorized' };
  }

  const result = await setOptInDefault(slug, optInByDefault, auth.data.id, auth.data.email);
  if (result.success) {
    revalidatePath('/admin');
  }
  return result;
}

export async function createExperimentalFeatureAction(
  slug: string,
  label: string,
  description?: string,
) {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data.isAdmin) {
    return { success: false as const, error: 'common:errors.unauthorized' };
  }

  const result = await createFeature(slug, label, description, auth.data.id, auth.data.email);
  if (result.success) {
    revalidatePath('/admin');
  }
  return result;
}

export async function deleteExperimentalFeatureAction(slug: string) {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data.isAdmin) {
    return { success: false as const, error: 'common:errors.unauthorized' };
  }

  const result = await deleteFeature(slug, auth.data.id, auth.data.email);
  if (result.success) {
    revalidatePath('/admin');
  }
  return result;
}
