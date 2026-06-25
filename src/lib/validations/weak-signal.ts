import { z } from 'zod';
import { assertCanonicalRdgIds } from '@/lib/taxonomy';

export const SIGNAL_DOMAINS = [
  'EDUCATION',
  'GOVERNANCE',
  'FOOD',
  'TECHNOLOGY',
  'HEALTH',
  'ECONOMY',
  'ECOLOGY',
  'CULTURE',
  'ENERGY',
  'HOUSING',
  'TRANSPORT',
  'MEDIA',
  'JUSTICE',
  'FINANCE',
  'OTHER',
] as const;

export const SIGNAL_SCALES = ['INDIVIDUAL', 'COMMUNITY', 'INSTITUTIONAL', 'ECOSYSTEM'] as const;

export const SIGNAL_CONFIDENCES = ['LOW', 'MEDIUM', 'HIGH'] as const;

export const SIGNAL_NOVELTIES = ['COMMON', 'UNCOMMON', 'RARE', 'NOVEL'] as const;

export const SIGNAL_SOURCE_TYPES = [
  'FIRSTHAND',
  'SECONDHAND',
  'NEWS',
  'ACADEMIC',
  'SOCIAL_MEDIA',
  'OTHER',
] as const;

export const PATTERN_TRAJECTORIES = ['EMERGING', 'STABILIZING', 'DECLINING'] as const;

export const SIGNAL_RESONANCES = ['RESONATES', 'DOESNT_RESONATE'] as const;

export const createWeakSignalSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  context: z.string().max(2000).optional(),
  domain: z.enum(SIGNAL_DOMAINS),
  scale: z.enum(SIGNAL_SCALES).default('INDIVIDUAL'),
  confidence: z.enum(SIGNAL_CONFIDENCES).default('LOW'),
  novelty: z.enum(SIGNAL_NOVELTIES).default('COMMON'),
  regenerativeRelevance: z.coerce.number().int().min(0).max(100).default(50),
  sourceType: z.enum(SIGNAL_SOURCE_TYPES).default('FIRSTHAND'),
  sourceUrl: z.url('Must be a valid URL').optional().or(z.literal('')),
  isLocalizable: z.boolean().default(true),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  locationName: z.string().max(200).optional(),
  tags: z.array(z.string()).max(20).default([]),
  communityId: z.string().optional(),
  patternId: z.string().optional(),
});

export const updateWeakSignalSchema = z.object({
  id: z.string(),
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  context: z.string().max(2000).optional(),
  domain: z.enum(SIGNAL_DOMAINS).optional(),
  scale: z.enum(SIGNAL_SCALES).optional(),
  confidence: z.enum(SIGNAL_CONFIDENCES).optional(),
  novelty: z.enum(SIGNAL_NOVELTIES).optional(),
  regenerativeRelevance: z.coerce.number().int().min(0).max(100).optional(),
  sourceType: z.enum(SIGNAL_SOURCE_TYPES).optional(),
  sourceUrl: z.url().optional().or(z.literal('')).optional(),
  isLocalizable: z.boolean().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  locationName: z.string().max(200).optional(),
  tags: z.array(z.string()).max(20).optional(),
  communityId: z.string().optional(),
  patternId: z.string().optional(),
});

export const createPatternSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  trajectory: z.enum(PATTERN_TRAJECTORIES).default('EMERGING'),
  hypothesis: z.string().max(2000).optional(),
  relatedRdgs: z.array(z.string()).max(10).default([]).transform((values): string[] => assertCanonicalRdgIds(values)),
});

export const createCollectionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().max(2000).optional(),
});

export type CreateWeakSignalInput = z.infer<typeof createWeakSignalSchema>;
export type UpdateWeakSignalInput = z.infer<typeof updateWeakSignalSchema>;
export type CreatePatternInput = z.infer<typeof createPatternSchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
