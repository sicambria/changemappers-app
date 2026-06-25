import { AvailabilityMode } from '@/lib/prisma';

/**
 * Returns true if a user with the given availability mode can be surfaced
 * as a match candidate. RESTING users are NEVER surfaced — no feature can
 * override this. REFLECTING users can browse but are not surfaced to others.
 */
export function isMatchable(mode: AvailabilityMode): boolean {
  return mode !== AvailabilityMode.RESTING && mode !== AvailabilityMode.REFLECTING;
}

/**
 * Prisma where-clause fragment to exclude non-matchable users.
 * Include this in all candidate queries across every modality.
 */
export const matchableAvailabilityFilter = {
  functionalProfile: {
    availabilityMode: {
      notIn: [AvailabilityMode.RESTING, AvailabilityMode.REFLECTING] as AvailabilityMode[],
    },
  },
} as const;
