// Shared community action contracts: response shapes and input schemas.
import { z } from 'zod';
import { CommunityRole } from '@/lib/prisma';

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

export interface Community {
    id: string;
    name: string;
    slug: string;
    description?: string;
    type: string;
    foundingYear?: number;
    country?: string;
    region?: string;
    city?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    memberCountRange?: string;
    acceptingNewMembers: boolean;
    membershipConditions?: string;
    membershipCost?: string;
    governanceType?: string;
    joiningProcess?: string;
    targetMemberDescription?: string;
    website?: string;
    contactEmail?: string;
    contactPhone?: string;
    seekingVolunteers: boolean;
    volunteerDescription?: string;
    photoGallery: string[];
    values: string[];
    volunteerCapabilities: string[];
    focusAreas: string[];
    facilities: string[];
    verificationLevel: string;
    visibility: string;
    searchable: boolean;
    vision?: string;
    principles?: string;
    houseRules?: string;
    annualGoals?: string;
    moderationStatus: string;
    coverImage?: string;
    createdAt: Date;
    updatedAt: Date;
    ownerId: string;
    memberCount?: number;

}

export interface CommunityDirectoryItem {
    id: string;
    name: string;
    description: string | null;
    type: string;
    city: string | null;
    country: string | null;
    memberCount: number;
    appreciateCount: number;
    isAcceptingMembers: boolean;
}

export interface CommunitySearchResult {

    id: string;
    name: string;
    slug: string;
    type: string;
    city?: string;
    country?: string;
    memberCountRange?: string; // Derived?
    acceptingNewMembers: boolean;
    photoUrl?: string; // coverImage
}

export const communityStringArraySchema = z.array(z.string().trim().min(1).max(120)).max(30);
export const communityShortTextSchema = z.string().trim().max(100).optional();

// Validation schemas (retained)
export const createCommunitySchema = z.object({
    name: z.string().min(3, 'community.validation.nameMin').max(100),
    description: z.string().max(5000).optional(),
    type: z.enum([
        'NATURE_CONNECTED_ECO_HUB', 'HEALING_SANCTUARY', 'INCLUSIVE_SUPPORT_NETWORK',
        'CREATIVE_ARTS_COLONY', 'EGALITARIAN_LIVING', 'SPIRITUAL_HAVEN',
        'KNOWLEDGE_HUB', 'NOMADIC_NETWORK', 'REGENERATIVE_ECONOMIC',
        'VISIONARY_MODEL_CITY', 'EARTH_REGENERATION_CENTER', 'FRONTLINE_ACTIVIST'
    ]),
  city: communityShortTextSchema,
  country: communityShortTextSchema,
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  foundingYear: z.preprocess(
        (value) => value === '' || value == null ? undefined : value,
        z.coerce.number().min(1900).max(new Date().getFullYear()).optional()
    ),
    website: z.url().optional().or(z.literal('')),
    contactEmail: z.email().optional().or(z.literal('')),
    contactPhone: z.string().trim().max(50).optional(),

    // Values
    values: communityStringArraySchema.optional(),

    // Membership
    acceptingNewMembers: z.boolean().default(true),
    targetMemberDescription: z.string().max(1000).optional(),
    membershipCost: z.string().max(500).optional(),
    joiningProcess: z.string().max(2000).optional(),

    // Volunteers
    seekingVolunteers: z.boolean().default(false),
    volunteerDescription: z.string().max(2000).optional(),
    volunteerCapabilities: communityStringArraySchema.optional(),

    // Optional deep info
    vision: z.string().max(2000).optional(),
    principles: z.string().max(2000).optional(),
    houseRules: z.string().max(2000).optional(),
    annualGoals: z.string().max(2000).optional(),

    coverImage: z.string().max(200_000).optional(),
});

export const searchCommunitiesSchema = z.object({
    query: z.string().trim().max(200).optional(),
    type: z.string().trim().max(80).optional(),
    city: z.string().trim().max(100).optional(),
    country: communityShortTextSchema,
    acceptingNewMembers: z.boolean().optional(),
    causeId: z.string().trim().max(80).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

/**
 * Get community by ID.
 */

export const updateCommunityMemberRoleSchema = z.object({
  communityId: z.string().trim().min(1),
  targetUserId: z.string().trim().min(1),
  role: z.enum(CommunityRole),
});
