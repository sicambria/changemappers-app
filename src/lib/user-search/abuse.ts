export const USER_SEARCH_ABUSE_LIMITS = {
  minQueryLength: 2,
  maxQueryLength: 200,
  maxPage: 10,
  maxPageSize: 50,
  maxBroadSearchPage: 1,
  exposedTotalLimit: 100,
} as const;

type UserSearchSignalInput = {
  query?: string;
  archetypes?: readonly string[];
  city?: string;
  radiusKm?: number;
};

export function emptyStringToUndefined(value: unknown): unknown {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }

  return value;
}

export function hasUserSearchSignal(input: UserSearchSignalInput): boolean {
  return Boolean(input.query?.trim())
    || Boolean(input.city?.trim())
    || Boolean(input.archetypes?.length)
    || input.radiusKm != null;
}

export function capExposedUserSearchTotal(total: number): number {
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return Math.min(Math.trunc(total), USER_SEARCH_ABUSE_LIMITS.exposedTotalLimit);
}
