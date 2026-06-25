/**
 * Pure readiness gates for `completeMatchingActivationAction` (Step 6 of lean
 * registration). Extracted verbatim from the action's prior inline validation
 * so the matching-activation decision now reads as named steps without changing
 * behaviour: each gate is a named boolean predicate and the evaluator returns
 * the FIRST failing gate's error key (or `null` when every gate passes),
 * preserving the original short-circuit precedence exactly.
 *
 * Behaviour-preserving extraction — see the cyclomatic-complexity-burndown
 * TECHDEBT plan under docs/plans (2026-06).
 */

import { LEGAL_VERSIONS } from '@/lib/legal-versions';

/** Minimal shape of the `prisma.user.findUnique` select the gates read. */
export interface MatchingReadiness {
    archetypes: string[] | null;
    skills: { skill: string; skillType: string }[] | null;
    mainCauses: { id: string }[] | null;
    onboardingState: { charterVersion: string | null; lastStageCompleted: number | null } | null;
    profilePhoto: string | null;
    bio: string | null;
    organizationName: string | null;
    website: string | null;
    socialLinks: unknown;
    functionalProfile: {
        availabilityMode: string | null;
        contributionSeedType: string | null;
        contributionSeedText: string | null;
        rdgMain: string[] | null;
        rdgInterested: string[] | null;
    } | null;
}

/** True when at least one social link holds a non-empty string value. */
function hasNonEmptySocialLink(socialLinks: unknown): boolean {
    if (typeof socialLinks !== 'object' || socialLinks === null) return false;
    return Object.values(socialLinks as Record<string, unknown>).some(
        (value) => typeof value === 'string' && value.trim().length > 0,
    );
}

/** Photo + a >=20-char bio + at least one org/website/social-link trust anchor. */
export function hasTrustSignal(r: MatchingReadiness): boolean {
    return Boolean(r.profilePhoto)
        && Boolean(r.bio && r.bio.trim().length >= 20)
        && (Boolean(r.organizationName?.trim())
            || Boolean(r.website?.trim())
            || hasNonEmptySocialLink(r.socialLinks));
}

/** Onboarding reached at least stage 2 (the profile-trust stage). */
export function hasReachedTrustStage(r: MatchingReadiness): boolean {
    return (r.onboardingState?.lastStageCompleted ?? 0) >= 2;
}

/** Accepted the current charter version. */
export function hasAcceptedCurrentCharter(r: MatchingReadiness): boolean {
    return r.onboardingState?.charterVersion === LEGAL_VERSIONS.charter;
}

/** A typed contribution seed with >=10 chars of text. */
export function hasContributionSeed(r: MatchingReadiness): boolean {
    const fp = r.functionalProfile;
    return Boolean(fp?.contributionSeedType)
        && Boolean(fp?.contributionSeedText)
        && (fp?.contributionSeedText?.trim().length ?? 0) >= 10;
}

/** Between 1 and 3 role-label archetypes. */
export function hasValidArchetypeCount(r: MatchingReadiness): boolean {
    const count = r.archetypes?.length ?? 0;
    return count >= 1 && count <= 3;
}

function countSkills(r: MatchingReadiness, skillType: string): number {
    return (r.skills ?? []).filter(
        (s) => s.skillType === skillType && s.skill.trim().length > 0,
    ).length;
}

/** At least 2 non-blank OFFERED skills. */
export function hasMinimumOffers(r: MatchingReadiness): boolean {
    return countSkills(r, 'OFFERED') >= 2;
}

/** At least 2 non-blank SEEKING skills. */
export function hasMinimumNeeds(r: MatchingReadiness): boolean {
    return countSkills(r, 'SEEKING') >= 2;
}

/** A main cause or any active/interested RDG domain. */
export function hasCauseSignal(r: MatchingReadiness): boolean {
    const fp = r.functionalProfile;
    const causeCount = r.mainCauses?.length ?? 0;
    const rdgMainCount = fp?.rdgMain?.length ?? 0;
    const rdgInterestedCount = fp?.rdgInterested?.length ?? 0;
    return causeCount > 0 || rdgMainCount > 0 || rdgInterestedCount > 0;
}

/** Offers, needs, a cause signal and a declared availability mode. */
export function hasMatchingMinimums(r: MatchingReadiness): boolean {
    return hasMinimumOffers(r)
        && hasMinimumNeeds(r)
        && hasCauseSignal(r)
        && Boolean(r.functionalProfile?.availabilityMode);
}

/**
 * Evaluate the matching-activation readiness gates in their original order and
 * return the FIRST failing gate's error key, or `null` when the profile is
 * ready. A `null` readiness (user vanished between auth and re-read) maps to the
 * trust gate exactly as the prior inline code did.
 */
export function evaluateMatchingReadiness(r: MatchingReadiness | null): string | null {
    if (!r || !hasTrustSignal(r) || !hasReachedTrustStage(r)) {
        return 'server.errors.profileTrustRequired';
    }
    if (!hasAcceptedCurrentCharter(r)) return 'server.errors.charterRequired';
    if (!hasContributionSeed(r)) return 'server.errors.contributionSeedRequired';
    if (!hasValidArchetypeCount(r)) return 'server.errors.roleLabelsRequired';
    if (!hasMatchingMinimums(r)) return 'server.errors.matchingActivationFailed';
    return null;
}
