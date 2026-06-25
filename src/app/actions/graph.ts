'use server';

import { logActionError } from '@/lib/action-logger';
import { localizeActionMessage } from '@/lib/action-result-i18n';
import { getCurrentUser } from '@/app/actions/auth';
import { prisma, Visibility } from '@/lib/prisma';
import type { GraphNode, GraphLink, SystemicGraphData } from '@/types/graph';
import type { ApiResponse } from '@/types/common';
import { getPublicMemberWhereInput } from '@/lib/public-member-eligibility';

function getUserLevelBonus(changemakeLevel: string | null | undefined): number {
    if (changemakeLevel === 'LEVEL_9') return 5;
    if (changemakeLevel === 'LEVEL_8') return 4;
    return 2;
}

type UserRow = {
    id: string; name: string; city: string | null; country: string | null;
    changemakeLevel: string | null; archetypes: string[];
    availability: string | null;
    skills: { skill: string; skillType: string }[];
    functionalProfile: { rdgMain: string[]; rdgInterested: string[] } | null;
    communityMemberships: { communityId: string }[];
    hostedEvents: { id: string }[];
};

type CommunityRow = {
    id: string; name: string; type: string; city: string | null; country: string | null;
    focusAreas: { focusArea: string }[];
    socialCauses: { id: string }[];
};

type EventRow = {
    id: string; title: string; type: string;
    location: string | null; category: string | null;
    communityId: string | null; hostId: string;
};

type CauseRow = { id: string; title: string; slug: string; rdgDomains: string[] };

function buildUserNodesAndLinks(users: UserRow[]): { nodes: GraphNode[]; links: GraphLink[] } {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    for (const u of users) {
        const userSkills = u.skills.map(s => s.skill);
        const userRDGs = [...(u.functionalProfile?.rdgMain || []), ...(u.functionalProfile?.rdgInterested || [])];
        const levelBonus = getUserLevelBonus(u.changemakeLevel);
        nodes.push({
            id: `user-${u.id}`, label: u.name, type: 'USER', group: 1,
            val: 5 + levelBonus,
            metadata: { location: { city: u.city, country: u.country }, archetypes: u.archetypes, skills: userSkills, rdgs: userRDGs },
        });
        for (const arch of u.archetypes) {
            links.push({ source: `user-${u.id}`, target: `arch-${arch}`, type: 'embodies', value: 1 });
        }
        for (const mem of u.communityMemberships) {
            links.push({ source: `user-${u.id}`, target: `comm-${mem.communityId}`, type: 'member', value: 2 });
        }
        for (const ev of u.hostedEvents) {
            links.push({ source: `user-${u.id}`, target: `event-${ev.id}`, type: 'hosts', value: 2 });
        }
    }
    return { nodes, links };
}

function buildCommunityNodesAndLinks(communities: CommunityRow[]): { nodes: GraphNode[]; links: GraphLink[] } {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    for (const c of communities) {
        nodes.push({
            id: `comm-${c.id}`, label: c.name, type: 'COMMUNITY', group: 2,
            val: 8 + c.focusAreas.length,
            metadata: { location: { city: c.city, country: c.country } },
        });
        for (const cause of c.socialCauses) {
            links.push({ source: `comm-${c.id}`, target: `cause-${cause.id}`, type: 'focuses_on', value: 1 });
        }
    }
    return { nodes, links };
}

function buildEventNodesAndLinks(events: EventRow[]): { nodes: GraphNode[]; links: GraphLink[] } {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    for (const e of events) {
        nodes.push({
            id: `event-${e.id}`, label: e.title, type: 'EVENT', group: 3,
            val: 6, metadata: { location: { city: e.location } },
        });
        if (e.communityId) {
            links.push({ source: `event-${e.id}`, target: `comm-${e.communityId}`, type: 'hosted_by', value: 1 });
        }
    }
    return { nodes, links };
}

function buildCauseNodes(causes: CauseRow[]): GraphNode[] {
    return causes.map(cause => ({
        id: `cause-${cause.id}`, label: cause.title, type: 'CAUSE', group: 4,
        val: 10, metadata: { rdgs: cause.rdgDomains },
    }));
}

const ARCHETYPE_ENUM_LIST = ['MYCELIUM', 'KEYSTONE', 'POLLINATOR', 'PRISM', 'COMPOST', 'SENTINEL', 'ALCHEMIST', 'CANOPY', 'SPARK', 'ECHO', 'TIDE', 'HORIZON'];

function buildArchetypeNodes(archetypes: { slug: string; title: string }[]): GraphNode[] {
    const metadataMap = new Map(archetypes.map(a => [a.slug.toUpperCase(), a.title]));
    return ARCHETYPE_ENUM_LIST.map(archSlug => ({
        id: `arch-${archSlug}`, label: metadataMap.get(archSlug) || archSlug,
        type: 'ARCHETYPE', group: 5, val: 12,
    }));
}

export async function getSystemicGraphDataAction(): Promise<ApiResponse<SystemicGraphData>> {
    try {
        const userRes = await getCurrentUser();
        if ('error' in userRes) {
            return { success: false, error: await localizeActionMessage('common.unauthorized') };
        }

    // We run these queries in parallel
    const [users, communities, events, causes, archetypes] = await Promise.all([
      // 1. Fetch Users
      prisma.user.findMany({
        where: getPublicMemberWhereInput(),
        take: 500,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          city: true,
          country: true,
          changemakeLevel: true,
          archetypes: true,
          availability: true,
          skills: { select: { skill: true, skillType: true } },
          functionalProfile: { select: { rdgMain: true, rdgInterested: true } },
          communityMemberships: { select: { communityId: true } },
          hostedEvents: { select: { id: true } }
        }
      }),

      // 2. Fetch Communities
      prisma.community.findMany({
        where: { deletedAt: null, visibility: { in: [Visibility.PUBLIC, Visibility.REGISTERED] } },
        take: 300,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          type: true,
          city: true,
          country: true,
          focusAreas: { select: { focusArea: true } },
          socialCauses: { select: { id: true } }
        }
      }),

      // 3. Fetch Events
      prisma.event.findMany({
        where: { deletedAt: null, status: 'UPCOMING' },
        take: 200,
        orderBy: { startDate: 'asc' },
        select: {
          id: true,
          title: true,
          type: true,
          location: true,
          category: true,
          communityId: true,
          hostId: true
        }
      }),

      // 4. Fetch Causes (RDGs/domains)
      prisma.socialCause.findMany({
        take: 200,
        select: {
          id: true,
          title: true,
          slug: true,
          rdgDomains: true
        }
      }),

      // 5. Fetch Archetypes metadata
      prisma.communityArchetype.findMany({
        take: 100,
        select: { slug: true, title: true }
      })
    ]);

        const userPart = buildUserNodesAndLinks(users);
        const commPart = buildCommunityNodesAndLinks(communities);
        const eventPart = buildEventNodesAndLinks(events);

        const nodes: GraphNode[] = [
            ...userPart.nodes,
            ...commPart.nodes,
            ...eventPart.nodes,
            ...buildCauseNodes(causes),
            ...buildArchetypeNodes(archetypes),
        ];
        const links: GraphLink[] = [
            ...userPart.links,
            ...commPart.links,
            ...eventPart.links,
        ];

        return { success: true, data: { nodes, links } };
    } catch (e: unknown) {
        logActionError('systemic graph fetch error', e);
        return { success: false, error: await localizeActionMessage('graph.loadFailed') };
    }
}
