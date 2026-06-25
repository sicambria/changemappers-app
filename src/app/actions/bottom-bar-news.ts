'use server';

import { logActionError } from '@/lib/action-logger';
import { prisma, PostSource } from '@/lib/prisma';

function extractTitle(content: string): string {
  const h2Start = content.toLowerCase().indexOf('<h2');
  if (h2Start !== -1) {
    const tagEnd = content.indexOf('>', h2Start);
    const h2End = content.indexOf('</h2>', h2Start);
    if (tagEnd !== -1 && h2End !== -1 && h2End > tagEnd) {
      return content.substring(tagEnd + 1, h2End).replaceAll(/<[^>]+>/g, '').trim();
    }
  }

  const stripped = content.replaceAll(/<[^>]+>/g, '').trim();
  const firstSentence = stripped.split(/[.!?\n]/).find(Boolean);
  return (firstSentence ?? stripped).trim().substring(0, 120);
}

export async function getNewsTickerItemsAction(
  selectedSourceIds: string[],
): Promise<{
  success: boolean;
  data?: { id: string; title: string; url: string | null; sourceName: string | null }[];
  error?: string;
}> {
  try {
    const whereClause: Record<string, unknown> = {
      sourceType: PostSource.RSS,
      status: 'APPROVED',
    };

    if (selectedSourceIds.length > 0) {
      whereClause.rssSourceId = { in: selectedSourceIds };
    }

    const posts = await prisma.feedPost.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        content: true,
        plainText: true,
        rssSourceId: true,
      },
    });

    const rssSourceIds = [...new Set(posts.map((p) => p.rssSourceId).filter(Boolean))] as string[];
    const sources = rssSourceIds.length > 0
      ? await prisma.rssSource.findMany({
          where: { id: { in: rssSourceIds } },
          select: { id: true, name: true },
        })
      : [];

    const sourceMap = new Map(sources.map((s) => [s.id, s.name]));

    const items = posts
      .filter((p) => p.content || p.plainText)
      .map((p) => {
        const text = p.content || p.plainText || '';
        return {
          id: p.id,
          title: extractTitle(text),
          url: null as string | null,
          sourceName: p.rssSourceId && sourceMap.has(p.rssSourceId)
            ? sourceMap.get(p.rssSourceId)!
            : null,
        };
      });

    return { success: true, data: items };
  } catch (error) {
    logActionError('[bottom-bar-news] Failed to fetch news items', error);
    return { success: false, error: 'Failed to fetch news items' };
  }
}

export async function getAllRssSourcesAction(): Promise<{
  success: boolean;
  data?: { id: string; name: string }[];
  error?: string;
}> {
  try {
    const sources = await prisma.rssSource.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    return { success: true, data: sources };
  } catch (error) {
    logActionError('[bottom-bar-news] Failed to fetch RSS sources', error);
    return { success: false, error: 'Failed to fetch RSS sources' };
  }
}
