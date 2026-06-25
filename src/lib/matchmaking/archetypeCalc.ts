import { Archetype, NetworkRole, DecisionMakingType, ResourceSharingType, SocialIntimacyType } from '@/lib/prisma';

interface ArchetypeAnswers {
    roles: NetworkRole[];
    internalExternal: number; // 1 (Physical/Activism) to 10 (Inner Work)
    secularSpiritual: number; // 1 (Rational) to 10 (Spiritual)
    decisionMaking: DecisionMakingType | 'ANARCHY' | null;
    resourceSharing: ResourceSharingType | null;
    comfortLevel: number; // 1 (Nomadic) to 10 (Modern Comfort)
    socialIntimacy: SocialIntimacyType | null;
}

function scoreRoles(scores: Record<string, number>, roles: NetworkRole[]): void {
    if (roles.includes('WEAVER')) {
        scores.MYCELIUM += 3; scores.POLLINATOR += 3; scores.ECHO += 2; scores.PRISM += 1;
    }
    if (roles.includes('BUILDER')) {
        scores.KEYSTONE += 3; scores.HORIZON += 3; scores.SENTINEL += 2; scores.PRISM += 2;
    }
    if (roles.includes('CAREGIVER')) {
        scores.CANOPY += 3; scores.COMPOST += 3; scores.MYCELIUM += 2; scores.ECHO += 1;
    }
    if (roles.includes('EXPERIMENTER')) {
        scores.ALCHEMIST += 3; scores.POLLINATOR += 2; scores.HORIZON += 2; scores.PRISM += 1;
    }
    if (roles.includes('CATALYST')) { // Assuming CATALYST = Activator
        scores.SPARK += 4; scores.TIDE += 3; scores.COMPOST += 1;
    }
}

function scoreInternalExternal(scores: Record<string, number>, value: number): void {
    if (value <= 4) {
        scores.SPARK += 2; scores.TIDE += 2; scores.ALCHEMIST += 2; scores.MYCELIUM += 1;
    } else if (value >= 7) {
        scores.COMPOST += 3; scores.CANOPY += 2; scores.ECHO += 2; scores.KEYSTONE += 1;
    }
}

function scoreSecularSpiritual(scores: Record<string, number>, value: number): void {
    if (value <= 4) {
        scores.SENTINEL += 4; scores.TIDE += 2; scores.PRISM += 1;
    } else if (value >= 7) {
        scores.ECHO += 3; scores.CANOPY += 2; scores.COMPOST += 2;
    }
}

function scoreDecisionMaking(scores: Record<string, number>, dm: ArchetypeAnswers['decisionMaking']): void {
    if (dm === 'HIERARCHICAL') {
        scores.SENTINEL += 2; scores.TIDE += 3; scores.KEYSTONE += 2;
    } else if (dm === 'SOCIOCRATIC') {
        scores.HORIZON += 2; scores.KEYSTONE += 2; scores.ALCHEMIST += 1; scores.POLLINATOR += 1;
    } else if (dm === 'CONSENSUS' || dm === 'ANARCHY') {
        scores.MYCELIUM += 3; scores.SPARK += 2; scores.CANOPY += 1; scores.COMPOST += 2;
    }
}

function scoreResourceSharing(scores: Record<string, number>, rs: ResourceSharingType | null): void {
    if (rs === 'SHARED_TREASURY') {
        scores.CANOPY += 3; scores.MYCELIUM += 2; scores.COMPOST += 2;
    } else if (rs === 'CONTRIBUTION') {
        scores.ALCHEMIST += 2; scores.KEYSTONE += 1; scores.HORIZON += 1;
    } else if (rs === 'PRIVATE') {
        scores.POLLINATOR += 2; scores.PRISM += 2; scores.SENTINEL += 1;
    }
}

function scoreComfortLevel(scores: Record<string, number>, value: number): void {
    if (value <= 4) {
        scores.POLLINATOR += 3; scores.ALCHEMIST += 2; scores.SPARK += 2; scores.MYCELIUM += 1;
    } else if (value >= 7) {
        scores.SENTINEL += 2; scores.PRISM += 2; scores.KEYSTONE += 1;
    }
}

function scoreSocialIntimacy(scores: Record<string, number>, si: SocialIntimacyType | null): void {
    if (si === 'RADICAL_TRANSPARENCY') {
        scores.COMPOST += 3; scores.CANOPY += 3; scores.ECHO += 1;
    } else if (si === 'CAMARADERIE') {
        scores.MYCELIUM += 2; scores.ALCHEMIST += 2; scores.TIDE += 1;
    } else if (si === 'PROFESSIONAL') {
        scores.SENTINEL += 3; scores.PRISM += 2; scores.HORIZON += 1;
    }
}

function pickBestArchetype(scores: Record<string, number>): Archetype {
    let bestArchetype: Archetype = 'MYCELIUM';
    let maxScore = -1;
    for (const [arch, score] of Object.entries(scores)) {
        if ((score ?? 0) > maxScore) {
            maxScore = score ?? 0;
            bestArchetype = arch as Archetype;
        }
    }
    return bestArchetype;
}

export function calculateArchetypes(answers: ArchetypeAnswers): Archetype {
    // Basic heuristic scoring system based on ARCHETYPES.md
    // Only EXTRA (quiz) archetypes are scored here; BASE archetypes are user-selected separately.
    // We use Record<string, number> so dot-access is always number, not number|undefined.
    const scores: Record<string, number> = {
        MYCELIUM: 0, KEYSTONE: 0, POLLINATOR: 0, PRISM: 0,
        COMPOST: 0, SENTINEL: 0, ALCHEMIST: 0, CANOPY: 0,
        SPARK: 0, ECHO: 0, TIDE: 0, HORIZON: 0
    };

    scoreRoles(scores, answers.roles);
    scoreInternalExternal(scores, answers.internalExternal);
    scoreSecularSpiritual(scores, answers.secularSpiritual);
    scoreDecisionMaking(scores, answers.decisionMaking);
    scoreResourceSharing(scores, answers.resourceSharing);
    scoreComfortLevel(scores, answers.comfortLevel);
    scoreSocialIntimacy(scores, answers.socialIntimacy);

    return pickBestArchetype(scores);
}
