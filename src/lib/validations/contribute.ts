import { z } from 'zod';

const contributionTypeEnum = z.enum([
  'SKILL_OFFERING',
  'ACCOMPANIMENT',
  'KNOWLEDGE_COMMONS',
  'HOLDING_SPACE',
]);

const targetAudienceEnum = z.enum([
  'INDIVIDUALS',
  'COMMUNITIES',
  'NGOS',
  'SCHOOLS',
  'PUBLIC_INSTITUTIONS',
  'BUSINESSES',
  'POLICYMAKERS',
  'RESEARCHERS',
  'OTHER',
]);

const impactTypeEnum = z.enum([
  'DIRECT_SERVICE',
  'CAPACITY_BUILDING',
  'SYSTEMIC_CHANGE',
  'AWARENESS_RAISING',
  'RESEARCH_DOCUMENTATION',
  'NETWORK_BUILDING',
  'POLICY_INFLUENCE',
  'RESOURCE_CREATION',
  'OTHER',
]);

export const createContributionOfferSchema = z.object({
  type: contributionTypeEnum,
  domain: z.string().max(120).optional(),
  targetAudience: targetAudienceEnum.optional(),
  impactType: impactTypeEnum.optional(),
  timeCommitment: z.string().min(2).max(200),
  format: z.string().min(2).max(100),
  availability: z.string().min(2).max(200),
  prerequisites: z.string().max(500).optional(),
});

export const createContributionRequestSchema = z.object({
  type: contributionTypeEnum,
  whatNeeded: z.string().min(20).max(1000),
  alreadyTried: z.string().max(500).optional(),
  willDoWith: z.string().max(500).optional(),
});

export const submitContributionFeedbackSchema = z.object({
  connectionId: z.cuid(),
  publicReflection: z
    .string()
    .min(50, 'Please write at least 50 characters — this reflection lives on the connection record')
    .max(3000),
});

export type CreateContributionOfferInput = z.infer<typeof createContributionOfferSchema>;
export type CreateContributionRequestInput = z.infer<typeof createContributionRequestSchema>;
export type SubmitContributionFeedbackInput = z.infer<typeof submitContributionFeedbackSchema>;
