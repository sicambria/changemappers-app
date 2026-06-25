import { z } from 'zod';

const availabilityVoteEnum = z.enum(['AVAILABLE', 'IF_NEEDED', 'UNAVAILABLE']);

export const timeOptionSchema = z.object({
  startTime: z.date(),
  endTime: z.date().optional(),
});

export const createSchedulingPollSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(1000).optional(),
  organizerName: z.string().min(1, 'Organizer name is required').max(100),
  location: z.string().max(500).optional(),
  timezone: z.string().min(1, 'Timezone is required'),
  timeOptions: z.array(timeOptionSchema).min(2, 'At least 2 time options required').max(50, 'Maximum 50 time options allowed'),
});

export const submitVoteSchema = z.object({
  pollId: z.cuid(),
  participantName: z.string().min(1, 'Name is required').max(100),
  participantToken: z.string().min(12),
  votes: z.array(z.object({
    timeOptionId: z.cuid(),
    vote: availabilityVoteEnum,
  })),
});

// AUDIT-20260613-001: organizer-only mutations must carry the secret organizerToken
// (nanoid(20)) capability — never just the non-secret pollId. The token is the
// authorization boundary, mirroring the read path getPollByOrganizerTokenAction.
const organizerTokenSchema = z.string().min(20, 'Organizer token is required');

export const confirmTimeSchema = z.object({
  pollId: z.cuid(),
  timeOptionId: z.cuid(),
  organizerToken: organizerTokenSchema,
});

export const unconfirmTimeSchema = z.object({
  pollId: z.cuid(),
  organizerToken: organizerTokenSchema,
});

export const editPollSchema = z.object({
  pollId: z.cuid(),
  organizerToken: organizerTokenSchema,
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(1000).optional(),
  location: z.string().max(500).optional(),
  addTimeOptions: z.array(timeOptionSchema).max(6).optional(),
  removeTimeOptionIds: z.array(z.cuid()).optional(),
});

export type CreateSchedulingPollInput = z.infer<typeof createSchedulingPollSchema>;
export type SubmitVoteInput = z.infer<typeof submitVoteSchema>;
export type ConfirmTimeInput = z.infer<typeof confirmTimeSchema>;
export type UnconfirmTimeInput = z.infer<typeof unconfirmTimeSchema>;
export type EditPollInput = z.infer<typeof editPollSchema>;
export type AvailabilityVoteType = z.infer<typeof availabilityVoteEnum>;
