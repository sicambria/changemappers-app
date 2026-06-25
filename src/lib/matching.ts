import type { User, UserSkill, UserValue, Archetype } from '@/lib/prisma';

interface MatchUser extends User {
    skills: UserSkill[];
    values: UserValue[];
    archetypes: Archetype[];
    offers?: string[]; // Derived
    needs?: string[]; // Derived
}

/**
 * Calculate match percentage between two users based on:
 * 1. Values (Shared values) - 40%
 * 2. Exchange (Offer matches Need) - 40%
 * 3. Location (Distance) - 10%
 * 4. Interests/Skills overlap - 10%
 */
export function calculateMatchScore(userA: MatchUser, userB: MatchUser): number {
    let score = 0;
    const weights = {
        values: 40,
        exchange: 40,
        location: 10,
        general: 10
    };

    // 1. Values Overlap
    const valuesA = userA.values.map(v => v.value);
    const valuesB = userB.values.map(v => v.value);
    const sharedValues = valuesA.filter(v => valuesB.includes(v));

    if (valuesA.length > 0 && valuesB.length > 0) {
        const valueOverlap = sharedValues.length / Math.max(valuesA.length, valuesB.length);
        score += valueOverlap * weights.values;
    }

    // 2. Exchange (A offers what B needs OR B offers what A needs)
    const offersA = userA.skills.filter(s => s.skillType === 'OFFERED').map(s => s.skill);
    const needsA = new Set(userA.skills.filter(s => s.skillType === 'SEEKING').map(s => s.skill));

    const offersB = userB.skills.filter(s => s.skillType === 'OFFERED').map(s => s.skill);
    const needsB = new Set(userB.skills.filter(s => s.skillType === 'SEEKING').map(s => s.skill));

    const matchAtoB = offersA.filter(o => needsB.has(o)).length;
    const matchBtoA = offersB.filter(o => needsA.has(o)).length;

    if (matchAtoB > 0 || matchBtoA > 0) {
        // Boost if exchange is possible
        // Calculate strength relative to total needs? 
        // Simple logic: if at least 1 match, give 50% of weight. If more, 100%.
        const exchangeStrength = Math.min((matchAtoB + matchBtoA), 3) / 3;
        score += exchangeStrength * weights.exchange;
    }

    // 3. Location (Haversine)
    if (userA.latitude && userA.longitude && userB.latitude && userB.longitude) {
        const dist = getDistanceFromLatLonInKm(userA.latitude, userA.longitude, userB.latitude, userB.longitude);
        if (dist < 10) score += weights.location; // < 10km
        else if (dist < 50) score += weights.location * 0.5; // < 50km
    } else if (userA.city === userB.city) {
        score += weights.location; // Same city fallback
    } else if (userA.isRemoteCapable && userB.isRemoteCapable) {
        score += weights.location * 0.8; // Remote compatible
    }

    // 4. General Compatibility (Archetype, Journey Stage - optional logic)
    // For now, simple overlap of general skills
    const skillsA = userA.skills.filter(s => s.skillType === 'EXPERIENCE').map(s => s.skill);
    const skillsB = new Set(userB.skills.filter(s => s.skillType === 'EXPERIENCE').map(s => s.skill));
    const skillOverlap = skillsA.filter(s => skillsB.has(s)).length;

    if (skillOverlap > 0) {
        score += (seed => Math.min(seed, 5) / 5)(skillOverlap) * weights.general;
    }

    return Math.round(score);
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);  // deg2rad below
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}

/** Archetype → [primary, secondary] community-type affinities (Archetype matrix). */
const PRIMARY_ARCHETYPE_MATCHES: Record<string, string[]> = {
    MYCELIUM: ['INCLUSIVE_SUPPORT_NETWORK', 'EARTH_REGENERATION_CENTER'],
    KEYSTONE: ['VISIONARY_MODEL_CITY', 'EARTH_REGENERATION_CENTER'],
    POLLINATOR: ['NOMADIC_NETWORK', 'REGENERATIVE_ECONOMIC'],
    PRISM: ['CREATIVE_ARTS_COLONY', 'KNOWLEDGE_HUB'],
    COMPOST: ['HEALING_SANCTUARY', 'INCLUSIVE_SUPPORT_NETWORK'],
    SENTINEL: ['REGENERATIVE_ECONOMIC', 'KNOWLEDGE_HUB'],
    ALCHEMIST: ['EGALITARIAN_LIVING', 'NATURE_CONNECTED_ECO_HUB'],
    CANOPY: ['HEALING_SANCTUARY', 'SPIRITUAL_HAVEN'],
    SPARK: ['FRONTLINE_ACTIVIST', 'EGALITARIAN_LIVING'],
    ECHO: ['KNOWLEDGE_HUB', 'SPIRITUAL_HAVEN'],
    TIDE: ['FRONTLINE_ACTIVIST', 'VISIONARY_MODEL_CITY'],
    HORIZON: ['VISIONARY_MODEL_CITY', 'CREATIVE_ARTS_COLONY'],
};

type CommunityMatchTarget = { type: string; latitude?: number | null; longitude?: number | null; city?: string | null };

/** Best archetype affinity (0–1) the user has for the community's type. */
function archetypeAffinity(archetypes: string[] | null | undefined, communityType: string): number {
    let boost = 0;
    if (archetypes?.length) {
        for (const arch of archetypes) {
            const matches = PRIMARY_ARCHETYPE_MATCHES[arch] || [];
            if (matches[0] === communityType) boost = Math.max(boost, 1); // Primary Match
            else if (matches[1] === communityType) boost = Math.max(boost, 0.7); // Secondary Match
            else boost = Math.max(boost, 0.2); // Base interest
        }
    }
    return boost;
}

/** Location contribution (0–`weight`): distance bands, same-city fallback, or nomadic-network leniency. */
function locationContribution(user: MatchUser, community: CommunityMatchTarget, weight: number): number {
    if (user.latitude && user.longitude && community.latitude && community.longitude) {
        const dist = getDistanceFromLatLonInKm(user.latitude, user.longitude, community.latitude, community.longitude);
        if (dist < 10) return weight; // < 10km
        if (dist < 50) return weight * 0.5; // < 50km
        return 0;
    }
    if (user.city != null && user.city === community.city) return weight; // Same city fallback
    // Virtual/nomadic networks: distance doesn't matter much.
    if (community.type === 'NOMADIC_NETWORK') return weight * 0.8;
    return 0;
}

/**
 * Calculate match percentage between a user and a community.
 * Uses the Archetype matrix to define Primary and Secondary matches.
 */
export function calculateCommunityMatchScore(user: MatchUser, community: CommunityMatchTarget): number {
    const weights = { archetypeMatch: 60, location: 40 };
    const score =
        archetypeAffinity(user.archetypes, community.type) * weights.archetypeMatch +
        locationContribution(user, community, weights.location);
    return Math.round(score);
}
