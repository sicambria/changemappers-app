'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/get-current-user';
import prisma, { Prisma } from '@/lib/prisma';

export async function saveFeaturePreferencesAction(
  prefs: Record<string, boolean>,
): Promise<{ success: boolean; error?: string }> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) redirect('/login');

  await prisma.user.update({
    where: { id: auth.data.id },
    data: { featureVisibilityPreferences: prefs },
    select: { id: true },
  });
  revalidatePath('/settings');
  return { success: true };
}

export async function resetFeaturePreferencesAction(): Promise<{ success: boolean; error?: string }> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) redirect('/login');

  await prisma.user.update({
    where: { id: auth.data.id },
    data: { featureVisibilityPreferences: Prisma.JsonNull },
    select: { id: true },
  });
  revalidatePath('/settings');
  return { success: true };
}
