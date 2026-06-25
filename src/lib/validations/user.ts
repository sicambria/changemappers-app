import { z } from 'zod';

import { emptyStringToUndefined, hasUserSearchSignal, USER_SEARCH_ABUSE_LIMITS } from '@/lib/user-search/abuse';
import { isHttpUrl } from '@/lib/url-safety';

export const updateProfileSchema = z.object({
    displayName: z.string().min(2).max(100).optional(),
    bio: z.string().max(2000).optional(),
    pronouns: z.string().max(50).optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    website: z.url().refine((value) => isHttpUrl(value), 'Only HTTP or HTTPS URLs are allowed').optional().or(z.literal('')),
    profilePhoto: z.string().max(200_000).optional(), // Base64 or URL
    coverImage: z.string().max(200_000).optional(),   // Base64 or URL

    // Identity
    archetypes: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
    changemakeLevel: z.string().optional(),

    // Questionnaire
    isRemoteCapable: z.boolean().optional(),
    enjoyDoing: z.string().max(1000).optional(),
    currentIntention: z.string().max(1000).optional(),
    constraints: z.string().max(1000).optional(),
    availabilityDetails: z.string().max(1000).optional(), // We'll store as string in JSON or just string
    collaborationPreference: z.array(z.string().trim().min(1).max(120)).max(30).optional(),

    // Relations
    values: z.array(z.string().trim().min(1).max(120)).max(30).optional(),
    interests: z.array(z.string().trim().min(1).max(120)).max(30).optional(),
    skillsOffered: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
    supportNeeded: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
    profileVisibility: z.string().optional(),
});

const optionalSearchTextSchema = z.preprocess(
    emptyStringToUndefined,
    z.string().trim().min(USER_SEARCH_ABUSE_LIMITS.minQueryLength).max(USER_SEARCH_ABUSE_LIMITS.maxQueryLength).optional(),
);

const optionalCitySchema = z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(100).optional(),
);

export const searchUsersSchema = z.object({
    query: optionalSearchTextSchema,
    archetypes: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
    city: optionalCitySchema,
    radiusKm: z.coerce.number().min(1).max(500).optional(),
    page: z.coerce.number().int().min(1).max(USER_SEARCH_ABUSE_LIMITS.maxPage).default(1),
    pageSize: z.coerce.number().int().min(1).max(USER_SEARCH_ABUSE_LIMITS.maxPageSize).default(20),
}).superRefine((value, ctx) => {
    if (value.radiusKm != null && !value.city) {
        ctx.addIssue({
            code: "custom",
            message: 'radiusKm requires a city filter until geo-radius search is implemented.',
            path: ['radiusKm'],
        });
    }

    if (!hasUserSearchSignal(value) && value.page > USER_SEARCH_ABUSE_LIMITS.maxBroadSearchPage) {
        ctx.addIssue({
            code: "custom",
            message: 'Broad member browse is limited to the first page.',
            path: ['page'],
        });
    }
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type SearchUsersInput = z.infer<typeof searchUsersSchema>;
