'use server';

import { logActionError } from '@/lib/action-logger';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/app/actions/auth';
import { canModerateContent } from '@/lib/permissions';
import type { SocialIssue, CreateSocialIssueInput, SocialIssueFilters } from '@/types/social-issue';
import type { SocialIssueCategory, IssueScope, IssueSeverity, VerificationLevel } from '@/lib/prisma';
import { assertCanonicalRdgIds } from '@/lib/taxonomy';

import type { ApiResponse } from '@/types/common';

const createIssueSchema = z.object({
	title: z.string().min(3, 'Title must be at least 3 characters').max(200),
	description: z.string().max(5000).optional(),
	category: z.enum(['ENVIRONMENTAL', 'GOVERNANCE', 'MEDIA', 'EDUCATION', 'ECONOMIC', 'SOCIAL', 'INFRASTRUCTURE', 'HEALTH', 'OTHER']),
	isLocalizable: z.boolean().default(true),
	latitude: z.number().optional(),
	longitude: z.number().optional(),
	locationName: z.string().max(200).optional(),
	scope: z.enum(['LOCAL', 'BIOREGIONAL', 'NATIONAL', 'GLOBAL', 'SYSTEMIC']).optional(),
	severity: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).default('MODERATE'),
	sources: z.array(z.url()).max(10).optional(),
	relatedRdgs: z.array(z.string()).min(1, 'At least one RDG must be selected').max(10).transform((values): string[] => assertCanonicalRdgIds(values)),
	tags: z.array(z.string()).max(20).optional(),
	leanWastes: z.array(z.string()).max(60).optional(),
	communityId: z.string().optional(),
});

export async function createSocialIssue(data: CreateSocialIssueInput): Promise<ApiResponse<SocialIssue>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const validated = createIssueSchema.parse(data);

    if (validated.isLocalizable && (!validated.latitude || !validated.longitude)) {
      return { success: false, error: 'Location coordinates required for localizable issues' };
    }

    const issue = await prisma.socialIssue.create({
      data: {
        title: validated.title,
        description: validated.description,
        category: validated.category as SocialIssueCategory,
        isLocalizable: validated.isLocalizable,
        latitude: validated.latitude,
        longitude: validated.longitude,
        locationName: validated.locationName,
        scope: validated.scope as IssueScope,
        severity: validated.severity as IssueSeverity,
        sources: validated.sources || [],
        relatedRdgs: validated.relatedRdgs || [],
        tags: validated.tags || [],
        leanWastes: validated.leanWastes || [],
        createdById: currentUser.data.user.id,
        communityId: validated.communityId,
        status: 'PUBLISHED',
        visibility: 'PUBLIC',
        verificationLevel: 'SELF_DECLARED',
      },
      include: {
        _count: { select: { vouches: true, disputes: true } },
      },
    });

    revalidatePath('/map');
    revalidatePath('/social-issues');

    return {
      success: true,
      data: {
        ...issue,
        vouchCount: issue._count.vouches,
        disputeCount: issue._count.disputes,
      } as SocialIssue,
    };
  } catch (error) {
    logActionError('Error creating social issue', error);
    return { success: false, error: 'Failed to create issue' };
  }
}

export async function getSocialIssues(filters?: SocialIssueFilters): Promise<ApiResponse<SocialIssue[]>> {
  try {
    const where: Record<string, unknown> = {
      deletedAt: null,
      status: { not: 'ARCHIVED' },
    };

    if (filters?.category) where.category = filters.category;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.scope) where.scope = filters.scope;
    if (filters?.status) where.status = filters.status;
    if (filters?.isLocalizable !== undefined) where.isLocalizable = filters.isLocalizable;

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search } },
      ];
    }

  const issues = await prisma.socialIssue.findMany({
  where,
  orderBy: { createdAt: 'desc' },
  include: {
    _count: { select: { vouches: true, disputes: true } },
    createdBy: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
  },
  take: 100,
});

    return {
      success: true,
      data: issues.map((i) => ({
        ...i,
        vouchCount: i._count.vouches,
        disputeCount: i._count.disputes,
      })) as SocialIssue[],
    };
  } catch (error) {
    logActionError('Error fetching social issues', error);
    return { success: false, error: 'Failed to fetch issues' };
  }
}

export async function getSocialIssueById(id: string): Promise<ApiResponse<SocialIssue>> {
  try {
    const issue = await prisma.socialIssue.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        isLocalizable: true,
        latitude: true,
        longitude: true,
        locationName: true,
        scope: true,
        severity: true,
        sources: true,
        relatedRdgs: true,
        tags: true,
        leanWastes: true,
        createdById: true,
        communityId: true,
        status: true,
        visibility: true,
        verificationLevel: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        _count: { select: { vouches: true, disputes: true } },
        createdBy: { select: { id: true, name: true, displayName: true, profilePhoto: true } },
        community: { select: { id: true, name: true } },
        vouches: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true, displayName: true, profilePhoto: true } } },
        },
      },
    });

    if (!issue) {
      return { success: false, error: 'Issue not found' };
    }

    return {
      success: true,
      data: {
        ...issue,
        vouchCount: issue._count.vouches,
        disputeCount: issue._count.disputes,
      } as SocialIssue,
    };
  } catch (error) {
    logActionError('Error fetching social issue', error);
    return { success: false, error: 'Failed to fetch issue' };
  }
}

export async function getLocalizableIssues(): Promise<ApiResponse<SocialIssue[]>> {
  return getSocialIssues({ isLocalizable: true, status: 'PUBLISHED' });
}

export async function getSystemicIssues(): Promise<ApiResponse<SocialIssue[]>> {
  return getSocialIssues({ isLocalizable: false });
}

export async function vouchForIssue(issueId: string): Promise<ApiResponse<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const userId = currentUser.data.user.id;

  const existingVouch = await prisma.issueVouch.findUnique({
    where: { issueId_userId: { issueId, userId } },
    select: { id: true },
  });

    if (existingVouch) {
      return { success: false, error: 'Already vouched for this issue' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.issueVouch.create({
        data: { issueId, userId },
      });

      const vouchCount = await tx.issueVouch.count({ where: { issueId } });

      let newVerificationLevel: VerificationLevel = 'SELF_DECLARED';
      if (vouchCount >= 10) newVerificationLevel = 'COMMUNITY_VERIFIED';
      else if (vouchCount >= 3) newVerificationLevel = 'PEER_VOUCHED';

      if (newVerificationLevel !== 'SELF_DECLARED') {
        await tx.socialIssue.update({
          where: { id: issueId },
          data: { verificationLevel: newVerificationLevel },
        });
      }
    });

    revalidatePath('/map');
    revalidatePath(`/social-issues/${issueId}`);

    return { success: true, data: undefined };
  } catch (error) {
    logActionError('Error vouching for issue', error);
    return { success: false, error: 'Failed to vouch for issue' };
  }
}

export async function disputeIssue(issueId: string, reason: string): Promise<ApiResponse<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const userId = currentUser.data.user.id;

    if (!reason || reason.trim().length < 10) {
      return { success: false, error: 'Reason must be at least 10 characters' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.issueDispute.create({
        data: { issueId, userId, reason: reason.trim() },
      });

      await tx.socialIssue.update({
        where: { id: issueId },
        data: { status: 'DISPUTED' },
      });
    });

    revalidatePath('/map');
    revalidatePath(`/social-issues/${issueId}`);

    return { success: true, data: undefined };
  } catch (error) {
    logActionError('Error disputing issue', error);
    return { success: false, error: 'Failed to dispute issue' };
  }
}

const updateIssueSchema = z.object({
	title: z.string().min(3, 'Title must be at least 3 characters').max(200),
	description: z.string().max(5000).optional(),
	category: z.enum(['ENVIRONMENTAL', 'GOVERNANCE', 'MEDIA', 'EDUCATION', 'ECONOMIC', 'SOCIAL', 'INFRASTRUCTURE', 'HEALTH', 'OTHER']),
	isLocalizable: z.boolean().default(true),
	latitude: z.number().optional(),
	longitude: z.number().optional(),
	locationName: z.string().max(200).optional(),
	scope: z.enum(['LOCAL', 'BIOREGIONAL', 'NATIONAL', 'GLOBAL', 'SYSTEMIC']).optional(),
	severity: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).default('MODERATE'),
	sources: z.array(z.url()).max(10).optional(),
	relatedRdgs: z.array(z.string()).min(1, 'At least one RDG must be selected').max(10).transform((values): string[] => assertCanonicalRdgIds(values)),
	tags: z.array(z.string()).max(20).optional(),
	leanWastes: z.array(z.string()).max(60).optional(),
});

export async function updateSocialIssue(id: string, data: CreateSocialIssueInput): Promise<ApiResponse<SocialIssue>> {
	try {
		const currentUser = await getCurrentUser();
		if (!currentUser.success || !currentUser.data) {
			return { success: false, error: 'Unauthorized' };
		}

		const existing = await prisma.socialIssue.findUnique({
			where: { id },
			select: { createdById: true, deletedAt: true },
		});

		if (!existing || existing.deletedAt) {
			return { success: false, error: 'Issue not found' };
		}

		if (existing.createdById !== currentUser.data.user.id && !canModerateContent(currentUser.data.user)) {
			return { success: false, error: 'Not authorized to edit this issue' };
		}

		const validated = updateIssueSchema.parse(data);

		if (validated.isLocalizable && (!validated.latitude || !validated.longitude)) {
			return { success: false, error: 'Location coordinates required for localizable issues' };
		}

		const issue = await prisma.socialIssue.update({
			where: { id },
			data: {
				title: validated.title,
				description: validated.description,
				category: validated.category as SocialIssueCategory,
				isLocalizable: validated.isLocalizable,
				latitude: validated.latitude,
				longitude: validated.longitude,
				locationName: validated.locationName,
				scope: validated.scope as IssueScope,
				severity: validated.severity as IssueSeverity,
				sources: validated.sources || [],
				relatedRdgs: validated.relatedRdgs || [],
				tags: validated.tags || [],
				leanWastes: validated.leanWastes || [],
			},
			include: {
				_count: { select: { vouches: true, disputes: true } },
			},
		});

		revalidatePath('/map');
		revalidatePath('/social-issues');
		revalidatePath(`/social-issues/${id}`);

		return {
			success: true,
			data: {
				...issue,
				vouchCount: issue._count.vouches,
				disputeCount: issue._count.disputes,
			} as SocialIssue,
		};
	} catch (error) {
		logActionError('Error updating social issue', error);
		return { success: false, error: 'Failed to update issue' };
	}
}

export async function deleteSocialIssue(id: string): Promise<ApiResponse<void>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: 'Unauthorized' };
    }

    const issue = await prisma.socialIssue.findUnique({
      where: { id },
      select: { createdById: true },
    });

    if (!issue) {
      return { success: false, error: 'Issue not found' };
    }

    if (issue.createdById !== currentUser.data.user.id && !canModerateContent(currentUser.data.user)) {
      return { success: false, error: 'Not authorized to delete this issue' };
    }

    await prisma.socialIssue.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    revalidatePath('/map');
    revalidatePath('/social-issues');

    return { success: true, data: undefined };
  } catch (error) {
    logActionError('Error deleting social issue', error);
    return { success: false, error: 'Failed to delete issue' };
  }
}
