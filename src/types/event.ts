// Event-related type definitions

export enum EventType {
    WORKSHOP = 'WORKSHOP',
    OPEN_DAY = 'OPEN_DAY',
    TRAINING = 'TRAINING',
    CELEBRATION = 'CELEBRATION',
    MEETING = 'MEETING',
    RETREAT = 'RETREAT',
    VOLUNTEER = 'VOLUNTEER',
    OTHER = 'OTHER',
}

export enum EventCategory {
    SUSTAINABILITY = 'SUSTAINABILITY',
    PERMACULTURE = 'PERMACULTURE',
    COMMUNITY_BUILDING = 'COMMUNITY_BUILDING',
    EDUCATION = 'EDUCATION',
    HEALTH = 'HEALTH',
    ARTS = 'ARTS',
    TECHNOLOGY = 'TECHNOLOGY',
    GOVERNANCE = 'GOVERNANCE',
    OTHER = 'OTHER',
}

export enum RegistrationType {
    AUTO_APPROVE = 'AUTO_APPROVE',
    MANUAL_APPROVE = 'MANUAL_APPROVE',
    INVITE_ONLY = 'INVITE_ONLY',
}

export enum CostType {
    FREE = 'FREE',
    DONATION = 'DONATION',
    FIXED = 'FIXED',
    SLIDING_SCALE = 'SLIDING_SCALE',
}

export enum EventStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
}

export enum RsvpStatus {
    INTERESTED = 'INTERESTED',
    GOING = 'GOING',
    NOT_GOING = 'NOT_GOING',
    WAITLIST = 'WAITLIST',
}

export interface Event {
    id: string;
    title: string;
    description?: string;
    coverImageUrl?: string;

    // Date/Time
    startDateTime: Date;
    endDateTime?: Date;
    timezone: string;

    // Location
    location?: string;
    latitude?: number;
    longitude?: number;
    isOnline: boolean;
    onlineLink?: string;

    // Details
    type: EventType;
    category?: EventCategory;
    tags: string[];
    language: string;

    // Capacity
    capacity?: number;
    registrationType: RegistrationType;

    // Cost
    costType: CostType;
    costAmount?: string;
    costCurrency?: string;

    // Status
    status: EventStatus;
    createdAt: Date;
    updatedAt: Date;

    // Recurring
    isRecurring: boolean;
    recurringRule?: string;
    recurringSeriesId?: string;

    // External
    facebookEventUrl?: string;
    icsUid?: string;

    // Relations
    hostUserId?: string;
    hostCommunityId?: string;
}

export interface EventCard extends Pick<Event,
    'id' | 'title' | 'startDateTime' | 'location' | 'type' | 'isOnline'
> {
    coverImageUrl?: string;
    hostName?: string;
    attendeeCount?: number;
}

export interface EventRsvp {
    id: string;
    eventId: string;
    userId: string;
    status: RsvpStatus;
    createdAt: Date;
    updatedAt: Date;
}
