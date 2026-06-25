/**
 * Per-modality scoring functions for the developmental modalities.
 * All functions return a score 0–100.
 *
 * Critical rules:
 * - Availability gate applied first (RESTING/REFLECTING = 0 score, excluded before calling)
 * - Archetype complementarity is always a factor but NOT always primary
 * - Coaching: domain expertise explicitly scores 0 points
 * - Peer support: situational resonance is primary; domain expertise irrelevant
 */

import { getArchetypeComplementarityScore } from './complementarity';

interface BaseCandidate {
  archetypes: string[];
}

interface TrainingMatchInput {
  offerDomain: string;
  offerFormat: string;
  offerLevel: string;
  offerArchetypes: string[];
  requestDomain: string;
  requestFormatPreference: string | null;
  requestLevelPreference: string | null;
  requestArchetypes: string[];
}

interface MentoringMatchInput {
  mentorDomain: string;
  mentorYearsExperience: number;
  mentorArcLengthPreference: string;
  mentorArchetypes: string[];
  requestDomain: string;
  requestArcLength: string | null;
  requestArchetypes: string[];
}

interface PeerSupportMatchInput {
  offerSituationsNavigated: string[];
  offerFormat: string;
  offerArchetypes: string[];
  requestSituationType: string;
  requestFormat: string | null;
  requestArchetypes: string[];
}

interface CoachingMatchInput {
  offerStyle: string;
  offerFormat: string;
  offerArchetypes: string[];
  requestFormatPreference: string | null;
  requestArchetypes: string[];
  // Note: domain expertise is intentionally absent from this interface
}

interface ContributionMatchInput {
  offerType: string;
  offerDomain: string | null;
  offerArchetypes: string[];
  requestType: string;
  requestDomain: string | null;
  requestArchetypes: string[];
}

function domainOverlapScore(domainA: string, domainB: string): number {
  if (!domainA || !domainB) return 0;
  const a = domainA.toLowerCase().trim();
  const b = domainB.toLowerCase().trim();
  if (a === b) return 1;
  // Simple partial match: shared words
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

/**
 * Training match score (0–100).
 * Domain 40 + Format 20 + Level fit 20 + Archetype complementarity 20
 */
export function scoreTrainingMatch(input: TrainingMatchInput): number {
  const domainScore = domainOverlapScore(input.offerDomain, input.requestDomain) * 40;

  const formatScore =
    !input.requestFormatPreference ||
    input.offerFormat === input.requestFormatPreference
      ? 20
      : 0;

  let levelScore = 0;
  if (input.requestLevelPreference) {
    const levels = ['BEGINNER', 'PARTIAL', 'ADVANCED'];
    const offerIdx = levels.indexOf(input.offerLevel);
    const reqIdx = levels.indexOf(input.requestLevelPreference);
    const delta = offerIdx - reqIdx;
    if (delta === 0) levelScore = 20;       // exact match
    else if (delta === 1) levelScore = 15;  // one step above (ideal)
    else if (delta === -1) levelScore = 8;  // one step below (too basic)
    // otherwise levelScore stays 0 (initialised above)
  } else {
    levelScore = 10; // neutral
  }

  const archetypeScore =
    getArchetypeComplementarityScore(input.offerArchetypes, input.requestArchetypes) * 20;

  return Math.round(domainScore + formatScore + levelScore + archetypeScore);
}

/**
 * Mentoring match score (0–100).
 * Domain 35 + Experience asymmetry 25 + Archetype 25 + Arc length 15
 */
export function scoreMentoringMatch(input: MentoringMatchInput): number {
  const domainScore = domainOverlapScore(input.mentorDomain, input.requestDomain) * 35;

  // Experience asymmetry: higher delta (up to ~15 yrs) = better; diminishing returns after that
  const expDelta = input.mentorYearsExperience;
  let expScore = 0;
  if (expDelta >= 3 && expDelta <= 15) expScore = 25;
  else if (expDelta > 15) expScore = Math.max(5, 25 - (expDelta - 15));
  else if (expDelta >= 1) expScore = 10;

  const archetypeScore =
    getArchetypeComplementarityScore(input.mentorArchetypes, input.requestArchetypes) * 25;

  const arcLengthScore =
    !input.requestArcLength ||
    input.mentorArcLengthPreference === input.requestArcLength
      ? 15
      : 5;

  return Math.round(domainScore + expScore + archetypeScore + arcLengthScore);
}

/**
 * Peer support match score (0–100).
 * Situational resonance 50 + Format 25 + Archetype 15 (lower weight — horizontal)
 * Domain expertise is intentionally NOT a factor.
 */
export function scorePeerSupportMatch(input: PeerSupportMatchInput): number {
  // Situational resonance: has the supporter navigated something similar?
  const reqSituation = input.requestSituationType.toLowerCase();
  const hasResonance = input.offerSituationsNavigated.some(s =>
    s.toLowerCase().includes(reqSituation) ||
    reqSituation.includes(s.toLowerCase()),
  );
  const situationScore = hasResonance ? 50 : 10;

  const formatScore =
    !input.requestFormat || input.offerFormat === input.requestFormat ? 25 : 5;

  const archetypeScore =
    getArchetypeComplementarityScore(input.offerArchetypes, input.requestArchetypes) * 15;

  return Math.round(situationScore + formatScore + archetypeScore);
}

/**
 * Coaching match score (0–100).
 * Style 50 + Format 30 + Archetype 20
 * Domain expertise = 0 points. Enforced by not including it here.
 */
export function scoreCoachingMatch(input: CoachingMatchInput): number {
  // Style compatibility: partial match on style keywords
  let styleScore: number;
  if (!input.requestFormatPreference) {
    styleScore = 25; // neutral
  } else if (
    input.offerStyle.toLowerCase().includes(input.requestFormatPreference.toLowerCase()) ||
    input.requestFormatPreference.toLowerCase().includes(input.offerStyle.toLowerCase())
  ) {
    styleScore = 50;
  } else {
    styleScore = 10;
  }

  const formatScore =
    !input.requestFormatPreference || input.offerFormat === input.requestFormatPreference
      ? 30
      : 5;

  const archetypeScore =
    getArchetypeComplementarityScore(input.offerArchetypes, input.requestArchetypes) * 20;

  return Math.round(styleScore + formatScore + archetypeScore);
}

/**
 * Contribution match score (0–100).
 * Archetype complementarity 40 (PRIMARY) + Type alignment 30 + Domain complement 20 + Availability 10
 */
export function scoreContributionMatch(
  input: ContributionMatchInput & { offerAvailabilityMode: string },
): number {
  const archetypeScore =
    getArchetypeComplementarityScore(input.offerArchetypes, input.requestArchetypes) * 40;

  const typeScore = input.offerType === input.requestType ? 30 : 0;

  const domainScore =
    input.offerDomain && input.requestDomain
      ? domainOverlapScore(input.offerDomain, input.requestDomain) * 20
      : 0;

  // BUILDING and BETWEEN get a slight boost over DELIVERING (actively available)
  const availabilityBoost =
    input.offerAvailabilityMode === 'BUILDING' ||
    input.offerAvailabilityMode === 'BETWEEN'
      ? 10
      : 5;

  return Math.round(archetypeScore + typeScore + domainScore + availabilityBoost);
}

export type {
  BaseCandidate,
  TrainingMatchInput,
  MentoringMatchInput,
  PeerSupportMatchInput,
  CoachingMatchInput,
  ContributionMatchInput,
};
