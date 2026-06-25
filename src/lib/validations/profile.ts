
import { z } from 'zod';
import { assertCanonicalRdgIds } from '@/lib/taxonomy';
import { isHttpUrl } from '@/lib/url-safety';

const httpUrlSchema = z.string().trim().url('Érvényes URL szükséges').refine(isHttpUrl, 'Csak HTTP vagy HTTPS URL engedélyezett');

const optionalHttpUrlSchema = z.union([z.literal(''), httpUrlSchema]).optional().nullable();
const maxPreNormalizationImageDataUrlLength = 10_900_000;
const fediverseSettingsSchema = z.object({
    consentVersion: z.number().nullable().optional(),
    publicProfile: z.object({
        showBio: z.boolean().optional(),
        showLocation: z.boolean().optional(),
        showWebsite: z.boolean().optional(),
        showSocialLinks: z.boolean().optional(),
        showAvatar: z.boolean().optional(),
        showCoverImage: z.boolean().optional(),
        showSkills: z.boolean().optional(),
        showOffers: z.boolean().optional(),
        showNeeds: z.boolean().optional(),
        showValues: z.boolean().optional(),
        showInterests: z.boolean().optional(),
        showRdgAreas: z.boolean().optional(),
        showCauses: z.boolean().optional(),
        showArchetypes: z.boolean().optional(),
        showChangemakerLevel: z.boolean().optional(),
        showIntentions: z.boolean().optional(),
        showBoundaries: z.boolean().optional(),
    }).optional(),
    activityPub: z.object({
        enabled: z.boolean().optional(),
        discoverable: z.boolean().optional(),
        exposeProfile: z.boolean().optional(),
        exposePublicPosts: z.boolean().optional(),
        showWebsiteInActor: z.boolean().optional(),
        showSocialLinksInActor: z.boolean().optional(),
        showLocationInActor: z.boolean().optional(),
    }).optional(),
    verification: z.object({
        relMeLinks: z.boolean().optional(),
    }).optional(),
}).optional().nullable();

export const updateFullProfileSchema = z.object({
    userId: z.string().optional(),
    displayName: z.string().min(2).max(50).optional(),
    bio: z.string().max(2000).optional(),
    location: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    isRemoteCapable: z.boolean().optional(),

    // Questionnaire
    enjoyDoing: z.string().optional(),
    currentIntention: z.string().optional(),
    collaborationPreference: z.array(z.string()).optional(),
    constraints: z.string().optional(),
    availabilityDetails: z.any().optional(),

    // Relations
    skills: z.array(z.string()).optional(),
    offers: z.array(z.string()).optional(),
    needs: z.array(z.string()).optional(),
    values: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
    mainCauses: z.array(z.string()).optional(),
    interestedCauses: z.array(z.string()).optional(),

    website: optionalHttpUrlSchema,
    socialLinks: z.object({
        linkedin:  optionalHttpUrlSchema,
        twitter:   optionalHttpUrlSchema,
        facebook:  optionalHttpUrlSchema,
        instagram: optionalHttpUrlSchema,
        youtube:   optionalHttpUrlSchema,
        github:    optionalHttpUrlSchema,
        mastodon:  optionalHttpUrlSchema,
        diaspora:  optionalHttpUrlSchema,
        pixelfed:  optionalHttpUrlSchema,
        substack:  optionalHttpUrlSchema,
        telegram:  optionalHttpUrlSchema,
    }).optional().nullable(),
    federationSettings: fediverseSettingsSchema,
    archetypes: z.array(z.string()).optional(),
    rdgAreas: z.array(z.string()).optional().transform((values): string[] | undefined => values ? assertCanonicalRdgIds(values) : values),
    changemakeLevel: z.string().optional(),
    profileVisibility: z.string().optional(),

    profilePhoto: z.union([
        z.url('Érvényes URL szükséges').refine(url => url.startsWith('https://'), 'Csak HTTPS URL engedélyezett'),
        z.string()
            .refine(val => /^data:image\/(jpeg|jpg|png|gif|webp);base64,/.test(val), 'Csak JPEG, PNG, GIF vagy WebP formátum engedélyezett')
            .refine(val => val.length <= maxPreNormalizationImageDataUrlLength, 'A kép bemeneti mérete legfeljebb 8 MB lehet'),
        z.literal(''),
    ]).optional(),
    coverImage: z.union([
        z.url('Érvényes URL szükséges').refine(url => url.startsWith('https://'), 'Csak HTTPS URL engedélyezett'),
        z.string()
            .refine(val => /^data:image\/(jpeg|jpg|png|gif|webp);base64,/.test(val), 'Csak JPEG, PNG, GIF vagy WebP formátum engedélyezett')
            .refine(val => val.length <= maxPreNormalizationImageDataUrlLength, 'A kép bemeneti mérete legfeljebb 8 MB lehet'),
        z.literal(''),
    ]).optional(),

    // Community identity
    mainCommunity: z.string().optional(),
    
    // Intentions & Boundaries
    seekingLocalEcoCommunity: z.boolean().optional(),
    seekingIntentionalCommunity: z.boolean().optional(),
    highStakesProjectHelp: z.boolean().optional(),
    strictNoRomance: z.boolean().optional(),
});

export type UpdateFullProfileInput = z.infer<typeof updateFullProfileSchema>;
