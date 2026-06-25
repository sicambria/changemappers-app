import { z } from 'zod';
import { DEFAULT_COMMONS_LICENSE } from '@/lib/cmap2';
import { assertCanonicalRdgIds } from '@/lib/taxonomy';
import { isHttpUrl } from '@/lib/url-safety';

export const createPitchSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80, 'Name must be at most 80 characters'),
  summary: z.string().min(10, 'Summary must be at least 10 characters').max(200, 'Summary must be at most 200 characters'),
  location: z.string().min(2, 'Location must be at least 2 characters').max(120, 'Location must be at most 120 characters'),
  website: z.url('Must be a valid URL').max(500, 'URL must be at most 500 characters').refine((value) => isHttpUrl(value), 'Only HTTP or HTTPS URLs are allowed').optional().or(z.literal('')),

  localContext: z.string().min(20, 'Context must be at least 20 characters').max(500, 'Context must be at most 500 characters'),
  systemicChallenge: z.string().min(10, 'Challenge must be at least 10 characters').max(300, 'Challenge must be at most 300 characters'),

  vision: z.string().min(10, 'Vision must be at least 10 characters').max(300, 'Vision must be at most 300 characters'),
  rdgTags: z.array(z.string()).min(1, 'Select at least 1 RDG').max(5, 'Select at most 5 RDGs').transform((values): string[] => assertCanonicalRdgIds(values)),
  expectedOutcomes: z.string().min(20, 'Outcomes must be at least 20 characters').max(400, 'Outcomes must be at most 400 characters'),

  teamDescription: z.string().min(10, 'Team description must be at least 10 characters').max(300, 'Team description must be at most 300 characters'),
  experience: z.string().max(300, 'Experience must be at most 300 characters').optional().or(z.literal('')),
  evidenceLinks: z.array(z.url('Must be a valid URL').refine((value) => isHttpUrl(value), 'Only HTTP or HTTPS URLs are allowed')).max(3, 'Maximum 3 evidence links').optional(),
  temporalClass: z.enum(['PROJECT', 'SEASONAL', 'GENERATIONAL']).default('PROJECT'),
  license: z.string().max(80).default(DEFAULT_COMMONS_LICENSE),
  protocolLabels: z.array(z.enum(['TK_NOTICE', 'TK_ATTRIBUTION', 'BC_NOTICE', 'BC_PROVENANCE'])).max(4).optional().default([]),
  casesWithProvenance: z.boolean().optional().default(false),
  notInRoomAck: z.string().max(500, 'Acknowledgment must be at most 500 characters').optional().or(z.literal('')),

  stage: z.enum(['IDEA', 'RESEARCH', 'PROTOTYPE', 'PILOT', 'OPERATING', 'SCALING']),

  mainObstacles: z.string().min(10, 'Obstacles must be at least 10 characters').max(400, 'Obstacles must be at most 400 characters'),

  needsSkills: z.array(z.string()).optional(),
  needsFunding: z.boolean().optional(),
  fundingAmount: z.number().int().positive('Funding amount must be positive').optional(),
  fundingCurrency: z.string().length(3, 'Currency must be 3 letters').optional(),
  needsPartners: z.boolean().optional(),
  needsVolunteers: z.boolean().optional(),
  needsKnowledge: z.string().max(200, 'Knowledge needs must be at most 200 characters').optional().or(z.literal('')),
  needsOther: z.string().max(200, 'Other needs must be at most 200 characters').optional().or(z.literal('')),

  callToAction: z.string().min(10, 'Call to action must be at least 10 characters').max(200, 'Call to action must be at most 200 characters'),

  contactEmail: z.email('Must be a valid email').max(255, 'Email must be at most 255 characters').optional().or(z.literal('')),
  usePlatformMessaging: z.boolean().optional(),

  topicTags: z.array(z.string()).max(5, 'Maximum 5 topic tags').optional(),
  communityId: z.cuid('Invalid community ID').optional(),
  initiativeId: z.cuid('Invalid initiative ID').optional(),

  language: z.enum(['hu', 'en']).default('en'),
});

export const updatePitchSchema = createPitchSchema.partial();

export const pitchFiltersSchema = z.object({
  stage: z.enum(['IDEA', 'RESEARCH', 'PROTOTYPE', 'PILOT', 'OPERATING', 'SCALING']).optional(),
  rdgTags: z.array(z.string()).optional().transform((values): string[] | undefined => values ? assertCanonicalRdgIds(values) : values),
  needs: z.array(z.enum(['SKILLS', 'FUNDING', 'PARTNERS', 'VOLUNTEERS', 'KNOWLEDGE'])).optional(),
  location: z.string().optional(),
  authorId: z.cuid('Invalid author ID').optional(),
  communityId: z.cuid('Invalid community ID').optional(),
  language: z.enum(['hu', 'en']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  search: z.string().optional(),
});

export const endorsePitchSchema = z.object({
  pitchId: z.cuid('Invalid pitch ID'),
  message: z.string().max(200, 'Message must be at most 200 characters').optional(),
});

export const archivePitchSchema = z.object({
  pitchId: z.cuid('Invalid pitch ID'),
  reason: z.string().max(500, 'Reason must be at most 500 characters').optional(),
});

export type CreatePitchInput = z.infer<typeof createPitchSchema>;
export type UpdatePitchInput = z.infer<typeof updatePitchSchema>;
export type PitchFiltersInput = z.infer<typeof pitchFiltersSchema>;
export type EndorsePitchInput = z.infer<typeof endorsePitchSchema>;
export type ArchivePitchInput = z.infer<typeof archivePitchSchema>;
