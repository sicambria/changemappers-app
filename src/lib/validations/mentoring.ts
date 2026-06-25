import { z } from 'zod';

export const createMentorProfileSchema = z.object({
  domain: z.string().min(2).max(120),
  yearsExperience: z.number().int().min(0).max(60),
  whatCanOffer: z.string().min(20).max(1000),
  arcLengthPreference: z.string().min(2).max(100),
  maxConcurrent: z.number().int().min(1).max(10).default(2),
  professionalUrl: z.url().optional().or(z.literal('')),
});

export const createMentoringRequestSchema = z.object({
  domain: z.string().min(2).max(120),
  inflectionPoint: z.string().min(20).max(1000),
  guidanceSought: z.string().min(20).max(1000),
});

export const acceptMentoringRequestSchema = z.object({
  requestId: z.cuid(),
  arcLength: z.string().min(2).max(100),
  checkInRhythm: z.string().min(2).max(100),
});

export const submitMentoringFeedbackSchema = z.object({
  relationshipId: z.cuid(),
  phase: z.enum(['mid_arc', 'post_arc']),
  reflection: z.string().min(50).max(3000),
});

export type CreateMentorProfileInput = z.infer<typeof createMentorProfileSchema>;
export type CreateMentoringRequestInput = z.infer<typeof createMentoringRequestSchema>;
export type AcceptMentoringRequestInput = z.infer<typeof acceptMentoringRequestSchema>;
export type SubmitMentoringFeedbackInput = z.infer<typeof submitMentoringFeedbackSchema>;
