import type {
  SignalDomain,
  SignalScale,
  SignalConfidence,
  SignalNovelty,
  SignalSourceType,
  PatternTrajectory,
  SignalResonance,
  IssueStatus,
  Visibility,
  VerificationLevel,
  ModerationStatus,
  PatternLibraryStatus,
} from '@/lib/prisma';
export type { ApiResponse } from '@/types/common';

export interface WeakSignal {
  id: string;
  title: string;
  description: string;
  context?: string | null;
  domain: SignalDomain;
  scale: SignalScale;
  confidence: SignalConfidence;
  novelty: SignalNovelty;
  regenerativeRelevance: number;
  sourceType: SignalSourceType;
  sourceUrl?: string | null;
  isLocalizable: boolean;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  tags: string[];
  status: IssueStatus;
  visibility: Visibility;
  verificationLevel: VerificationLevel;
  moderationStatus: ModerationStatus;
  createdById: string;
  communityId?: string | null;
  patternId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  resonanceCount?: number;
  corroborationCount?: number;
  resonatesCount?: number;
  doesntResonateCount?: number;
  createdBy?: {
    id: string;
    name: string;
    displayName: string | null;
    profilePhoto: string | null;
  };
  community?: {
    id: string;
    name: string;
  } | null;
  pattern?: {
    id: string;
    name: string;
  } | null;
  resonances?: SignalResonanceVoteWithUser[];
  corroborations?: SignalCorroborationWithUser[];
  projectLinks?: SignalProjectLink[];
  communityLinks?: SignalCommunityLink[];
}

export interface CreateWeakSignalInput {
  title: string;
  description: string;
  context?: string;
  domain: SignalDomain;
  scale?: SignalScale;
  confidence?: SignalConfidence;
  novelty?: SignalNovelty;
  regenerativeRelevance?: number;
  sourceType?: SignalSourceType;
  sourceUrl?: string;
  isLocalizable?: boolean;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  tags?: string[];
  communityId?: string;
  patternId?: string;
}

export interface UpdateWeakSignalInput extends Partial<CreateWeakSignalInput> {
  id: string;
}

export interface WeakSignalFilters {
  domain?: SignalDomain;
  scale?: SignalScale;
  confidence?: SignalConfidence;
  novelty?: SignalNovelty;
  status?: IssueStatus;
  patternId?: string;
  search?: string;
  sourceType?: SignalSourceType;
  verificationLevel?: VerificationLevel;
  hasLocation?: boolean;
  regenerativeRelevanceMin?: number;
  regenerativeRelevanceMax?: number;
  skip?: number;
  take?: number;
}

export interface WeakSignalPattern {
  id: string;
  name: string;
  description: string;
  trajectory: PatternTrajectory;
  hypothesis?: string | null;
  relatedRdgs: string[];
  status: PatternLibraryStatus;
  proposedById: string;
  createdAt: Date;
  updatedAt: Date;
  proposedBy?: {
    id: string;
    name: string;
    displayName: string | null;
    profilePhoto: string | null;
  };
  signalCount?: number;
}

export interface SignalResonanceVote {
  id: string;
  signalId: string;
  userId: string;
  vote: SignalResonance;
  note?: string | null;
  createdAt: Date;
}

export interface SignalResonanceVoteWithUser extends SignalResonanceVote {
  user: {
    id: string;
    name: string;
    displayName: string | null;
    profilePhoto: string | null;
  };
}

export interface SignalCorroboration {
  id: string;
  signalId: string;
  userId: string;
  evidence: string;
  sourceUrl?: string | null;
  createdAt: Date;
}

export interface SignalCorroborationWithUser extends SignalCorroboration {
  user: {
    id: string;
    name: string;
    displayName: string | null;
    profilePhoto: string | null;
  };
}

export interface SignalCollection {
  id: string;
  name: string;
  description?: string | null;
  isFeatured: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    name: string;
    displayName: string | null;
    profilePhoto: string | null;
  };
  signalCount?: number;
}

export interface SignalCollectionItem {
  id: string;
  collectionId: string;
  signalId: string;
  addedById: string;
  addedAt: Date;
  note?: string | null;
}

export interface SignalProjectLink {
  id: string;
  signalId: string;
  projectId: string;
  linkedById: string;
  createdAt: Date;
  note?: string | null;
  project?: {
    id: string;
    name: string;
  };
}

export interface SignalCommunityLink {
  id: string;
  signalId: string;
  communityId: string;
  linkedById: string;
  createdAt: Date;
  note?: string | null;
  community?: {
    id: string;
    name: string;
  };
}

export interface SignalCluster {
  id: string;
  domain: string;
  signalIds: string[];
  signals: WeakSignal[];
  sharedTags: string[];
  signalCount: number;
  tagOverlapAverage: number;
  noveltyBonus: number;
  score: number;
  averageConfidence: string;
}

export {
  SignalDomain,
  SignalScale,
  SignalConfidence,
  SignalNovelty,
  SignalSourceType,
  PatternTrajectory,
  SignalResonance,
  IssueStatus,
  Visibility,
  VerificationLevel,
  ModerationStatus,
  PatternLibraryStatus,
} from '@/lib/prisma';
