'use server';

import { logActionError } from '@/lib/action-logger';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { revalidatePath } from 'next/cache';

export async function adminGetRadioStationsAction() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data.isAdmin) {
    return { success: false as const, error: 'common:errors.unauthorized' };
  }

  const stations = await prisma.radioStation.findMany({
    take: 250,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, url: true, genre: true, language: true, isActive: true, isDefault: true, sortOrder: true, createdAt: true, updatedAt: true },
  });

  return { success: true as const, data: stations };
}

export async function adminCreateRadioStationAction(
  name: string,
  url: string,
  genre?: string,
  language?: string,
) {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data.isAdmin) {
    return { success: false as const, error: 'common:errors.unauthorized' };
  }

  if (!name.trim() || !url.trim()) {
    return { success: false as const, error: 'Name and URL are required' };
  }

  try {
    const station = await prisma.radioStation.create({
      data: { name: name.trim(), url: url.trim(), genre: genre?.trim() || null, language: language?.trim() || null },
    });
    revalidatePath('/admin/radio-stations');
    return { success: true as const, data: station };
  } catch (error) {
    logActionError('[admin/radio-stations] Create failed', error);
    return { success: false as const, error: 'Failed to create radio station' };
  }
}

export async function adminUpdateRadioStationAction(
  id: string,
  data: { name?: string; url?: string; genre?: string | null; language?: string | null; isActive?: boolean; isDefault?: boolean; sortOrder?: number },
) {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data.isAdmin) {
    return { success: false as const, error: 'common:errors.unauthorized' };
  }

  try {
    const station = await prisma.radioStation.update({
      where: { id },
      data,
    });
    revalidatePath('/admin/radio-stations');
    return { success: true as const, data: station };
  } catch (error) {
    logActionError('[admin/radio-stations] Update failed', error);
    return { success: false as const, error: 'Failed to update radio station' };
  }
}

export async function adminDeleteRadioStationAction(id: string) {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data.isAdmin) {
    return { success: false as const, error: 'common:errors.unauthorized' };
  }

  try {
    await prisma.radioStation.delete({ where: { id } });
    revalidatePath('/admin/radio-stations');
    return { success: true as const };
  } catch (error) {
    logActionError('[admin/radio-stations] Delete failed', error);
    return { success: false as const, error: 'Failed to delete radio station' };
  }
}
