import { z } from 'zod';
import { assertCanonicalRdgIds } from '@/lib/taxonomy';
import { isHttpUrl } from '@/lib/url-safety';

// ──────────────────────────────────────────────
// Onboarding stage validation schemas
// ──────────────────────────────────────────────

export const stage2_5Schema = z.object({
    q2_focus: z.string().nullable().optional(),
    q3_activity: z.number().nullable().optional(),
    q4_project: z.string().nullable().optional(),
    q5_systemic: z.number().nullable().optional(),
    seekingLocalEcoCommunity: z.boolean().optional(),
    seekingIntentionalCommunity: z.boolean().optional(),
    highStakesProjectHelp: z.boolean().optional(),
    strictNoRomance: z.boolean().optional(),
});

export const locationPrecisionSchema = z.enum(['COUNTRY', 'CITY', 'EXACT']);

export const stage3Schema = z.object({
  tagline: z.string().min(5, 'onboarding.validation.taglineMin').max(120),
  bio: z.string().min(10, 'onboarding.validation.bioMin').max(2000),
  website: z.url().refine((value) => isHttpUrl(value), 'Only HTTP or HTTPS URLs are allowed').optional().or(z.literal('')),
  city: z.string().optional(),
  country: z.string().min(1, 'onboarding.errors.countryRequired'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationPrecision: locationPrecisionSchema.default('COUNTRY'),
  locationVisibility: z.enum(['PUBLIC', 'REGISTERED', 'CONNECTIONS']).optional(),
  contactEmail: z.email().optional().or(z.literal('')),
  socialLinkedIn: z.string().optional(),
  socialTwitter: z.string().optional(),
  socialSubstack: z.string().optional(),
  socialOther: z.string().optional(),
  isRemoteCapable: z.boolean().default(false),
  profilePhoto: z.string().optional(),
  organizationName: z.string().optional(),
  organizationDescription: z.string().optional(),
  communityId: z.string().optional(),
  newCommunityName: z.string().optional(),
}).superRefine((data, ctx) => {
  if ((data.locationPrecision === 'CITY' || data.locationPrecision === 'EXACT') && (data.latitude == null || data.longitude == null)) {
    ctx.addIssue({
      code: "custom",
      path: ['locationPrecision'],
      message: data.locationPrecision === 'CITY'
        ? 'onboarding.validation.cityCoordinatesRequired'
        : 'onboarding.validation.exactCoordinatesRequired',
    });
  }
});

export const stage4Schema = z.object({
    skills: z.array(z.string()).optional(),    // [MATCHING + PROFILE]
    learning: z.array(z.string()).optional(),  // [MATCHING + PROFILE] — treated as peer-matching
    // BASE archetypes are mandatory (user must select at least 1 role)
    baseArchetypes: z.array(z.string()).min(1, 'onboarding.validation.baseArchetypesRequired'),
    protectionNeeds: z.array(z.string()).optional(), // [MATCHING]
    mainCauses: z.array(z.string()).optional(),
    interestedCauses: z.array(z.string()).optional(),
});

export const stage4_5Schema = z.object({
    roles: z.array(z.string()).optional(),
    internalExternal: z.number().min(1).max(10).optional(),
    secularSpiritual: z.number().min(1).max(10).optional(),
    decisionMaking: z.enum(['hierarchical', 'sociocratic', 'consensus']).optional().nullable(),
    resourceSharing: z.enum(['SHARED_TREASURY', 'CONTRIBUTION', 'PRIVATE']).optional().nullable(),
    comfortLevel: z.number().min(1).max(10).optional(),
    socialIntimacy: z.enum(['RADICAL_TRANSPARENCY', 'CAMARADERIE', 'PROFESSIONAL']).optional().nullable(),
    communityPresence: z.array(z.string()).optional(),
    communitySize: z.enum(['SIZE_5_15', 'SIZE_15_50', 'SIZE_50_200', 'SIZE_200_PLUS', 'ANY']).optional().nullable(),
});

export const stage5Schema = z.object({
    contributionSeedType: z.enum(['QUESTION', 'PERSPECTIVE', 'SKILL', 'LOCAL_PATTERN', 'RESOURCE', 'OFFER']).optional(),
    contributionSeedText: z.string().trim().min(10).max(300).optional(),
    // 5A — work context [MATCHING]
    workContextLastEffort: z.string().max(1000).optional(),
    workContextOutsideRole: z.string().max(1000).optional(),
    workContextScale: z.enum(['COMMUNITY', 'SECTOR', 'CROSS_SECTOR', 'MULTI_SCALE']).optional(),
    // 5B — energy mapping [MATCHING + LONGITUDINAL]
    energisingFunctions: z.array(z.string()),
    drainingFunctions: z.array(z.string()),
    // 5C — availability mode [PROFILE + MATCHING]
    availabilityMode: z.enum(['DELIVERING', 'BETWEEN', 'BUILDING', 'REFLECTING', 'RESTING']),
    // 5D — current offer sentence [PROFILE]
    currentOffer: z.string().max(200).optional(),
    // 5.5 — RDG Domains and Goals
    rdgMain: z.array(z.string()).optional().transform((values): string[] | undefined => values ? assertCanonicalRdgIds(values) : values),
    rdgInterested: z.array(z.string()).optional().transform((values): string[] | undefined => values ? assertCanonicalRdgIds(values) : values),
    rdgProject: z.string().max(2000).optional(),
    rdgPartnership: z.string().optional(),
    existentialRisks: z.array(z.string()).optional(),
});

export const stage6Schema = z.object({
    // 6A — scenario responses [MATCHING]
    scenarioResponses: z.record(z.string(), z.string()).optional(),
    scenarioReflection: z.string().max(500).optional(), // [PRIVATE] — not used for matching
    // 6B — avoided functions [MATCHING]
    avoidedFunctions: z.array(z.string()).optional(),
    avoidanceReflection: z.string().max(500).optional(), // [PRIVATE]
    // 6C — current project [MATCHING + PROFILE]
    currentProjectDescription: z.string().max(1000).optional(),
    // 6D — what moment needs [MATCHING]
    momentNeeds: z.array(z.string()).optional(),
    // 6.5 — Activities
    currentActivities: z.array(z.string()).optional(),
    desiredActivities: z.array(z.string()).optional(),
    developedSkills: z.array(z.string()).optional(),
    systemicExperience: z.string().optional(),
    systemicActivities: z.array(z.string()).optional(),
    existentialActivities: z.string().optional(),
});

export const stage2Schema = z.object({
    charter_accepted: z.boolean().refine(val => val === true),
    pledge_contributor: z.boolean().refine(val => val === true),
    pledge_difference: z.boolean().refine(val => val === true),
    pledge_friction: z.boolean().refine(val => val === true),
    pledge_share: z.boolean().refine(val => val === true),
    pledge_notice: z.boolean().refine(val => val === true),
    pledge_accountability: z.boolean().refine(val => val === true),
});
