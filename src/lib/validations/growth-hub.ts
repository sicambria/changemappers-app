import { z } from 'zod';

export const growthModalitySchema = z.enum(['MENTOR', 'COACH', 'TRAINING', 'PEER']);
export type GrowthModality = z.infer<typeof growthModalitySchema>;
