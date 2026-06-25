import prisma, { FeedAnnotationSource, type Prisma } from '@/lib/prisma';
import {
  FEED_RDG_OPTIONS,
  MAX_FEED_RDG_ANNOTATIONS,
  MAX_FEED_TAG_ANNOTATIONS,
  STATIC_FEED_TAG_OPTIONS,
  type FeedRdgOption,
  type FeedTagOption,
} from '@/lib/feed-reactions';
import { assertCanonicalRdgIds } from '@/lib/taxonomy';

type FeedAnnotationClient = Prisma.TransactionClient | typeof prisma;

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function validateFeedRdgSlugs(rdgSlugs: readonly string[]): string[] {
  const normalized = unique(rdgSlugs);
  if (normalized.length > MAX_FEED_RDG_ANNOTATIONS) {
    throw new Error(`Choose up to ${MAX_FEED_RDG_ANNOTATIONS} RDGs.`);
  }

  try {
    return assertCanonicalRdgIds(normalized);
  } catch {
    throw new Error('Invalid RDG selection.');
  }
}

export async function getFeedTagOptions(client: FeedAnnotationClient = prisma): Promise<FeedTagOption[]> {
  const systemTags = await client.systemTag.findMany({
    orderBy: [{ category: 'asc' }, { label: 'asc' }],
    select: { key: true, label: true, category: true },
  });

  const byKey = new Map<string, FeedTagOption>();
  for (const option of STATIC_FEED_TAG_OPTIONS) {
    byKey.set(option.key, option);
  }
  for (const tag of systemTags) {
    byKey.set(tag.key, { key: tag.key, label: tag.label, category: tag.category });
  }

  return Array.from(byKey.values()).sort((a, b) => a.category.localeCompare(b.category) || a.label.localeCompare(b.label));
}

export async function validateFeedTagKeys(tagKeys: readonly string[], client: FeedAnnotationClient = prisma): Promise<FeedTagOption[]> {
  const normalized = unique(tagKeys);
  if (normalized.length > MAX_FEED_TAG_ANNOTATIONS) {
    throw new Error(`Choose up to ${MAX_FEED_TAG_ANNOTATIONS} tags.`);
  }

  const options = await getFeedTagOptions(client);
  const byKey = new Map(options.map((option) => [option.key, option]));
  const resolved = normalized.map((key) => byKey.get(key));
  if (resolved.some((option) => !option)) {
    throw new Error('Invalid tag selection.');
  }

  return resolved as FeedTagOption[];
}

export async function replaceFeedPostAnnotations(
  client: FeedAnnotationClient,
  params: {
    postId: string;
    userId: string;
    source: FeedAnnotationSource;
    rdgSlugs: readonly string[];
    tagKeys: readonly string[];
  },
): Promise<void> {
  const rdgSlugs = validateFeedRdgSlugs(params.rdgSlugs);
  const tags = await validateFeedTagKeys(params.tagKeys, client);

  await client.feedPostRdgAnnotation.deleteMany({
    where: { postId: params.postId, userId: params.userId, source: params.source },
  });
  await client.feedPostTagAnnotation.deleteMany({
    where: { postId: params.postId, userId: params.userId, source: params.source },
  });

  if (rdgSlugs.length > 0) {
    await client.feedPostRdgAnnotation.createMany({
      data: rdgSlugs.map((rdgSlug) => ({
        postId: params.postId,
        userId: params.userId,
        source: params.source,
        rdgSlug,
      })),
      skipDuplicates: true,
    });
  }

  if (tags.length > 0) {
    await client.feedPostTagAnnotation.createMany({
      data: tags.map((tag) => ({
        postId: params.postId,
        userId: params.userId,
        source: params.source,
        tagKey: tag.key,
        tagLabel: tag.label,
        tagCategory: tag.category,
      })),
      skipDuplicates: true,
    });
  }
}

export function mapFeedRdgAnnotations(rows: Array<{ rdgSlug: string; source: FeedAnnotationSource; userId: string }>) {
  const bySlug = new Map(FEED_RDG_OPTIONS.map((option) => [option.slug, option]));
  return rows.map((row) => ({
    ...row,
    title: bySlug.get(row.rdgSlug)?.title ?? row.rdgSlug,
  }));
}

export function getFeedRdgOptions(): FeedRdgOption[] {
  return [...FEED_RDG_OPTIONS];
}
