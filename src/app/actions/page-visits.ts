'use server';

import { logActionError } from '@/lib/action-logger';
import prisma from '@/lib/prisma';
import { getCurrentUser } from './auth';
import { PageModule, Archetype, type Prisma } from '@/lib/prisma';

import { getModuleForPath } from '@/lib/route-loader';
import { markUserActivity } from '@/lib/user-activity';

function getModuleFromPath(path: string): PageModule {
  const moduleName = getModuleForPath(path);
  // Map string module from JSON to PageModule enum
  return PageModule[moduleName as keyof typeof PageModule] || PageModule.OTHER;
}

export async function trackPageVisit(path: string) {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) {
    return { success: false, error: 'Not authenticated' };
  }

const user = auth.data.user;
const pageModule = getModuleFromPath(path);

try {
  const privacy = await prisma.user.findUnique({
    where: { id: user.id },
    select: { processingRestricted: true },
  });

  if (!privacy) {
    return { success: false, error: 'User not found' };
  }

  await markUserActivity(user.id);

  if (privacy.processingRestricted) {
    return { success: true, skipped: true };
  }


  await prisma.pageVisitLog.create({
    data: {
      userId: user.id,
      path,
      module: pageModule,
      userArchetypes: user.archetypes as Archetype[],
    },
  });

  await incrementAggregates(pageModule, user.archetypes as Archetype[]);

    return { success: true };
  } catch (e) {
    logActionError('Failed to track page visit', e);
    return { success: false, error: 'Database error' };
  }
}

async function incrementAggregates(
  module: PageModule,
  archetypes: Archetype[]
) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const archetypeKey = archetypes.length > 0 ? archetypes[0] : 'UNKNOWN';

  await upsertDaily(today, module, archetypeKey);
  await upsertWeekly(today, module, archetypeKey);
  await upsertMonthly(today, module, archetypeKey);
}

async function upsertDaily(today: Date, module: PageModule, archetypeKey: string) {
	const existing = await prisma.pageVisitDaily.findUnique({
		where: { date_module: { date: today, module } },
		select: { id: true, visitCount: true, archetypeBreakdown: true },
	});

  if (existing) {
    const breakdown = existing.archetypeBreakdown as Record<string, number>;
    breakdown[archetypeKey] = (breakdown[archetypeKey] || 0) + 1;
    await prisma.pageVisitDaily.update({
      where: { id: existing.id },
      data: {
        visitCount: { increment: 1 },
        archetypeBreakdown: breakdown,
      },
    });
  } else {
    await prisma.pageVisitDaily.create({
      data: {
        date: today,
        module,
        visitCount: 1,
        uniqueVisitors: 1,
        archetypeBreakdown: { [archetypeKey]: 1 },
      },
    });
  }
}

async function upsertWeekly(today: Date, module: PageModule, archetypeKey: string) {
	const dayOfWeek = today.getDay();
	const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
	const weekStart = new Date(today);
	weekStart.setDate(weekStart.getDate() - daysToSubtract);

	const existing = await prisma.pageVisitWeekly.findUnique({
		where: { weekStart_module: { weekStart, module } },
		select: { id: true, visitCount: true, archetypeBreakdown: true },
	});

  if (existing) {
    const breakdown = existing.archetypeBreakdown as Record<string, number>;
    breakdown[archetypeKey] = (breakdown[archetypeKey] || 0) + 1;
    await prisma.pageVisitWeekly.update({
      where: { id: existing.id },
      data: {
        visitCount: { increment: 1 },
        archetypeBreakdown: breakdown,
      },
    });
  } else {
    await prisma.pageVisitWeekly.create({
      data: {
        weekStart,
        module,
        visitCount: 1,
        uniqueVisitors: 1,
        archetypeBreakdown: { [archetypeKey]: 1 },
      },
    });
  }
}

async function upsertMonthly(today: Date, module: PageModule, archetypeKey: string) {
	const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

	const existing = await prisma.pageVisitMonthly.findUnique({
		where: { monthStart_module: { monthStart, module } },
		select: { id: true, visitCount: true, archetypeBreakdown: true },
	});

  if (existing) {
    const breakdown = existing.archetypeBreakdown as Record<string, number>;
    breakdown[archetypeKey] = (breakdown[archetypeKey] || 0) + 1;
    await prisma.pageVisitMonthly.update({
      where: { id: existing.id },
      data: {
        visitCount: { increment: 1 },
        archetypeBreakdown: breakdown,
      },
    });
  } else {
    await prisma.pageVisitMonthly.create({
      data: {
        monthStart,
        module,
        visitCount: 1,
        uniqueVisitors: 1,
        archetypeBreakdown: { [archetypeKey]: 1 },
      },
    });
  }
}

export type PageVisitAnalyticsParams = {
  granularity: 'daily' | 'weekly' | 'monthly';
  module?: PageModule;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
};

export async function getPageVisitAnalytics(params: PageVisitAnalyticsParams) {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data?.user.isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  const { granularity, module, startDate, endDate, limit = 50, offset = 0 } = params;

  try {
    const where: Prisma.PageVisitDailyWhereInput | Prisma.PageVisitWeeklyWhereInput | Prisma.PageVisitMonthlyWhereInput = {};
    if (module) where.module = module;
    if (startDate || endDate) {
      let dateField: string;
      if (granularity === 'daily') { dateField = 'date'; }
      else if (granularity === 'weekly') { dateField = 'weekStart'; }
      else { dateField = 'monthStart'; }
      (where as Record<string, unknown>)[dateField] = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }

    let data;
    let total;

if (granularity === 'daily') {
		[data, total] = await Promise.all([
			prisma.pageVisitDaily.findMany({
				where: where as Prisma.PageVisitDailyWhereInput,
				select: { id: true, date: true, module: true, visitCount: true, uniqueVisitors: true, archetypeBreakdown: true },
				orderBy: { date: 'desc' },
				take: limit,
				skip: offset,
			}),
			prisma.pageVisitDaily.count({ where: where as Prisma.PageVisitDailyWhereInput }),
		]);
	} else if (granularity === 'weekly') {
		[data, total] = await Promise.all([
			prisma.pageVisitWeekly.findMany({
				where: where as Prisma.PageVisitWeeklyWhereInput,
				select: { id: true, weekStart: true, module: true, visitCount: true, uniqueVisitors: true, archetypeBreakdown: true },
				orderBy: { weekStart: 'desc' },
				take: limit,
				skip: offset,
			}),
			prisma.pageVisitWeekly.count({ where: where as Prisma.PageVisitWeeklyWhereInput }),
		]);
	} else {
		[data, total] = await Promise.all([
			prisma.pageVisitMonthly.findMany({
				where: where as Prisma.PageVisitMonthlyWhereInput,
				select: { id: true, monthStart: true, module: true, visitCount: true, uniqueVisitors: true, archetypeBreakdown: true },
				orderBy: { monthStart: 'desc' },
				take: limit,
				skip: offset,
			}),
			prisma.pageVisitMonthly.count({ where: where as Prisma.PageVisitMonthlyWhereInput }),
		]);
	}

    return { success: true, data, total };
  } catch (e) {
    logActionError('Failed to get page visit analytics', e);
    return { success: false, error: 'Database error' };
  }
}

export async function getModuleSummary() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data?.user.isAdmin) {
    return { success: false, error: 'Unauthorized' };
  }

  try {
    const daily = await prisma.pageVisitDaily.groupBy({
      by: ['module'],
      _sum: { visitCount: true },
      orderBy: { _sum: { visitCount: 'desc' } },
    });

    return { success: true, data: daily };
  } catch (e) {
    logActionError('Failed to get module summary', e);
    return { success: false, error: 'Database error' };
  }
}
