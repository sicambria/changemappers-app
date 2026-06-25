import type { SocialIssueCategory, IssueScope, IssueSeverity, IssueStatus, Visibility, VerificationLevel } from '@/lib/prisma';

export interface SocialIssue {
  id: string;
  title: string;
  description?: string | null;
  category: SocialIssueCategory;
  isLocalizable: boolean;
  latitude?: number | null;
  longitude?: number | null;
  locationName?: string | null;
  scope?: IssueScope | null;
  severity: IssueSeverity;
  sources: string[];
  relatedRdgs: string[];
  tags: string[];
  leanWastes: string[];
  createdById: string;
  communityId?: string | null;
  status: IssueStatus;
  visibility: Visibility;
  verificationLevel: VerificationLevel;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  vouchCount?: number;
  disputeCount?: number;
}

export interface CreateSocialIssueInput {
  title: string;
  description?: string;
  category: SocialIssueCategory;
  isLocalizable: boolean;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  scope?: IssueScope;
  severity: IssueSeverity;
  sources?: string[];
  relatedRdgs?: string[];
  tags?: string[];
  leanWastes?: string[];
  communityId?: string;
}

export interface SocialIssueFilters {
  category?: SocialIssueCategory;
  severity?: IssueSeverity;
  scope?: IssueScope;
  status?: IssueStatus;
  isLocalizable?: boolean;
  search?: string;
}

export { SocialIssueCategory, IssueScope, IssueSeverity, IssueStatus } from '@/lib/prisma';
