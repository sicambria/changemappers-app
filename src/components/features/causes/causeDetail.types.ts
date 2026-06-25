// Types for CauseDetailClient — extracted for reuse without pulling in 'use client'

export interface CauseDetailUser {
    id: string;
    name: string;
    profilePhoto: string | null;
    city?: string | null;
}

export interface CauseCommunity {
    id: string;
    name: string;
    coverImage: string | null;
    city: string | null;
}

export interface CauseEvent {
    id: string;
    title: string;
    startDate: string;
    location: string | null;
    isOnline: boolean;
}

export interface RelatedCause {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    websites: string | null;
}

export interface CauseDetailData {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    coverImage: string | null;
    websites: string | null;
    problems: string | null;
    solutions: string | null;
    mainCauseUsers: CauseDetailUser[];
    interestedUsers: CauseDetailUser[];
    supportingCommunities: CauseCommunity[];
    events: CauseEvent[];
    managers: { id: string; name: string }[];
}

export interface CauseDetailClientProps {
    cause: CauseDetailData;
    parentRdg: RelatedCause | null;
    relatedSubCauses: RelatedCause[];
    relatedTopics: RelatedCause[];
    domainNum: number;
    rdgNum: number;
    refs: string[];
    externalLinks: string[];
    causeIsRdg: boolean;
    causeIsSubCause: boolean;
    causeIsTopic: boolean;
    displayTitle: string;
    rdgExplorerUrl: string | null;
    initialIsJoined: boolean;
}
