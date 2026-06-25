'use server';

import { logActionError } from '@/lib/action-logger';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';
import { revalidatePath } from 'next/cache';

export async function adminGetQuotesAction() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data.isAdmin) {
    return { success: false as const, error: 'common:errors.unauthorized' };
  }

  const quotes = await prisma.quote.findMany({
    take: 250,
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    select: { id: true, text: true, author: true, source: true, isActive: true, createdAt: true, updatedAt: true },
  });

  return { success: true as const, data: quotes };
}

export async function adminCreateQuoteAction(
  text: string,
  author: string,
  source?: string,
) {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data.isAdmin) {
    return { success: false as const, error: 'common:errors.unauthorized' };
  }

  if (!text.trim() || !author.trim()) {
    return { success: false as const, error: 'Text and author are required' };
  }

  try {
    const quote = await prisma.quote.create({
      data: { text: text.trim(), author: author.trim(), source: source?.trim() || null },
    });
    revalidatePath('/admin/quotes');
    return { success: true as const, data: quote };
  } catch (error) {
    logActionError('[admin/quotes] Create failed', error);
    return { success: false as const, error: 'Failed to create quote' };
  }
}

export async function adminUpdateQuoteAction(
  id: string,
  data: { text?: string; author?: string; source?: string | null; isActive?: boolean },
) {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data.isAdmin) {
    return { success: false as const, error: 'common:errors.unauthorized' };
  }

  try {
    const quote = await prisma.quote.update({ where: { id }, data });
    revalidatePath('/admin/quotes');
    return { success: true as const, data: quote };
  } catch (error) {
    logActionError('[admin/quotes] Update failed', error);
    return { success: false as const, error: 'Failed to update quote' };
  }
}

export async function adminDeleteQuoteAction(id: string) {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data.isAdmin) {
    return { success: false as const, error: 'common:errors.unauthorized' };
  }

  try {
    await prisma.quote.delete({ where: { id } });
    revalidatePath('/admin/quotes');
    return { success: true as const };
  } catch (error) {
    logActionError('[admin/quotes] Delete failed', error);
    return { success: false as const, error: 'Failed to delete quote' };
  }
}
