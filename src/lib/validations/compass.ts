import { z } from 'zod';

export const saveCompassPlacementSchema = z.object({
  level: z.number().int().min(1).max(10),
});

export const saveCompassClaritySchema = z.object({
  northStar: z.string().min(1).max(2000),
	nonNegotiables: z.array(z.string().max(500)).max(20),
  originQuestion: z.string().max(2000).optional(),
});

const ecosystemMapSchema = z.object({
  sharers: z.array(z.string().max(200)).max(30),
  gatekeepers: z.array(z.string().max(200)).max(30),
  affected: z.array(z.string().max(200)).max(30),
  gapReflection: z.string().max(2000).optional(),
});

const translationMapSchema = z.object({
  myFraming: z.string().max(2000),
  alliesFraming: z.string().max(2000),
  powerFraming: z.string().max(2000),
});

export const saveCompassContextSchema = z.object({
  ecosystemMap: ecosystemMapSchema.optional(),
  translationMap: translationMapSchema.optional(),
  conflictStyleNote: z.string().max(2000).optional(),
  communicationNote: z.string().max(2000).optional(),
});

const supportNetworkSchema = z.object({
  mentor: z.string().max(200).optional(),
  peer: z.string().max(200).optional(),
  challenger: z.string().max(200).optional(),
  believer: z.string().max(200).optional(),
});

export const saveCompassCapacitySchema = z.object({
  timeScore: z.number().int().min(0).max(10),
  resourceScore: z.number().int().min(0).max(10),
  bandwidthScore: z.number().int().min(0).max(10),
  confirmedScope: z.number().int().min(0).max(10),
  energyPatterns: z.string().max(2000).optional(),
  riskFears: z.string().max(2000).optional(),
  emotionalPattern: z.string().max(2000).optional(),
  supportNetwork: supportNetworkSchema.optional(),
});

const experimentSchema = z.object({
  action: z.string().min(1).max(500),
  people: z.string().max(500),
  hypothesis: z.string().max(500),
  impactCheck: z.string().max(500),
  outcome: z.string().max(500).optional(),
});

const domainBalanceSchema = z.object({
  relationships: z.string().max(500).optional(),
  resources: z.string().max(500).optional(),
  knowledge: z.string().max(500).optional(),
  influence: z.string().max(500).optional(),
  wellbeing: z.string().max(500).optional(),
  integrity: z.string().max(500).optional(),
});

export const saveCompassCatalystSchema = z.object({
	experiments: z.array(experimentSchema).max(10),
  domainBalance: domainBalanceSchema.optional(),
  storyWhy: z.string().max(2000).optional(),
  storyVision: z.string().max(2000).optional(),
  storyShift: z.string().max(2000).optional(),
});

export type SaveCompassPlacementInput = z.infer<typeof saveCompassPlacementSchema>;
export type SaveCompassClarityInput = z.infer<typeof saveCompassClaritySchema>;
export type SaveCompassContextInput = z.infer<typeof saveCompassContextSchema>;
export type SaveCompassCapacityInput = z.infer<typeof saveCompassCapacitySchema>;
export type SaveCompassCatalystInput = z.infer<typeof saveCompassCatalystSchema>;
