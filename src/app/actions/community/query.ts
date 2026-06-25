'use server';

// Community read/query actions.
import { logActionError } from '@/lib/action-logger';
import { localizeActionMessage } from '@/lib/action-result-i18n';
import { z } from 'zod';
import prisma, { CommunityRole, Visibility } from '@/lib/prisma';
import { getCurrentUser } from '@/app/actions/auth';
import type { ApiResponse } from '@/types/common';
import { searchCommunitiesSchema, type PaginatedResponse, type Community, type CommunityDirectoryItem, type CommunitySearchResult } from '@/lib/community-contracts';

/**
 * Get community by ID.
 */
export async function getCommunityAction(
    communityId: string
): Promise<ApiResponse<Community>> {
    try {
        if (!communityId) {
            return { success: false, error: await localizeActionMessage('community.idRequired') };
        }

const community = await prisma.community.findUnique({
		where: { id: communityId },
		select: {
			id: true,
			name: true,
			description: true,
			type: true,
			foundingYear: true,
			country: true,
			region: true,
			city: true,
			address: true,
			latitude: true,
			longitude: true,
			acceptingMembers: true,
			joiningConditions: true,
			joiningProcess: true,
			targetMemberDescription: true,
			membershipCost: true,
			seekingVolunteers: true,
			volunteerDescription: true,
			governance: true,
			website: true,
			contactEmail: true,
			contactPhone: true,
			contactVisibility: true,
			coverImage: true,
			verificationLevel: true,
			visibility: true,
			vision: true,
			principles: true,
			houseRules: true,
			annualGoals: true,
			moderationStatus: true,
			source: true,
			claimStatus: true,
			createdAt: true,
			updatedAt: true,
			ownerId: true,
			focusAreas: true,
			facilities: true,
			values: true,
			volunteerCapabilities: true,
			members: { select: { id: true, userId: true, status: true } }
		}
	});

        if (!community) {
            return { success: false, error: await localizeActionMessage('community.notFound') };
        }

        const callerRes = await getCurrentUser();
        const callerId = callerRes?.data?.user?.id;
        const callerIsAdmin = callerRes?.data?.user?.isAdmin === true;
        const isMember = community.members.some(
            (m: { userId: string; status: string }) => m.userId === callerId && m.status === 'ACTIVE'
        );
        const canViewCommunity =
            community.visibility === 'PUBLIC' ||
            callerIsAdmin ||
            community.ownerId === callerId ||
            (community.visibility === 'REGISTERED' && Boolean(callerId)) ||
            ((community.visibility === 'CONNECTIONS' || community.visibility === 'PRIVATE') && isMember);

        if (!canViewCommunity) {
            return { success: false, error: await localizeActionMessage('community.notFound') };
        }

        const showContact =
            community.contactVisibility === 'PUBLIC' ||
            callerIsAdmin ||
            (community.contactVisibility === 'MEMBERS_ONLY' && isMember);

        return {
            success: true,
            data: {
                id: community.id,
                name: community.name,
                slug: community.id, // Using ID as slug for MVP if slug field missing in DB. 
                // Schema has no 'slug' field. MVP plan had it in interface.
                // We'll use ID or mock slug.
                description: community.description || undefined,
                type: community.type,
                foundingYear: community.foundingYear || undefined,
                country: community.country || undefined,
                region: community.region || undefined,
                city: community.city || undefined,
                address: community.address || undefined,
                latitude: community.latitude || undefined,
                longitude: community.longitude || undefined,

                acceptingNewMembers: community.acceptingMembers === 'ACCEPTING',
                membershipConditions: community.joiningConditions || undefined,
                joiningProcess: community.joiningProcess || undefined,
                targetMemberDescription: community.targetMemberDescription || undefined,
                membershipCost: community.membershipCost || undefined,

                seekingVolunteers: community.seekingVolunteers,
                volunteerDescription: community.volunteerDescription || undefined,

                governanceType: community.governance,
                website: community.website || undefined,
                contactEmail: showContact ? (community.contactEmail || undefined) : undefined,
                contactPhone: showContact ? (community.contactPhone || undefined) : undefined,

                photoGallery: community.coverImage ? [community.coverImage] : [],

                // Relations
                values: (community as { values?: { value: string }[] }).values?.map((v: { value: string }) => v.value) || [],
                volunteerCapabilities: (community as { volunteerCapabilities?: { capability: string }[] }).volunteerCapabilities?.map((v: { capability: string }) => v.capability) || [],
                focusAreas: community.focusAreas.map((f: { focusArea: string }) => f.focusArea),
                facilities: community.facilities.map((f: { facility: string }) => f.facility),

                verificationLevel: community.verificationLevel,
                visibility: community.visibility,

                searchable: community.visibility === 'PUBLIC', // Derived

                vision: community.vision || undefined,
                principles: community.principles || undefined,
                houseRules: community.houseRules || undefined,
                annualGoals: community.annualGoals || undefined,

                moderationStatus: community.moderationStatus,
                source: community.source,
                claimStatus: community.claimStatus,
                createdAt: community.createdAt,
                updatedAt: community.updatedAt,
                ownerId: community.ownerId,
                memberCount: community.members.length
            } as unknown as Community,
        };
    } catch (error) {
        logActionError('Get community error', error);
        return { success: false, error: await localizeActionMessage('community.loadFailed') };
    }
}

/**
 * Search communities
 */
export async function searchCommunitiesAction(
    params: z.infer<typeof searchCommunitiesSchema>
): Promise<ApiResponse<PaginatedResponse<CommunitySearchResult>>> {
    try {
        const { query, type, city, country, acceptingNewMembers, causeId, page, pageSize } = searchCommunitiesSchema.parse(params);

        const where: Record<string, unknown> = {
            visibility: 'PUBLIC'
        };

        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
            ];
        }

        if (type) where.type = type;
        if (city) where.city = { contains: city, mode: 'insensitive' };
        if (country) where.country = { contains: country, mode: 'insensitive' };
        if (acceptingNewMembers !== undefined) {
            where.acceptingMembers = acceptingNewMembers ? 'ACCEPTING' : 'NOT_ACCEPTING';
        }
        if (causeId) where.socialCauses = { some: { id: causeId } };

        const skip = (page - 1) * pageSize;
        const take = pageSize;

        const [communities, total] = await Promise.all([
            prisma.community.findMany({
                where,
                skip,
                take,
                orderBy: { name: 'asc' },
                select: {
                    id: true,
                    name: true,
                    type: true,
                    city: true,
                    country: true,
                    acceptingMembers: true,
                    coverImage: true,
                    _count: { select: { members: true } }
                }
            }),
            prisma.community.count({ where })
        ]);

        return {
            success: true,
            data: {
                data: communities.map((c) => ({
                    id: c.id,
                    name: c.name,
                    slug: c.id,
                    type: c.type,
                    city: c.city || undefined,
                    country: c.country || undefined,
                    acceptingNewMembers: c.acceptingMembers === 'ACCEPTING',
                    photoUrl: c.coverImage || undefined,
                    memberCountRange: `${c._count.members}`,
                })),
                total,
                page,
                pageSize,
                hasMore: skip + communities.length < total,
            },
        };
    } catch (error) {
        logActionError('Search community error', error);
        return { success: false, error: await localizeActionMessage('common.searchFailed') };
    }
}

/**
 * Get featured communities (Recently active)
 */
export async function getFeaturedCommunities(limit = 3): Promise<Community[]> {
    try {
        const communities = await prisma.community.findMany({
            where: {
                visibility: 'PUBLIC',
            },
            take: limit,
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                name: true,
                type: true,
                city: true,
                country: true,
                coverImage: true,
                description: true,
                updatedAt: true,
                createdAt: true,
                ownerId: true,
                verificationLevel: true,
                visibility: true,
                acceptingMembers: true,
            }
        });

        return communities.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.id,
            type: c.type,
            city: c.city || undefined,
            country: c.country || undefined,
            acceptingNewMembers: c.acceptingMembers === 'ACCEPTING',
            memberCountRange: undefined,
            photoGallery: c.coverImage ? [c.coverImage] : [],
            values: [],
            focusAreas: [],
            facilities: [],
            verificationLevel: c.verificationLevel,
            visibility: c.visibility,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
            ownerId: c.ownerId,
            description: c.description || undefined
        })) as unknown as Community[];
    } catch (error) {
        logActionError('Get featured communities error', error);
        return [];
    }
}

/**
 * Get communities for the /communities directory page.
 *
 * Audience-gated like the map: anonymous visitors see PUBLIC communities,
 * registered users additionally see REGISTERED ones. Deleted and
 * non-approved (pending review / hidden) communities are always excluded.
 *
 * Intentionally does NOT catch errors: the /communities segment has an
 * error boundary, and a fetch failure must surface there instead of
 * rendering as a misleading "no communities" empty state.
 */
export async function getCommunityDirectory(limit = 60): Promise<CommunityDirectoryItem[]> {
    const take = Math.min(Math.max(1, Math.floor(limit)), 100);

    const callerRes = await getCurrentUser();
    const registeredAudience = Boolean(callerRes?.data?.user?.id);

    const communities = await prisma.community.findMany({
        where: {
            deletedAt: null,
            moderationStatus: 'APPROVED',
            visibility: registeredAudience
                ? { in: [Visibility.PUBLIC, Visibility.REGISTERED] }
                : Visibility.PUBLIC,
        },
        take,
        orderBy: { updatedAt: 'desc' },
        select: {
            id: true,
            name: true,
            description: true,
            type: true,
            city: true,
            country: true,
            acceptingMembers: true,
            _count: {
                select: {
                    members: { where: { status: 'ACTIVE' } },
                    Appreciate: true,
                },
            },
        },
    });

    return communities.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        type: c.type,
        city: c.city,
        country: c.country,
        memberCount: c._count.members,
        appreciateCount: c._count.Appreciate,
        isAcceptingMembers: c.acceptingMembers === 'ACCEPTING',
    }));
}

export async function getManageableCommunitiesAction(): Promise<ApiResponse<Array<{ id: string; name: string; city: string | null; role: CommunityRole }>>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.success || !currentUser.data) {
      return { success: false, error: await localizeActionMessage('common.loginRequired') };
    }

    const user = currentUser.data.user;
    const communities = await prisma.community.findMany({
      where: user.isAdmin
        ? { deletedAt: null }
        : {
            deletedAt: null,
            OR: [
              { ownerId: user.id },
              { members: { some: { userId: user.id, status: 'ACTIVE', role: { in: [CommunityRole.OWNER, CommunityRole.ADMIN] } } } },
            ],
          },
      select: {
        id: true,
        name: true,
        city: true,
        ownerId: true,
        members: {
          where: { userId: user.id, status: 'ACTIVE' },
          select: { role: true },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
      take: 200,
    });

    return {
      success: true,
      data: communities
        .filter((community) => user.isAdmin || community.ownerId === user.id || community.members[0]?.role === CommunityRole.OWNER || community.members[0]?.role === CommunityRole.ADMIN)
        .map((community) => ({
          id: community.id,
          name: community.name,
          city: community.city,
          role: community.ownerId === user.id ? CommunityRole.OWNER : community.members[0]?.role ?? CommunityRole.ADMIN,
        })),
    };
  } catch (error) {
    logActionError('Get manageable communities error', error);
    return { success: false, error: await localizeActionMessage('common.loadFailed') };
  }
}

export async function getCommunityRelationsAction(communityId: string): Promise<ApiResponse<Record<string, unknown>>> {
  try {
    const visible = await getCommunityAction(communityId);
    if (!visible.success) {
      return { success: false, error: visible.error };
    }

    const now = new Date();
    const [upcomingEvents, pastEvents, initiatives, pitches, socialIssues, weakSignals, causes, members] = await Promise.all([
      prisma.event.findMany({
        where: { communityId, deletedAt: null, startDate: { gte: now } },
        orderBy: { startDate: 'asc' },
        take: 6,
        select: { id: true, title: true, startDate: true, location: true, isOnline: true, coverImage: true, status: true },
      }),
      prisma.event.findMany({
        where: { communityId, deletedAt: null, startDate: { lt: now } },
        orderBy: { startDate: 'desc' },
        take: 6,
        select: { id: true, title: true, startDate: true, location: true, isOnline: true, coverImage: true, status: true },
      }),
      prisma.initiative.findMany({
        where: { communityId, archivedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        select: { id: true, title: true, description: true, state: true, updatedAt: true },
      }),
      prisma.pitch.findMany({
        where: { communityId, archivedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        select: { id: true, name: true, summary: true, stage: true, status: true, updatedAt: true },
      }),
      prisma.socialIssue.findMany({
        where: { communityId, deletedAt: null, visibility: 'PUBLIC' },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        select: { id: true, title: true, category: true, severity: true, status: true, updatedAt: true },
      }),
      prisma.weakSignal.findMany({
        where: { communityId, deletedAt: null, visibility: 'PUBLIC' },
        orderBy: { updatedAt: 'desc' },
        take: 6,
        select: { id: true, title: true, domain: true, confidence: true, status: true, updatedAt: true },
      }),
      prisma.socialCause.findMany({
        where: { supportingCommunities: { some: { id: communityId } } },
        orderBy: { title: 'asc' },
        take: 12,
        select: { id: true, slug: true, title: true, coverImage: true },
      }),
      prisma.communityMember.findMany({
        where: { communityId, status: 'ACTIVE' },
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        take: 24,
        select: { role: true, user: { select: { id: true, name: true, displayName: true, profilePhoto: true } } },
      }),
    ]);

    return {
      success: true,
      data: { upcomingEvents, pastEvents, initiatives, pitches, socialIssues, weakSignals, causes, members },
    };
  } catch (error) {
    logActionError('Get community relations error', error);
    return { success: false, error: await localizeActionMessage('common.loadFailed') };
  }
}
