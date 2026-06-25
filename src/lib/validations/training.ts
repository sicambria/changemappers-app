import { z } from 'zod';

const baseTrainingOfferSchema = z.object({
  domain: z.string().min(2, 'Domain is required').max(120),
  format: z.enum(['WORKSHOP', 'COURSE', 'DEMO', 'RESOURCE', 'GUIDED_PRACTICE']),
  level: z.enum(['EXPLORER', 'PRACTITIONER', 'GUIDE']),
  deliveryMode: z.enum(['ONLINE', 'IN_PERSON', 'HYBRID']).default('ONLINE'),
  city: z.string().max(200).optional(),
  cityLat: z.number().optional(),
  cityLng: z.number().optional(),
  professionalUrl: z.url().optional().or(z.literal('')),
  isSync: z.boolean().default(true),
  isGroupFormat: z.boolean().default(false),
  timeCommitment: z.string().min(2).max(200),
  capacity: z.number().int().positive().optional(),
  description: z.string().min(20, 'Please describe what you offer in at least 20 characters').max(2000),
});

export const createTrainingOfferSchema = baseTrainingOfferSchema.refine(
  (data) => {
    if (data.deliveryMode === 'ONLINE') return true;
    return !!data.city;
  },
  { message: 'City is required for in-person or hybrid delivery', path: ['city'] }
);

export const editTrainingOfferSchema = baseTrainingOfferSchema.partial().extend({
  id: z.cuid(),
});

export const createTrainingRequestSchema = z.object({
  domain: z.string().min(2).max(120),
  skillGapDescription: z.string().min(20).max(1000),
  formatPreference: z.enum(['WORKSHOP', 'COURSE', 'DEMO', 'RESOURCE', 'GUIDED_PRACTICE']).optional(),
  levelPreference: z.enum(['EXPLORER', 'PRACTITIONER', 'GUIDE']).optional(),
});

export const submitTrainingFeedbackSchema = z.object({
  engagementId: z.cuid(),
  learnerReflection: z.string().min(50, 'Please write at least 50 characters — the effort of writing is the filter').max(3000),
  trainerObservation: z.string().max(1000).optional(),
});

export type CreateTrainingOfferInput = z.infer<typeof createTrainingOfferSchema>;
export type EditTrainingOfferInput = z.infer<typeof editTrainingOfferSchema>;
export type CreateTrainingRequestInput = z.infer<typeof createTrainingRequestSchema>;
export type SubmitTrainingFeedbackInput = z.infer<typeof submitTrainingFeedbackSchema>;
