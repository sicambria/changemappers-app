'use server';

import { logActionError } from '@/lib/action-logger';
import { isDynamicServerUsageError } from '@/lib/server-action-errors';
import { z } from 'zod';
import prisma, { AuditAction, PostSource, PostVisibility } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import { fetchRSSFeed } from '@/lib/rss-processor';
import { generateSlug } from '@/lib/slug';
import { getCurrentUser } from '@/lib/get-current-user';
import { createAuditLog } from '@/lib/audit';
import { rateLimitAsync } from '@/lib/rate-limit';

import type { ApiResponse } from '@/types/common';

const createRssSourceSchema = z.object({
  name: z.string().min(1),
  url: z.url(),
  description: z.string().optional(),
  fetchInterval: z.number().min(300).max(86400).default(3600),
});

async function requireRssAdmin(): Promise<{ id: string; email: string }> {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data?.isAdmin) {
    throw new Error('Unauthorized');
  }
  return { id: auth.data.id, email: auth.data.email };
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof Error && error.message === 'Unauthorized';
}

export async function createRssSourceAction(
  data: z.infer<typeof createRssSourceSchema>
): Promise<ApiResponse<{ id: string; name: string }>> {
  try {
    const admin = await requireRssAdmin();
    const validated = createRssSourceSchema.parse(data);

    const existing = await prisma.rssSource.findUnique({
      where: { url: validated.url },
      select: { id: true }
    });

    if (existing) {
      return { success: false, error: 'RSS source with this URL already exists' };
    }

    const rssSource = await prisma.rssSource.create({
      data: {
        name: validated.name,
        url: validated.url,
        description: validated.description,
        fetchInterval: validated.fetchInterval,
      },
    });

    await createAuditLog({
      action: AuditAction.DATA_IMPORT,
      entityType: 'RssSource',
      entityId: rssSource.id,
      userId: admin.id,
      userEmail: admin.email,
      newState: { name: rssSource.name, url: validated.url },
    });

    revalidateTag('rss-sources', 'default');

    return { success: true, data: { id: rssSource.id, name: rssSource.name } };
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }
    if (isUnauthorized(error)) return { success: false, error: 'Unauthorized' };
    logActionError('createRssSourceAction', error);
    return { success: false, error: 'Failed to create RSS source' };
  }
}

async function processRssItem(
  item: { url: string | null; title: string | null; content: string; plainText: string },
  rssSourceId: string,
): Promise<boolean> {
  if (!item.url) return false;

  const existing = await prisma.feedPost.findFirst({
    where: {
      rssSourceId,
      plainText: { contains: item.url.substring(0, 100) },
    },
    select: { id: true },
  });

  if (existing) return false;

  const slug = generateSlug();
  const content = item.content || item.plainText || '';

  await prisma.feedPost.create({
    data: {
      content: item.title
        ? `<h2>${sanitizeText(item.title)}</h2>${content}`
        : content,
      plainText: item.plainText || '',
      sourceType: PostSource.RSS,
      rssSourceId,
      authorId: '',
      visibility: PostVisibility.PUBLIC,
      slug,
      status: 'APPROVED',
    },
  });

  return true;
}

export async function fetchAndProcessRssAction(
  rssSourceId: string,
  force: boolean = false
): Promise<ApiResponse<{ processed: number; skipped: number }>> {
  try {
    const admin = await requireRssAdmin();
    const rl = await rateLimitAsync(`rss_fetch_${admin.id}_${rssSourceId}`, force ? 5 : 20, 60000);
    if (!rl.success) {
      return { success: false, error: 'Too many RSS fetches - please slow down.' };
    }

    const rssSource = await prisma.rssSource.findUnique({
      where: { id: rssSourceId },
      select: { id: true, isActive: true, lastFetchedAt: true, fetchInterval: true, name: true, url: true }
    });

    if (!rssSource?.isActive) {
      return { success: false, error: 'RSS source not found or inactive' };
    }

    const now = new Date();
    const lastFetched = rssSource.lastFetchedAt;
    const interval = rssSource.fetchInterval * 1000;

    if (!force && lastFetched && now.getTime() - lastFetched.getTime() < interval) {
      return { success: false, error: 'Too early to fetch (respecting fetch interval)' };
    }

    const items = await fetchRSSFeed({
      url: rssSource.url,
      name: rssSource.name,
      maxItems: 20,
    });

    let processed = 0;
    let skipped = 0;

    for (const item of items) {
      const didCreate = await processRssItem(item, rssSource.id);
      if (didCreate) processed++;
      else skipped++;
    }

    await prisma.rssSource.update({
      where: { id: rssSourceId },
      data: { lastFetchedAt: now },
    });

    await createAuditLog({
      action: AuditAction.DATA_IMPORT,
      entityType: 'RssSource',
      entityId: rssSource.id,
      userId: admin.id,
      userEmail: admin.email,
      metadata: { processed, skipped, forced: force },
    });

    revalidateTag('feed', 'default');

    return { success: true, data: { processed, skipped } };
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }
    if (isUnauthorized(error)) return { success: false, error: 'Unauthorized' };
    logActionError('fetchAndProcessRssAction', error);
    return { success: false, error: 'Failed to fetch and process RSS' };
  }
}

export async function getRssSourcesAction(): Promise<ApiResponse<
  Array<{
    id: string;
    name: string;
    url: string;
    description: string | null;
    lastFetchedAt: Date | null;
    isActive: boolean;
  }>
>> {
  try {
    await requireRssAdmin();
    const sources = await prisma.rssSource.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        url: true,
        description: true,
        lastFetchedAt: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
      take: 50,
    });

    return { success: true, data: sources };
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }
    if (isUnauthorized(error)) return { success: false, error: 'Unauthorized' };
    logActionError('getRssSourcesAction', error);
    return { success: false, error: 'Failed to get RSS sources' };
  }
}

export async function deleteRssSourceAction(
  rssSourceId: string
): Promise<ApiResponse<void>> {
  try {
    const admin = await requireRssAdmin();
    await prisma.rssSource.update({
      where: { id: rssSourceId },
      data: { isActive: false },
    });

    await createAuditLog({
      action: AuditAction.DELETE,
      entityType: 'RssSource',
      entityId: rssSourceId,
      userId: admin.id,
      userEmail: admin.email,
      newState: { isActive: false },
    });

    revalidateTag('rss-sources', 'default');

    return { success: true, data: undefined };
  } catch (error) {
    if (isDynamicServerUsageError(error)) {
      throw error;
    }
    if (isUnauthorized(error)) return { success: false, error: 'Unauthorized' };
    logActionError('deleteRssSourceAction', error);
    return { success: false, error: 'Failed to delete RSS source' };
  }
}

function sanitizeText(text: string): string {
  return text
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
