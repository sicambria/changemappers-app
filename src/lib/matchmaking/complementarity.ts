/**
 * Archetype complementarity matrix.
 *
 * Core principle: complementary archetypes create productive friction;
 * similar archetypes create comfortable stagnation. Scores are 0.0–1.0
 * where 1.0 = high developmental complementarity.
 *
 * Same archetype = 0.2 (similarity, not complementarity — intentionally low).
 * Unknown pairs = 0.3 default (neutral, not penalizing).
 */

// BASE archetypes (functional / societal change roles)
const BASE_COMPLEMENTARITY: Record<string, Record<string, number>> = {
  LOCAL_PRACTITIONER: {
    NETWORK_WEAVER: 0.9,
    GLOBAL_AMPLIFIER: 0.7,
    RESOURCE_MOBILIZER: 0.8,
    INNOVATION_CATALYST: 0.7,
    STRATEGIC_ADVISOR: 0.6,
    SYSTEM_DISRUPTOR: 0.5,
    INSTITUTIONAL_CHANGEMAKER: 0.5,
  },
  NETWORK_WEAVER: {
    LOCAL_PRACTITIONER: 0.9,
    SYSTEM_DISRUPTOR: 0.8,
    RESOURCE_MOBILIZER: 0.7,
    INSTITUTIONAL_CHANGEMAKER: 0.7,
    INNOVATION_CATALYST: 0.6,
  },
  INSTITUTIONAL_CHANGEMAKER: {
    SYSTEM_DISRUPTOR: 0.9,
    NETWORK_WEAVER: 0.7,
    LOCAL_PRACTITIONER: 0.5,
    RESOURCE_MOBILIZER: 0.6,
    STRATEGIC_ADVISOR: 0.7,
  },
  GLOBAL_AMPLIFIER: {
    LOCAL_PRACTITIONER: 0.7,
    INSTITUTIONAL_CHANGEMAKER: 0.6,
    RESOURCE_MOBILIZER: 0.8,
  },
  RESOURCE_MOBILIZER: {
    INNOVATION_CATALYST: 0.9,
    LOCAL_PRACTITIONER: 0.8,
    NETWORK_WEAVER: 0.7,
    GLOBAL_AMPLIFIER: 0.8,
  },
  INNOVATION_CATALYST: {
    RESOURCE_MOBILIZER: 0.9,
    STRATEGIC_ADVISOR: 0.8,
    LOCAL_PRACTITIONER: 0.7,
  },
  SYSTEM_DISRUPTOR: {
    INSTITUTIONAL_CHANGEMAKER: 0.9,
    NETWORK_WEAVER: 0.8,
    STRATEGIC_ADVISOR: 0.6,
  },
  STRATEGIC_ADVISOR: {
    INNOVATION_CATALYST: 0.8,
    SYSTEM_DISRUPTOR: 0.6,
    INSTITUTIONAL_CHANGEMAKER: 0.7,
  },
};

// EXTRA archetypes (regenerative / ecological identity)
const EXTRA_COMPLEMENTARITY: Record<string, Record<string, number>> = {
  MYCELIUM: { KEYSTONE: 0.9, POLLINATOR: 0.8, SPARK: 0.7 },
  KEYSTONE: { MYCELIUM: 0.9, ALCHEMIST: 0.8, TIDE: 0.7 },
  POLLINATOR: { MYCELIUM: 0.8, PRISM: 0.7, SENTINEL: 0.6 },
  PRISM: { ALCHEMIST: 0.9, SENTINEL: 0.8, ECHO: 0.7 },
  COMPOST: { SPARK: 0.9, HORIZON: 0.8, CANOPY: 0.7 },
  SENTINEL: { PRISM: 0.8, POLLINATOR: 0.6, TIDE: 0.7 },
  ALCHEMIST: { KEYSTONE: 0.8, PRISM: 0.9, COMPOST: 0.7 },
  CANOPY: { COMPOST: 0.7, ECHO: 0.8, MYCELIUM: 0.6 },
  SPARK: { COMPOST: 0.9, TIDE: 0.8, HORIZON: 0.7 },
  ECHO: { CANOPY: 0.8, PRISM: 0.7, SENTINEL: 0.6 },
  TIDE: { SPARK: 0.8, KEYSTONE: 0.7, SENTINEL: 0.7 },
  HORIZON: { COMPOST: 0.8, SPARK: 0.7, ALCHEMIST: 0.6 },
};

/**
 * Returns the highest complementarity score between two archetype sets.
 * Uses max over all pairwise combinations — a user with multiple archetypes
 * is matched on their best complementary pairing.
 */
export function getArchetypeComplementarityScore(
  archetypesA: string[],
  archetypesB: string[],
): number {
  if (archetypesA.length === 0 || archetypesB.length === 0) {
    return 0.3; // neutral default when archetypes are unknown
  }

  let maxScore = 0;

  for (const a of archetypesA) {
    for (const b of archetypesB) {
      if (a === b) {
        // Same archetype = similarity not complementarity
        maxScore = Math.max(maxScore, 0.2);
        continue;
      }
      const baseScore =
        BASE_COMPLEMENTARITY[a]?.[b] ?? BASE_COMPLEMENTARITY[b]?.[a];
      const extraScore =
        EXTRA_COMPLEMENTARITY[a]?.[b] ?? EXTRA_COMPLEMENTARITY[b]?.[a];
      const score = baseScore ?? extraScore ?? 0.3;
      maxScore = Math.max(maxScore, score);
    }
  }

  return maxScore;
}
