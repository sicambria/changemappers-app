import { Availability, AvailabilityMode, Prisma, Visibility } from '@/lib/prisma';

export const PLATFORM_ADMIN_EMAILS = ['admin@changemappers.hu'] as const;
export const NON_PUBLIC_TEST_EMAIL_DOMAINS = ['@changemappers.test'] as const;

type PublicMemberAccount = {
  deletedAt?: Date | string | null;
  inactiveAt?: Date | string | null;
  email?: string | null;
  isAdmin?: boolean | null;
  name?: string | null;
  isEmailVerified?: boolean | null;
  isRegistrationPending?: boolean | null;
  isSuspended?: boolean | null;
  processingRestricted?: boolean | null;
  profileVisibility?: string | null;
  termsAcceptedAt?: Date | string | null;
  onboardingState?: { lastStageCompleted?: number | null } | null;
};

type AvailabilityAccount = PublicMemberAccount & {
  availability?: string | null;
  functionalProfile?: { availabilityMode?: string | null } | null;
};

type TrustBaselineAccount = {
  profilePhoto?: string | null;
  bio?: string | null;
  website?: string | null;
  organizationName?: string | null;
  socialLinks?: Prisma.JsonValue | null;
};

type MatchableAccount = AvailabilityAccount & TrustBaselineAccount & {
  declineAlgorithmicMatching?: boolean | null;
  allowSensitiveMatching?: boolean | null;
  specialCategoryConsentWithdrawnAt?: Date | string | null;
};

/**
 * A string field carries a trust signal only when it is non-null and not the
 * empty string. We deliberately do NOT trim here: registration writers already
 * normalise empty/whitespace input to `null` (see lean-register), and skipping
 * the trim keeps this exactly equivalent to the Prisma `{ not: '' }` filter in
 * {@link getMatchableMemberWhereInput} — the equivalence the integration suite
 * pins. Whitespace-only values are not a stored shape.
 */
function hasTrustSignalString(value: string | null | undefined): boolean {
  return value != null && value !== '';
}

/**
 * Flow-independent trust baseline required before a user is treated as matchable
 * (AUDIT-20260611-007). Mirrors the three "Profile trust" fields the lean
 * `/register` flow requires but the full wizard leaves optional: a profile
 * photo, a short bio, and at least one context signal (organization, website,
 * or social link). Availability mode and sensitive-matching consent — the other
 * two baseline items — are enforced separately in {@link isMatchableMemberAccount}.
 *
 * `socialLinks` counts as a context signal whenever the column is non-null; the
 * registration writers only persist it when real links exist (never `{}`), so
 * non-null is equivalent to "has a link" for stored data and matches the
 * `{ not: Prisma.DbNull }` candidate filter.
 */
export function hasMatchingTrustBaseline(user: TrustBaselineAccount): boolean {
  const hasContextSignal = hasTrustSignalString(user.website)
    || hasTrustSignalString(user.organizationName)
    || user.socialLinks != null;
  return hasTrustSignalString(user.profilePhoto)
    && hasTrustSignalString(user.bio)
    && hasContextSignal;
}

export function isNonPublicTestEmail(email: string | null | undefined): boolean {
  const normalized = email?.toLowerCase() ?? '';
  return NON_PUBLIC_TEST_EMAIL_DOMAINS.some((domain) => normalized.endsWith(domain));
}

export function isEligibleVisibleMemberAccount(user: PublicMemberAccount): boolean {
  return user.deletedAt == null
    && user.inactiveAt == null
    && user.isAdmin !== true
    && user.isSuspended !== true
    && user.isEmailVerified === true
    && user.isRegistrationPending !== true
    && user.processingRestricted !== true
    && user.termsAcceptedAt != null
    && (user.onboardingState?.lastStageCompleted ?? 0) >= 6
    && user.name !== '_pending_'
    && !PLATFORM_ADMIN_EMAILS.some((email) => email === (user.email ?? '').toLowerCase())
    && !isNonPublicTestEmail(user.email);
}

export function hasAvailableMemberPresence(user: AvailabilityAccount): boolean {
  const mode = user.functionalProfile?.availabilityMode;
  return user.availability !== Availability.AWAY
    && mode !== AvailabilityMode.RESTING
    && mode !== AvailabilityMode.REFLECTING;
}

export function isConnectableMemberAccount(user: AvailabilityAccount): boolean {
  return isEligibleVisibleMemberAccount(user) && hasAvailableMemberPresence(user);
}

export function isMatchableMemberAccount(user: MatchableAccount): boolean {
  return isConnectableMemberAccount(user)
    && hasMatchingTrustBaseline(user)
    && user.declineAlgorithmicMatching !== true
    && user.allowSensitiveMatching === true
    && user.specialCategoryConsentWithdrawnAt == null;
}

export function isPublicMemberEligible(user: PublicMemberAccount): boolean {
  return isEligibleVisibleMemberAccount(user)
    && (user.profileVisibility === Visibility.PUBLIC || user.profileVisibility === Visibility.REGISTERED);
}

const visibleMemberBaseWhere: Prisma.UserWhereInput = {
  deletedAt: null,
  inactiveAt: null,
  isAdmin: false,
  isSuspended: false,
  isEmailVerified: true,
  isRegistrationPending: false,
  processingRestricted: false,
  termsAcceptedAt: { not: null },
  onboardingState: { is: { lastStageCompleted: { gte: 6 } } },
  email: { notIn: [...PLATFORM_ADMIN_EMAILS] },
  name: { not: '_pending_' },
  NOT: NON_PUBLIC_TEST_EMAIL_DOMAINS.map((domain) => ({ email: { endsWith: domain } })),
};

export function getHomepageRecentRegisteredUserWhereInput(extra?: Prisma.UserWhereInput): Prisma.UserWhereInput {
  const base: Prisma.UserWhereInput = {
    deletedAt: null,
    inactiveAt: null,
    isAdmin: false,
    isSuspended: false,
    isEmailVerified: true,
    isRegistrationPending: false,
    processingRestricted: false,
    termsAcceptedAt: { not: null },
    email: { notIn: [...PLATFORM_ADMIN_EMAILS] },
    name: { not: '_pending_' },
    NOT: NON_PUBLIC_TEST_EMAIL_DOMAINS.map((domain) => ({ email: { endsWith: domain } })),
    profileVisibility: { in: [Visibility.PUBLIC, Visibility.REGISTERED] },
  };

  return extra ? { AND: [base, extra] } : base;
}

export function getPublicMemberWhereInput(extra?: Prisma.UserWhereInput): Prisma.UserWhereInput {
  const base: Prisma.UserWhereInput = {
    ...visibleMemberBaseWhere,
    profileVisibility: { in: [Visibility.PUBLIC, Visibility.REGISTERED] },
  };

  return extra ? { AND: [base, extra] } : base;
}

export function getConnectableMemberWhereInput(extra?: Prisma.UserWhereInput): Prisma.UserWhereInput {
  const base: Prisma.UserWhereInput = {
    ...visibleMemberBaseWhere,
    availability: { not: Availability.AWAY },
    functionalProfile: { is: { availabilityMode: { notIn: [AvailabilityMode.RESTING, AvailabilityMode.REFLECTING] } } },
  };

  return extra ? { AND: [base, extra] } : base;
}

// Candidate-side mirror of hasMatchingTrustBaseline (AUDIT-20260611-007). Each
// string field must be non-null and non-empty; the context signal is an OR over
// organization/website/socialLinks. A nullable string is "present" only when it
// satisfies BOTH `{ not: null }` (Prisma `not` otherwise includes nulls) and
// `{ not: '' }`. socialLinks counts when the column is not SQL NULL
// (`Prisma.DbNull`) — registration writers persist it only when real links
// exist, so this matches the runtime predicate's `!= null` check.
//
// Built lazily inside the getter (not a module-level const) so the `Prisma.DbNull`
// value is read only when called — modules that import this file but mock
// `@/lib/prisma` without the `Prisma` namespace must not crash at import time.
const presentString = (field: keyof Prisma.UserWhereInput): Prisma.UserWhereInput => ({
  AND: [{ [field]: { not: null } }, { [field]: { not: '' } }],
});

function matchingTrustBaselineWhere(): Prisma.UserWhereInput {
  return {
    AND: [
      presentString('profilePhoto'),
      presentString('bio'),
      {
        OR: [
          presentString('organizationName'),
          presentString('website'),
          { socialLinks: { not: Prisma.DbNull } },
        ],
      },
    ],
  };
}

export function getMatchableMemberWhereInput(extra?: Prisma.UserWhereInput): Prisma.UserWhereInput {
  const matchingConsentWhere: Prisma.UserWhereInput = {
    declineAlgorithmicMatching: false,
    allowSensitiveMatching: true,
    specialCategoryConsentWithdrawnAt: null,
  };

  const base = getConnectableMemberWhereInput();
  const clauses: Prisma.UserWhereInput[] = [base, matchingConsentWhere, matchingTrustBaselineWhere()];
  return extra ? { AND: [...clauses, extra] } : { AND: clauses };
}

export function getPublicOfferOwnerWhereInput(extra?: Prisma.UserWhereInput): Prisma.UserWhereInput {
  return getPublicMemberWhereInput({
    declineAlgorithmicMatching: false,
    ...extra,
  });
}

export function getAvailablePublicOfferOwnerWhereInput(extra?: Prisma.UserWhereInput): Prisma.UserWhereInput {
  return getPublicOfferOwnerWhereInput({
    functionalProfile: { is: { availabilityMode: { notIn: ['RESTING', 'REFLECTING'] } } },
    ...extra,
  });
}
