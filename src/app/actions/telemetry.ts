'use server';

import { logActionError } from '@/lib/action-logger';
import prisma from '@/lib/prisma';
import { getCurrentUser } from './auth';

export async function getTelemetryData() {
    const auth = await getCurrentUser();
    if (!auth.success || !auth.data?.user.isAdmin) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
    // 1. Burnout Proxy (RESTING mode per archetype)
  const allProfiles = await prisma.userFunctionalProfile.findMany({
    select: {
      availabilityMode: true,
      sustainabilityMap: true,
      user: { select: { archetypes: true } }
    },
    take: 5000,
  });

        const archetypeStatus: Record<string, { total: number, resting: number }> = {};
        allProfiles.forEach(p => {
            const arches = p.user?.archetypes || ['UNKNOWN'];
            arches.forEach((a: string) => {
                if (!archetypeStatus[a]) archetypeStatus[a] = { total: 0, resting: 0 };
                archetypeStatus[a].total += 1;
                if (p.availabilityMode === 'RESTING') {
                    archetypeStatus[a].resting += 1;
                }
            });
        });

        const burnoutData = Object.entries(archetypeStatus).map(([arch, data]) => ({
            archetype: arch,
            RESTING_percentage: data.total > 0 ? (data.resting / data.total) * 100 : 0
        })).sort((a, b) => b.RESTING_percentage - a.RESTING_percentage);

        // 2. Acceptance/Rejection Rates (MatchRejectionLog)
        const rejections = await prisma.matchRejectionLog.groupBy({
            by: ['targetUserArchetype', 'candidateArchetype'],
            _count: true
        });
        const rejectionData = rejections.map(r => ({
            from: r.targetUserArchetype,
            to: r.candidateArchetype,
            count: r._count
        })).sort((a, b) => b.count - a.count);

        // 3. Return Visit Rates for SD & LP (Alchemist, Sentinel, Mycelium)
  const highRiskUsers = await prisma.user.findMany({
    where: {
      archetypes: { hasSome: ['ALCHEMIST', 'SENTINEL', 'MYCELIUM'] }
    },
    select: {
      id: true,
      createdAt: true,
      lastActiveAt: true,
      archetypes: true
    },
    take: 5000,
  });

        let activeHighRisk = 0;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        highRiskUsers.forEach(u => {
            if (u.lastActiveAt > thirtyDaysAgo) activeHighRisk++;
        });
        const highRiskRetention = highRiskUsers.length > 0 ? (activeHighRisk / highRiskUsers.length) * 100 : 0;

        // 4. Growth Trends in Depleting Sustainability Flags
        let totalDepletingFlags = 0;
        allProfiles.forEach(p => {
            if (p.sustainabilityMap) {
                const sMap = p.sustainabilityMap as Record<string, string>;
                Object.values(sMap).forEach(val => {
                    if (val === 'depleting') totalDepletingFlags++;
                });
            }
        });

        return {
            success: true,
            data: {
                burnoutData,
                rejectionData,
                highRiskRetention,
                totalDepletingFlags
            }
        };

    } catch (e) {
        logActionError('getTelemetryData', e);
        return { success: false, error: 'Database error' };
    }
}
