import type prismaDefault from '@/lib/prisma';
import { Prisma } from '@/lib/prisma';
import { eraseUserPersonalData } from '@/lib/gdpr/user-data';

type AdminPrismaClient = typeof prismaDefault;

/**
 * Outcome of an admin-initiated user hard delete (AUDIT-20260613-028).
 *
 * - `deleted`: the User row was physically removed (account had no retained
 *   content — typical for pending/abandoned registrations).
 * - `anonymized`: the account had authored content (`FeedPost`, `Story`,
 *   offers/requests, signals, ...) that the GDPR erasure path intentionally
 *   retains in anonymized form; the User row stays as the same anonymized
 *   tombstone the self-service erasure produces. This is a successful
 *   deletion from a personal-data standpoint.
 */
export type AdminUserDeletionOutcome = 'deleted' | 'anonymized';

// When @prisma/adapter-pg is active, FK/restrict violations surface as DriverAdapterError.
// Two PostgreSQL SQLSTATE codes matter:
//   23503 (foreign_key_violation) → adapter maps to kind='ForeignKeyConstraintViolation'
//   23001 (restrict_violation)    → adapter default: kind='postgres', code='23001'
type DriverAdapterCause = { kind?: unknown; code?: unknown; constraint?: { index?: unknown; fields?: unknown[] } };
function driverAdapterCause(error: unknown): DriverAdapterCause | null {
  if (error === null || typeof error !== 'object') return null;
  if ((error as { name?: unknown }).name !== 'DriverAdapterError') return null;
  const cause = (error as { cause?: DriverAdapterCause }).cause;
  return cause ?? null;
}

/** Prisma P2003 / PostgreSQL 23001 = foreign key / restrict constraint violation. */
export function isForeignKeyConstraintViolation(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') return true;
  const cause = driverAdapterCause(error);
  if (cause == null) return false;
  return cause.kind === 'ForeignKeyConstraintViolation' ||
    (cause.kind === 'postgres' && (cause.code === '23001' || cause.code === '23503'));
}

function prismaConstraintName(error: Prisma.PrismaClientKnownRequestError): string | null {
  const meta = error.meta as { constraint?: unknown; field_name?: unknown } | undefined;
  if (meta == null) return null;
  const name = meta.constraint ?? meta.field_name;
  return typeof name === 'string' ? name : null;
}

function driverAdapterConstraintName(c: NonNullable<DriverAdapterCause['constraint']>): string | null {
  if (typeof c.index === 'string') return c.index;
  const first = Array.isArray(c.fields) ? c.fields[0] : undefined;
  return typeof first === 'string' ? first : null;
}

/** Best-effort name of the violated FK constraint/field for operator-facing errors. */
export function foreignKeyConstraintName(error: unknown): string | null {
  if (!isForeignKeyConstraintViolation(error)) return null;
  if (error instanceof Prisma.PrismaClientKnownRequestError) return prismaConstraintName(error);
  const cause = driverAdapterCause(error);
  const c = cause?.constraint;
  return c != null ? driverAdapterConstraintName(c) : null;
}

/**
 * Admin hard delete of a user account, routed through the shared GDPR erasure
 * machinery so admin deletion and self-service erasure stay one
 * implementation (AUDIT-20260613-028).
 *
 * 1. Run the full erasure transaction (`buildUserErasureOperations`) — wipes
 *    PII, sessions, analytics rows (incl. `PageVisitLog`), messages, and
 *    anonymizes retained authored content in place.
 * 2. Best-effort physical delete of the emptied User row. ~34 required
 *    `User` relations default to `onDelete: Restrict`, so this succeeds only
 *    when no anonymized content rows remain; an FK violation here is the
 *    expected signal for the `anonymized` outcome, not an error.
 */
export async function adminHardDeleteUser(client: AdminPrismaClient, userId: string): Promise<AdminUserDeletionOutcome> {
  await eraseUserPersonalData(client, userId);
  try {
    await client.user.delete({ where: { id: userId }, select: { id: true } });
    return 'deleted';
  } catch (error) {
    if (isForeignKeyConstraintViolation(error)) {
      return 'anonymized';
    }
    throw error;
  }
}

/**
 * All Prisma models that (transitively) block hard-deleting `User`, `Event`,
 * `Community`, or `SocialCause` rows because they hold a foreign key with an
 * effective referential action of `Restrict`/`NoAction` (required relations
 * with no explicit `onDelete` default to `Restrict`).
 *
 * Used by `adminResetFullDb` to wipe user content before deleting users.
 * Listed in topological order: a model always appears BEFORE any model it
 * restricts (e.g. `coachingEngagement` before `coachingOffer`), so a single
 * ordered `deleteMany` pass cannot hit an FK violation.
 *
 * The generated Prisma client ships a trimmed runtime DMMF without
 * referential actions, so this list is static and derived from
 * `prisma/schema.prisma`. It is drift-guarded by
 * `src/__tests__/lib/admin-user-deletion.test.ts`, which re-derives the set
 * and the ordering constraints from the schema — update this list when that
 * test fails after a schema change.
 */
export const USER_CONTENT_WIPE_MODELS = [
  'backlogItem',
  'backlogResonance',
  'canvasNodeComment',
  'coachMeSession',
  'coachingFeedback',
  'coachingEngagement',
  'coachingOffer',
  'coachingRequest',
  'contributionFeedback',
  'contributionConnection',
  'contributionOffer',
  'contributionRequest',
  'energyCanvas',
  'energyPatternMatch',
  'energyPatternEntry',
  'energyRelation',
  'energyEntity',
  'feedComment',
  'feedPost',
  'initiativeRetrospective',
  'initiative',
  'initiativeUpdate',
  'interventionRecord',
  'invite',
  'mentoringFeedback',
  'mentoringRelationship',
  'mentoringRequest',
  'pageVisitLog',
  'patternLibraryEntry',
  'peerSupportFeedback',
  'peerSupportConnection',
  'peerSupportOffer',
  'peerSupportRequest',
  'report',
  'rootCauseDiagnostic',
  'signalCollection',
  'socialIssue',
  'story',
  'storyComment',
  'systemsCanvas',
  'systemsCanvasLink',
  'systemsCanvasNode',
  'trainingFeedback',
  'trainingEngagement',
  'trainingOffer',
  'trainingRequest',
  'volunteerApplication',
  'volunteerOpportunity',
  'weakSignal',
  'weakSignalPattern',
] as const;

type WipeDelegate = { deleteMany: (args?: Record<string, never>) => Prisma.PrismaPromise<unknown> };

/**
 * `deleteMany()` operations for every user-content model, in FK-safe order.
 * Intended for `prisma.$transaction([...])` inside full-DB reset flows.
 */
export function buildUserContentWipeOperations(client: AdminPrismaClient): Prisma.PrismaPromise<unknown>[] {
  return USER_CONTENT_WIPE_MODELS.map((model) => {
    const delegate = (client as unknown as Record<string, WipeDelegate | undefined>)[model];
    if (!delegate || typeof delegate.deleteMany !== 'function') {
      throw new Error(`User content wipe delegate missing: ${model}.deleteMany`);
    }
    return delegate.deleteMany();
  });
}
