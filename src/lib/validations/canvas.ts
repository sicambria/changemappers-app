import { z } from 'zod';

export const createCanvasSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  communityId: z.cuid().optional(),
  visibility: z.enum(['PUBLIC', 'REGISTERED', 'COMMUNITY']).default('REGISTERED'),
});

export const createNodeSchema = z.object({
  canvasId: z.cuid(),
  type: z.enum(['PROBLEM', 'PATTERN', 'ROOT_CAUSE', 'SOLUTION_PATTERN', 'INTERVENTION', 'TEXT', 'STICKY_NOTE']),
  title: z.string().min(2).max(300),
  description: z.string().max(2000).optional(),
  positionX: z.number().int().optional(),
  positionY: z.number().int().optional(),
});

export const updateNodePositionSchema = z.object({
  positionX: z.number().int(),
  positionY: z.number().int(),
});

export const createLinkSchema = z.object({
  canvasId: z.cuid(),
  fromNodeId: z.cuid(),
  toNodeId: z.cuid(),
  linkType: z.enum(['CAUSES', 'REINFORCES', 'CONTRIBUTES_TO', 'MITIGATES', 'SOLVED_BY', 'RELATED_PATTERN']),
});

export const proposePatternSchema = z.object({
  name: z.string().min(2).max(200),
  category: z.string().min(2).max(100),
  applicableContexts: z.array(z.string().min(2).max(200)).min(1).max(10),
  requirements: z.string().max(1000).optional(),
  limitations: z.string().max(1000).optional(),
  examples: z.string().max(2000).optional(),
});

export const addInterventionReflectionSchema = z.object({
  nodeId: z.cuid(),
  outcome: z.enum(['TRYING', 'HELPED', 'DIDNT_HELP', 'MADE_WORSE']),
  reflection: z.string().min(50).max(3000),
});

export const rootCauseDiagnosticSchema = z.object({
  canvasId: z.cuid(),
  decisionClarity: z.number().int().min(1).max(10),
  preDecisionDisagreement: z.number().int().min(1).max(10),
  coordinationAwareness: z.number().int().min(1).max(10),
  rawResponses: z.record(z.string(), z.unknown()).optional(),
});

export const addNodeCommentSchema = z.object({
  nodeId: z.cuid(),
  content: z.string().min(1).max(2000),
  parentId: z.cuid().optional(),
});

export type CreateCanvasInput = z.infer<typeof createCanvasSchema>;
export type CreateNodeInput = z.infer<typeof createNodeSchema>;
export type UpdateNodePositionInput = z.infer<typeof updateNodePositionSchema>;
export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type ProposePatternInput = z.infer<typeof proposePatternSchema>;
export type AddInterventionReflectionInput = z.infer<typeof addInterventionReflectionSchema>;
export type RootCauseDiagnosticInput = z.infer<typeof rootCauseDiagnosticSchema>;
export type AddNodeCommentInput = z.infer<typeof addNodeCommentSchema>;
