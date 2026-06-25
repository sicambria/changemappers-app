export const DEFAULT_PAGE_SIZE = 30;
export const MAX_PAGE_SIZE = 100;
export const MAX_OFFSET = 10_000;

function boundedInteger(value: unknown, fallback: number, min: number, max: number): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const integer = Math.trunc(numeric);
  return Math.min(max, Math.max(min, integer));
}

export function normalizeOffsetPagination(
  filters?: { skip?: unknown; take?: unknown },
  options: { defaultTake?: number; maxTake?: number; maxSkip?: number } = {},
): { skip: number; take: number } {
  const defaultTake = options.defaultTake ?? DEFAULT_PAGE_SIZE;
  const maxTake = options.maxTake ?? MAX_PAGE_SIZE;
  const maxSkip = options.maxSkip ?? MAX_OFFSET;

  return {
    skip: boundedInteger(filters?.skip, 0, 0, maxSkip),
    take: boundedInteger(filters?.take, defaultTake, 1, maxTake),
  };
}

export function normalizeSearchText(value: unknown, maxLength = 200): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, maxLength);
}
