import { type ReflectionLevel } from '@/lib/prisma';

export type ReflectionStaleness = 'fresh' | 'soft' | 'overdue';

export interface ReflectionDue {
  due: boolean;
  nextDueAt: Date;
  staleness: ReflectionStaleness;
}

export interface ReflectionPriority {
  level: ReflectionLevel;
  href: string;
  staleness: ReflectionStaleness;
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Per-level cadence windows (v1: only L1-L3 have capture routes)
const CADENCE_MS: Partial<Record<ReflectionLevel, number>> = {
  L1_PULSE: 7 * DAY_MS,
  L2_AVAILABILITY: 30 * DAY_MS,
  L3_PROJECT: 90 * DAY_MS,
};

const TRACKED_LEVELS: Array<{ level: ReflectionLevel; href: string }> = [
  { level: 'L1_PULSE', href: '/reflect/pulse' },
  { level: 'L2_AVAILABILITY', href: '/reflect/availability' },
  { level: 'L3_PROJECT', href: '/reflect/project' },
];

const STALENESS_ORDER: Record<ReflectionStaleness, number> = {
  overdue: 0,
  soft: 1,
  fresh: 2,
};

export function nextReflectionDue(level: ReflectionLevel, lastAt: Date | null, now: Date): ReflectionDue {
  const cadenceMs = CADENCE_MS[level];
  if (!cadenceMs) {
    return { due: false, nextDueAt: now, staleness: 'fresh' };
  }
  if (!lastAt) {
    return { due: true, nextDueAt: now, staleness: 'overdue' };
  }
  const nextDueAt = new Date(lastAt.getTime() + cadenceMs);
  if (now < nextDueAt) {
    return { due: false, nextDueAt, staleness: 'fresh' };
  }
  const overdueMs = now.getTime() - nextDueAt.getTime();
  const staleness: ReflectionStaleness = overdueMs > cadenceMs ? 'overdue' : 'soft';
  return { due: true, nextDueAt, staleness };
}

export function prioritiseReflections(
  lastByLevel: Partial<Record<ReflectionLevel, Date | null>>,
  now: Date,
): ReflectionPriority[] {
  return TRACKED_LEVELS
    .map(({ level, href }) => {
      const result = nextReflectionDue(level, lastByLevel[level] ?? null, now);
      return { level, href, staleness: result.staleness, due: result.due };
    })
    .filter(c => c.due)
    .sort((a, b) => STALENESS_ORDER[a.staleness] - STALENESS_ORDER[b.staleness])
    .map(({ level, href, staleness }) => ({ level, href, staleness }));
}

export function getTopReflectionPrompt(
  lastByLevel: Partial<Record<ReflectionLevel, Date | null>>,
  now: Date,
): ReflectionPriority | null {
  const ranked = prioritiseReflections(lastByLevel, now);
  return ranked[0] ?? null;
}
