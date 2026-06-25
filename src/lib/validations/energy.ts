import { z } from 'zod';

// Canvas schemas
export const createEnergyCanvasSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  privacy: z.enum(['ONLY_ME', 'MY_COMMUNITY', 'PUBLIC']).default('ONLY_ME'),
  communityId: z.cuid().optional(),
});

export const updateEnergyCanvasSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  systemState: z.enum(['REGENERATING', 'STABLE', 'DEPLETING', 'COLLAPSING', 'CONTESTED']).optional(),
  stateReason: z.string().max(1000).optional(),
  privacy: z.enum(['ONLY_ME', 'MY_COMMUNITY', 'PUBLIC']).optional(),
});

// Entity schemas
export const energyEntityTypeSchema = z.enum([
  'INDIVIDUAL', 'HOUSEHOLD', 'WORKING_GROUP', 'COMMUNITY', 'INSTITUTION',
  'CORPORATION', 'NORM', 'COMMONS', 'INFRASTRUCTURE', 'NARRATIVE',
  'BIOREGION', 'NATION', 'TREATY_BODY',
  'TEXT', 'STICKY_NOTE', 'YOUTUBE_EMBED', 'OSM_EMBED',
]);

export const energyScaleSchema = z.enum([
  'PLANETARY_INTERNATIONAL', 'SUPRANATIONAL_REGIONAL', 'NATIONAL',
  'STATE_REGIONAL', 'BIOREGIONAL', 'COMMUNITY', 'LOCAL_GROUP'
]);

export const createEnergyEntitySchema = z.object({
  canvasId: z.cuid(),
  roleLabel: z.string().min(1).max(200),
  entityType: energyEntityTypeSchema,
  primaryScale: energyScaleSchema,
  multiScale: z.array(energyScaleSchema).optional(),
  visibility: z.enum(['VISIBLE', 'PARTIALLY_VISIBLE', 'INVISIBLE']).default('VISIBLE'),
  energyState: z.enum(['EXTRACTIVE', 'REGENERATIVE', 'NEUTRAL', 'CONTESTED', 'DEPLETED', 'CAPTURED']),
  energyMagnitude: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  energyRate: z.enum(['ACUTE', 'CHRONIC', 'EPISODIC']).default('CHRONIC'),
  internalPower: z.enum(['DISTRIBUTED', 'CONCENTRATED', 'FRAGMENTED', 'ABSENT']).default('DISTRIBUTED'),
  numericValue: z.number().optional(),
  numericUnit: z.string().max(50).optional(),
  voiceAccess: z.enum(['FULL', 'PARTIAL', 'GATEKEPT', 'ABSENT']).default('FULL'),
  boundaryPermeability: z.enum(['OPEN', 'SEMI_PERMEABLE', 'CLOSED', 'CONTESTED']).default('SEMI_PERMEABLE'),
  selfDetermination: z.enum(['PRESENT', 'PARTIAL', 'ABSENT', 'CONTESTED']).default('PRESENT'),
  positionX: z.number().int().optional(),
  positionY: z.number().int().optional(),
  scaleBandY: z.number().int().min(1).max(7).optional(),
  notes: z.string().max(2000).optional(),
  widgetContent: z.string().max(2000).optional(),
  uncertaintyFlag: z.boolean().optional(),
});

export const updateEnergyEntitySchema = z.object({
  roleLabel: z.string().min(1).max(200).optional(),
  entityType: energyEntityTypeSchema.optional(),
  primaryScale: energyScaleSchema.optional(),
  multiScale: z.array(energyScaleSchema).optional(),
  visibility: z.enum(['VISIBLE', 'PARTIALLY_VISIBLE', 'INVISIBLE']).optional(),
  energyState: z.enum(['EXTRACTIVE', 'REGENERATIVE', 'NEUTRAL', 'CONTESTED', 'DEPLETED', 'CAPTURED']).optional(),
  energyMagnitude: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  energyRate: z.enum(['ACUTE', 'CHRONIC', 'EPISODIC']).optional(),
  internalPower: z.enum(['DISTRIBUTED', 'CONCENTRATED', 'FRAGMENTED', 'ABSENT']).optional(),
  numericValue: z.number().optional(),
  numericUnit: z.string().max(50).optional(),
  voiceAccess: z.enum(['FULL', 'PARTIAL', 'GATEKEPT', 'ABSENT']).optional(),
  boundaryPermeability: z.enum(['OPEN', 'SEMI_PERMEABLE', 'CLOSED', 'CONTESTED']).optional(),
  selfDetermination: z.enum(['PRESENT', 'PARTIAL', 'ABSENT', 'CONTESTED']).optional(),
  positionX: z.number().int().optional(),
  positionY: z.number().int().optional(),
  scaleBandY: z.number().int().min(1).max(7).optional(),
  notes: z.string().max(2000).optional(),
  widgetContent: z.string().max(2000).optional(),
  uncertaintyFlag: z.boolean().optional(),
});

export const updateEnergyEntityPositionSchema = z.object({
  positionX: z.number().int(),
  positionY: z.number().int(),
  scaleBandY: z.number().int().min(1).max(7).optional(),
});

// Relation schemas
export const createEnergyRelationSchema = z.object({
  canvasId: z.cuid(),
  fromEntityId: z.cuid(),
  toEntityId: z.cuid(),
  powerDistance: z.enum(['OVER', 'UNDER', 'PEER', 'ABSENT', 'CONTESTED']),
  energyFlow: z.enum(['EXTRACTIVE_FLOW', 'GENERATIVE_FLOW', 'CAPTURED_FLOW', 'DIVERTED_FLOW']),
  informationFlow: z.enum(['TRANSPARENT', 'DISTORTED', 'SUPPRESSED', 'WEAPONIZED']),
  visibility: z.enum(['VISIBLE', 'PARTIALLY_VISIBLE', 'INVISIBLE']).default('VISIBLE'),
  consent: z.enum(['AGREED', 'IMPOSED', 'STRUCTURALLY_IMPOSSIBLE_TO_REFUSE', 'CONTESTED']),
  energyMagnitude: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  numericValue: z.number().optional(),
  numericUnit: z.string().max(50).optional(),
  isCrossScale: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
  uncertaintyFlag: z.boolean().optional(),
});

export const updateEnergyRelationSchema = z.object({
  powerDistance: z.enum(['OVER', 'UNDER', 'PEER', 'ABSENT', 'CONTESTED']).optional(),
  energyFlow: z.enum(['EXTRACTIVE_FLOW', 'GENERATIVE_FLOW', 'CAPTURED_FLOW', 'DIVERTED_FLOW']).optional(),
  informationFlow: z.enum(['TRANSPARENT', 'DISTORTED', 'SUPPRESSED', 'WEAPONIZED']).optional(),
  visibility: z.enum(['VISIBLE', 'PARTIALLY_VISIBLE', 'INVISIBLE']).optional(),
  consent: z.enum(['AGREED', 'IMPOSED', 'STRUCTURALLY_IMPOSSIBLE_TO_REFUSE', 'CONTESTED']).optional(),
  energyMagnitude: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  numericValue: z.number().optional(),
  numericUnit: z.string().max(50).optional(),
  isCrossScale: z.boolean().optional(),
  patternDetected: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
  uncertaintyFlag: z.boolean().optional(),
});

// Snapshot schema
export const createEnergySnapshotSchema = z.object({
  canvasId: z.cuid(),
  name: z.string().min(2).max(200),
});

// Pattern entry schema
export const proposeEnergyPatternSchema = z.object({
  name: z.string().min(2).max(200),
  category: z.string().min(2).max(100),
  definition: z.string().min(10).max(2000),
  structuralSignature: z.record(z.string(), z.unknown()),
  mechanismDescription: z.string().min(10).max(2000),
  leveragePoints: z.array(z.string().max(500)).min(1).max(10),
  realWorldExamples: z.string().max(3000),
});

// Data point schema
export const createEntityDataPointSchema = z.object({
  entityId: z.cuid(),
  value: z.number(),
  isQualitative: z.boolean().default(false),
  source: z.string().max(500).optional(),
});

// Type exports
export type CreateEnergyCanvasInput = z.infer<typeof createEnergyCanvasSchema>;
export type UpdateEnergyCanvasInput = z.infer<typeof updateEnergyCanvasSchema>;
export type CreateEnergyEntityInput = z.infer<typeof createEnergyEntitySchema>;
export type UpdateEnergyEntityInput = z.infer<typeof updateEnergyEntitySchema>;
export type UpdateEnergyEntityPositionInput = z.infer<typeof updateEnergyEntityPositionSchema>;
export type CreateEnergyRelationInput = z.infer<typeof createEnergyRelationSchema>;
export type UpdateEnergyRelationInput = z.infer<typeof updateEnergyRelationSchema>;
export type CreateEnergySnapshotInput = z.infer<typeof createEnergySnapshotSchema>;
export type ProposeEnergyPatternInput = z.infer<typeof proposeEnergyPatternSchema>;
export type CreateEntityDataPointInput = z.infer<typeof createEntityDataPointSchema>;
