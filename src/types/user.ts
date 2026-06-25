// User-related type definitions

export enum Archetype {
    LOCAL_PRACTITIONER = 'LOCAL_PRACTITIONER',
    NETWORK_WEAVER = 'NETWORK_WEAVER',
    INSTITUTIONAL_CHANGEMAKER = 'INSTITUTIONAL_CHANGEMAKER',
    GLOBAL_AMPLIFIER = 'GLOBAL_AMPLIFIER',
    RESOURCE_MOBILIZER = 'RESOURCE_MOBILIZER',
    INNOVATION_CATALYST = 'INNOVATION_CATALYST',
    SYSTEM_DISRUPTOR = 'SYSTEM_DISRUPTOR',
    STRATEGIC_ADVISOR = 'STRATEGIC_ADVISOR',
}



export enum VerificationLevel {
    SELF_DECLARED = 'SELF_DECLARED',
    PEER_VOUCHED = 'PEER_VOUCHED',
    COMMUNITY_VERIFIED = 'COMMUNITY_VERIFIED',
    ADMIN_VERIFIED = 'ADMIN_VERIFIED',
}

export enum Visibility {
    PUBLIC = 'PUBLIC',
    REGISTERED_USERS = 'REGISTERED_USERS',
    CONNECTIONS_ONLY = 'CONNECTIONS_ONLY',
    PRIVATE = 'PRIVATE',
}

export enum ProfileStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
}

export enum LocationPrecision {
    EXACT = 'EXACT',
    CITY = 'CITY',
    REGION = 'REGION',
    COUNTRY = 'COUNTRY',
}

export enum Availability {
    FULL_TIME = 'FULL_TIME',
    PART_TIME = 'PART_TIME',
    OCCASIONALLY = 'OCCASIONALLY',
    NOT_AVAILABLE = 'NOT_AVAILABLE',
}

export interface User {
    id: string;
    email: string;
    name: string;
    displayName?: string;
    pronouns?: string;
    ageRange?: string;
    languages: string[];
    bio?: string;
    profilePhoto?: string;

    // Location
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    locationPrecision: LocationPrecision;

    // Changemaker Identity
    archetypes?: Archetype[];


    // Attributes
    values: string[];
    interests: string[];
    skillsOffered: string[];
    supportNeeded: string[];
    concreteExperiences?: string;

    // Seeking
    connectionSeeking: boolean;
    romanticOpenness: boolean;
    availability: Availability;

    // Scores & Verification
    profileCompleteness: number;
    verificationLevel: VerificationLevel;
    karmaScore: number;

    // Status
    profileStatus: ProfileStatus;
    isEmailVerified: boolean;
    lastActive: Date;
    createdAt: Date;
    updatedAt: Date;

    // Privacy
    visibility: Visibility;
    privacySettings?: Record<string, unknown>;

    // Invitation System
    invitedByUserId?: string;
    invitationCode?: string;
    adminApproved?: boolean;
}

export type UserProfile = Pick<User,
    'id' | 'name' | 'displayName' | 'profilePhoto' | 'archetypes' |
    'bio' | 'city' | 'country' | 'verificationLevel'
>;

export interface UserSearchResult extends Pick<User,
    'id' | 'displayName' | 'profilePhoto' | 'archetypes' | 'city'
> {
    matchScore?: number;
}
