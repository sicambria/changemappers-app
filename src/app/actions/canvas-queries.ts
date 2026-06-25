'use server';

import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/get-current-user';

// ─────────────────────────────────────────
// SOLUTION PATTERN RECOMMENDATIONS
// Simple domain → PatternLibraryEntry lookup (not ML)
// ─────────────────────────────────────────

export async function getSolutionPatternRecommendationsAction(domain: string) {
  if (!domain || domain.length < 2) return [];

return prisma.patternLibraryEntry.findMany({
where: {
status: 'VALIDATED',
OR: [
{ category: { contains: domain, mode: 'insensitive' } },
{ applicableContexts: { hasSome: [domain] } },
],
},
select: {
id: true,
name: true,
category: true,
applicableContexts: true,
status: true,
createdAt: true,
},
orderBy: { createdAt: 'desc' },
take: 5,
});
}

// ─────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────

export async function getCanvasAction(id: string) {
	const auth = await getCurrentUser();
	if (!auth.success || !auth.data) return null;
	const userId = auth.data.id;

  const communityMemberships = await prisma.communityMember.findMany({
    where: { userId },
    select: { communityId: true },
    take: 100,
  });
  const memberCommunityIds = communityMemberships.map(m => m.communityId);

  // findFirst is required because the OR visibility filter is not a unique lookup.
  return prisma.systemsCanvas.findFirst({
		where: {
			id,
			status: 'ACTIVE',
			// Visibility intersection: only surfaces canvases the caller may see.
			// PUBLIC/REGISTERED open to any authenticated user; COMMUNITY requires membership.
			OR: [
				{ visibility: 'PUBLIC' },
				{ visibility: 'REGISTERED' },
				{ visibility: 'COMMUNITY', communityId: { in: memberCommunityIds } },
				{ createdById: userId },
			],
		},
		select: {
			id: true,
			title: true,
			description: true,
			status: true,
			visibility: true,
			diagramXml: true,
			createdAt: true,
			updatedAt: true,
			createdBy: { select: { id: true, name: true, profilePhoto: true } },
nodes: {
where: { deletedAt: null },
select: {
id: true,
type: true,
title: true,
description: true,
positionX: true,
positionY: true,
createdAt: true,
deletedAt: true,
createdBy: { select: { name: true } },
comments: {
where: { deletedAt: null },
select: { id: true, content: true, createdAt: true, author: { select: { id: true, name: true, profilePhoto: true } } },
orderBy: { createdAt: 'asc' },
},
interventions: {
select: { id: true, outcome: true, reflection: true, createdAt: true },
orderBy: { createdAt: 'desc' },
},
},
},
links: {
where: { deletedAt: null },
select: { id: true, fromNodeId: true, toNodeId: true, linkType: true, deletedAt: true },
},
},
});
}

export async function getCanvasesAction(communityId?: string) {
	const auth = await getCurrentUser();
	if (!auth.success || !auth.data) return [];
	const userId = auth.data.id;

  const communityMemberships = await prisma.communityMember.findMany({
    where: { userId },
    select: { communityId: true },
    take: 100,
  });
  const memberCommunityIds = communityMemberships.map(m => m.communityId);

  return prisma.systemsCanvas.findMany({
		where: {
			status: 'ACTIVE',
			...(communityId ? { communityId } : {}),
			OR: [
				{ visibility: 'PUBLIC' },
				{ visibility: 'REGISTERED' },
				{ visibility: 'COMMUNITY', communityId: { in: memberCommunityIds } },
				{ createdById: userId },
			],
		},
		select: {
			id: true,
			title: true,
			description: true,
			status: true,
			visibility: true,
			createdAt: true,
			updatedAt: true,
			createdBy: { select: { id: true, name: true } },
			_count: { select: { nodes: true, links: true } },
		},
		orderBy: { updatedAt: 'desc' },
		take: 50,
	});
}

export async function getPatternLibraryAction(category?: string) {
return prisma.patternLibraryEntry.findMany({
where: {
status: { in: ['PROPOSED', 'VALIDATED'] },
...(category ? { category: { contains: category, mode: 'insensitive' } } : {}),
},
select: {
id: true,
name: true,
category: true,
applicableContexts: true,
requirements: true,
limitations: true,
examples: true,
status: true,
createdAt: true,
proposedBy: { select: { id: true, name: true } },
},
orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
take: 100,
});
}
