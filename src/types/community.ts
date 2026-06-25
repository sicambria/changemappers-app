// Community-related type definitions

// Must stay in sync with the CommunityType enum in prisma/schema.prisma
export enum CommunityType {
    NATURE_CONNECTED_ECO_HUB = 'NATURE_CONNECTED_ECO_HUB',
    HEALING_SANCTUARY = 'HEALING_SANCTUARY',
    INCLUSIVE_SUPPORT_NETWORK = 'INCLUSIVE_SUPPORT_NETWORK',
    CREATIVE_ARTS_COLONY = 'CREATIVE_ARTS_COLONY',
    EGALITARIAN_LIVING = 'EGALITARIAN_LIVING',
    SPIRITUAL_HAVEN = 'SPIRITUAL_HAVEN',
    KNOWLEDGE_HUB = 'KNOWLEDGE_HUB',
    NOMADIC_NETWORK = 'NOMADIC_NETWORK',
    REGENERATIVE_ECONOMIC = 'REGENERATIVE_ECONOMIC',
    VISIONARY_MODEL_CITY = 'VISIONARY_MODEL_CITY',
    EARTH_REGENERATION_CENTER = 'EARTH_REGENERATION_CENTER',
    FRONTLINE_ACTIVIST = 'FRONTLINE_ACTIVIST',
    OTHER = 'OTHER',
}

export enum GovernanceType {
    SOCIOCRATIC = 'SOCIOCRATIC',
    CONSENSUS = 'CONSENSUS',
    DEMOCRATIC = 'DEMOCRATIC',
    HIERARCHICAL = 'HIERARCHICAL',
    HOLACRATIC = 'HOLACRATIC',
    OTHER = 'OTHER',
}

export interface Community {
    id: string;
    name: string;
    slug: string;
    description?: string;
    type: CommunityType;
    foundingYear?: number;

    // Location
    country?: string;
    region?: string;
    city?: string;
    address?: string;
    latitude?: number;
    longitude?: number;

    // Membership
    memberCountRange?: string;
    acceptingNewMembers: boolean;
    membershipConditions?: string;

    // Governance
    governanceType?: GovernanceType;
    decisionMakingProcess?: string;

    // Details
    website?: string;
    socialLinks?: Record<string, string>;
    photoGallery: string[];
    values: string[];
    focusAreas: string[];
    facilities: string[];

    // Status
    verificationLevel: string;
    visibility: string;
    karmaScore: number;
    lastActive: Date;
    createdAt: Date;
    updatedAt: Date;

    // Relations
    ownerId: string;
}

export interface CommunitySearchResult extends Pick<Community,
    'id' | 'name' | 'slug' | 'type' | 'city' | 'country' | 'memberCountRange' | 'acceptingNewMembers'
> {
    photoUrl?: string;
}

export interface CommunityCard extends Pick<Community,
    'id' | 'name' | 'type' | 'city' | 'description' | 'memberCountRange'
> {
    photoUrl?: string;
    memberCount?: number;
}
