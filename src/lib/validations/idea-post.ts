import { z } from 'zod';
import { IdeaPostType, IdeaPostStatus } from '@/lib/prisma-shared';
import { assertCanonicalRdgIds } from '@/lib/taxonomy';

// Public community-ideas surface — every field is capped (abuse vector).
export const IDEA_LIMITS = {
  title: 100,
  description: 4000,
  comment: 2000,
  tag: 30,
  maxTags: 10,
  maxRdgTags: 5,
  search: 100,
  maxPageSize: 50,
} as const;

const tagsSchema = z
  .array(z.string().trim().min(1).max(IDEA_LIMITS.tag))
  .max(IDEA_LIMITS.maxTags)
  .default([]);

// Canonical RDG ids (RDG01..RDG30) — same taxonomy as Initiative.rdgAlignment.
const rdgTagsSchema = z
  .array(z.string().min(1).max(100))
  .max(IDEA_LIMITS.maxRdgTags)
  .default([])
  .transform((values): string[] => assertCanonicalRdgIds(values));

export const submitIdeaPostSchema = z.object({
  title: z.string().trim().min(1).max(IDEA_LIMITS.title),
  description: z.string().trim().min(1).max(IDEA_LIMITS.description),
  type: z.enum(IdeaPostType),
  tags: tagsSchema,
  rdgTags: rdgTagsSchema,
  feedbackId: z.cuid().optional(),
});
export type SubmitIdeaPostInput = z.input<typeof submitIdeaPostSchema>;

export const addIdeaCommentSchema = z.object({
  ideaPostId: z.cuid(),
  content: z.string().trim().min(1).max(IDEA_LIMITS.comment),
});

export const ideaPostSortSchema = z.enum(['votes', 'newest']).default('votes');

export const getIdeaPostsSchema = z.object({
  type: z.enum(IdeaPostType).optional(),
  status: z.enum(IdeaPostStatus).optional(),
  rdgTags: z.array(z.string().min(1).max(100)).max(IDEA_LIMITS.maxRdgTags).optional(),
  tags: z.array(z.string().trim().min(1).max(IDEA_LIMITS.tag)).max(IDEA_LIMITS.maxTags).optional(),
  search: z.string().trim().max(IDEA_LIMITS.search).optional(),
  sort: ideaPostSortSchema,
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(IDEA_LIMITS.maxPageSize).default(20),
});
export type GetIdeaPostsInput = z.input<typeof getIdeaPostsSchema>;

export const adminUpdateIdeaPostStatusSchema = z.object({
  id: z.cuid(),
  status: z.enum(IdeaPostStatus),
});
