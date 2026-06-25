import { z } from 'zod';
import { StoryTypeValues } from '@/types/stories';

const requiredText = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `${label} must be at least ${min} characters`)
    .max(max, `${label} must be at most ${max} characters`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));

export const createStorySchema = z.object({
  storyType: z.enum([StoryTypeValues.SUCCESS, StoryTypeValues.FAILURE]),
  title: requiredText('Title', 5, 160),
  summary: requiredText('Summary', 20, 400),
  context: requiredText('Context', 20, 2000),
  challenge: requiredText('Challenge', 20, 2000),
  whatHappened: requiredText('What happened', 20, 5000),
  outcome: requiredText('Outcome', 20, 3000),
  lessonsLearned: requiredText('Lessons learned', 20, 3000),
  retrospectiveWhatWorked: optionalText(1500),
  retrospectiveWhatToChange: optionalText(1500),
  retrospectiveAdvice: optionalText(1500),
  acknowledgeNoDeletion: z.boolean().refine((value) => value, {
    message: 'You must acknowledge that stories cannot be deleted later.',
  }),
  acknowledgeLicense: z.boolean().refine((value) => value, {
    message: 'You must agree to publish under CC-BY-SA 4.0.',
  }),
});

export const updateStorySchema = createStorySchema.omit({
  acknowledgeNoDeletion: true,
  acknowledgeLicense: true,
});

export const addStoryCommentSchema = z.object({
  storyId: z.cuid(),
  content: requiredText('Comment', 3, 2000),
});

export type CreateStoryInput = z.infer<typeof createStorySchema>;
export type UpdateStoryInput = z.infer<typeof updateStorySchema>;
export type AddStoryCommentInput = z.infer<typeof addStoryCommentSchema>;
