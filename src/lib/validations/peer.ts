import { z } from 'zod';

export const createPeerSupportOfferSchema = z.object({
  situationsNavigated: z.array(z.string().min(2).max(100)).min(1, 'Add at least one situation').max(10),
  format: z.string().min(2).max(100),
  capacity: z.number().int().min(1).max(10).default(1),
  boundaryStatement: z.string().min(10).max(500),
});

export const createPeerSupportRequestSchema = z.object({
  situationType: z.string().min(2).max(200),
  whatSupportLooks: z.string().min(10).max(500),
  whatNotLooking: z.string().min(10).max(500),
});

export const acceptPeerSupportRequestSchema = z.object({
  requestId: z.cuid(),
  offerId: z.cuid(),
  format: z.string().min(2).max(100),
  arcLength: z.string().max(100).optional(),
});

export const submitPeerSupportFeedbackSchema = z.object({
  connectionId: z.cuid(),
  feltMet: z.boolean().optional(),
  feltSafe: z.boolean().optional(),
  publicNote: z.string().max(500).optional(),
});

export type CreatePeerSupportOfferInput = z.infer<typeof createPeerSupportOfferSchema>;
export type CreatePeerSupportRequestInput = z.infer<typeof createPeerSupportRequestSchema>;
export type AcceptPeerSupportRequestInput = z.infer<typeof acceptPeerSupportRequestSchema>;
export type SubmitPeerSupportFeedbackInput = z.infer<typeof submitPeerSupportFeedbackSchema>;
