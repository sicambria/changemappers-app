import { z } from 'zod';

export const createCoachingOfferSchema = z.object({
  style: z.string().min(2).max(200),
  format: z.string().min(2).max(100),
  arcLengthOption: z.string().min(2).max(100),
  availability: z.string().min(2).max(200),
  coacheeKnow: z.string().min(10).max(1000),
});

export const createCoachingRequestSchema = z.object({
  stuckOn: z.string().min(20).max(1000),
  shiftsWanted: z.string().min(10).max(500),
  formatPreference: z.string().max(100).optional(),
});

export const acceptCoachingRequestSchema = z.object({
  requestId: z.cuid(),
  offerId: z.cuid(),
  style: z.string().min(2).max(200),
  format: z.string().min(2).max(100),
  arcLength: z.string().min(2).max(100),
  checkInRhythm: z.string().max(100).optional(),
});

export const submitCoachingFeedbackSchema = z.object({
  engagementId: z.cuid(),
  coacheeReflection: z.string().min(50).max(3000),
  coachObservation: z.string().max(1000).optional(),
});

export type CreateCoachingOfferInput = z.infer<typeof createCoachingOfferSchema>;
export type CreateCoachingRequestInput = z.infer<typeof createCoachingRequestSchema>;
export type AcceptCoachingRequestInput = z.infer<typeof acceptCoachingRequestSchema>;
export type SubmitCoachingFeedbackInput = z.infer<typeof submitCoachingFeedbackSchema>;
