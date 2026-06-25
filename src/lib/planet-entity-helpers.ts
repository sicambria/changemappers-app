import type { MapEntity } from '@/app/actions/map';
import { ALL_ARCHETYPES as PROFILE_ARCHETYPES } from '@/lib/profile-options';

// ─── Filter types ────────────────────────────────────────────────────────────
export type MarkerType = 'individual' | 'community' | 'event' | 'issue' | 'signal';
export const ALL_MARKER_TYPES: MarkerType[] = ['individual', 'community', 'event', 'issue', 'signal'];

export type PlanetFilterKey =
    | 'archetypes'
    | 'rdgs'
    | 'communityTypes'
    | 'changemakeLevels'
    | 'skills'
    | 'offers'
    | 'needs'
    | 'values'
    | 'availability'
    | 'tags';

export type FilterOption = { value: string; label: string };
export type LocalizedFilterOption = FilterOption & { labelHu?: string; labelEs?: string };
export type ActiveStringSet = Set<string>;
export type AdvancedPlanetFilterKey = Exclude<PlanetFilterKey, 'archetypes' | 'rdgs'>;

// Archetype labels — short display names for the internal enum values
export const ARCHETYPE_LABELS: Record<string, string> = {
    MYCELIUM: 'Mycelium',
    POLLINATOR: 'Pollinator',
    SENTINEL: 'Sentinel',
    ECHO: 'Echo',
    CANOPY: 'Canopy',
    ALCHEMIST: 'Alchemist',
    SPARK: 'Spark',
    HORIZON: 'Horizon',
    // Legacy enum values from user.ts
    LOCAL_PRACTITIONER: 'Local Practitioner',
    NETWORK_WEAVER: 'Network Weaver',
    INSTITUTIONAL_CHANGEMAKER: 'Institutional Changemaker',
    GLOBAL_AMPLIFIER: 'Global Amplifier',
    RESOURCE_MOBILIZER: 'Resource Mobilizer',
    INNOVATION_CATALYST: 'Innovation Catalyst',
    SYSTEM_DISRUPTOR: 'System Disruptor',
    STRATEGIC_ADVISOR: 'Strategic Advisor',
};

export const ALL_ARCHETYPES = PROFILE_ARCHETYPES.map((archetype) => archetype.value);

// Derive RDG list - numbers 1-30 matching questionnaires.ts
export const ALL_RDGS = Array.from({ length: 30 }, (_, i) => String(i + 1));

export const CHANGEMAKE_LEVEL_OPTIONS = Array.from({ length: 9 }, (_, index) => {
    const level = index + 1;
    return { value: `LEVEL_${level}`, labelKey: `filters.changemakeLevel.level${level}` };
});

export const COMMUNITY_TYPE_OPTIONS = [
    { value: 'NATURE_CONNECTED_ECO_HUB', labelKey: 'filters.communityType.natureConnectedEcoHub' },
    { value: 'HEALING_SANCTUARY', labelKey: 'filters.communityType.healingSanctuary' },
    { value: 'INCLUSIVE_SUPPORT_NETWORK', labelKey: 'filters.communityType.inclusiveSupportNetwork' },
    { value: 'CREATIVE_ARTS_COLONY', labelKey: 'filters.communityType.creativeArtsColony' },
    { value: 'EGALITARIAN_LIVING', labelKey: 'filters.communityType.egalitarianLiving' },
    { value: 'SPIRITUAL_HAVEN', labelKey: 'filters.communityType.spiritualHaven' },
    { value: 'KNOWLEDGE_HUB', labelKey: 'filters.communityType.knowledgeHub' },
    { value: 'NOMADIC_NETWORK', labelKey: 'filters.communityType.nomadicNetwork' },
    { value: 'REGENERATIVE_ECONOMIC', labelKey: 'filters.communityType.regenerativeEconomic' },
    { value: 'VISIONARY_MODEL_CITY', labelKey: 'filters.communityType.visionaryModelCity' },
    { value: 'EARTH_REGENERATION_CENTER', labelKey: 'filters.communityType.earthRegenerationCenter' },
    { value: 'FRONTLINE_ACTIVIST', labelKey: 'filters.communityType.frontlineActivist' },
    { value: 'OTHER', labelKey: 'filters.communityType.other' },
];

export const ADVANCED_PLANET_FILTER_KEYS: AdvancedPlanetFilterKey[] = [
    'communityTypes',
    'changemakeLevels',
    'skills',
    'offers',
    'needs',
    'values',
    'availability',
    'tags',
];

/** Groups individual points geographically. Points within `thresholdDeg` of a cluster's
 *  first member are merged. Returns centroid lat/lng + all member entities. */
export function clusterIndividuals<T extends { lat: number; lng: number; id: string }>(
    points: T[],
    thresholdDeg = 0.8,
): Array<{ id: string; lat: number; lng: number; entities: T[] }> {
    const assigned = new Set<string>();
    const clusters: Array<{ id: string; lat: number; lng: number; entities: T[] }> = [];
    for (const p of points) {
        if (assigned.has(p.id)) continue;
        const group = points.filter(
            q => !assigned.has(q.id) &&
                Math.abs(q.lat - p.lat) < thresholdDeg &&
                Math.abs(q.lng - p.lng) < thresholdDeg,
        );
        group.forEach(q => assigned.add(q.id));
        const lat = group.reduce((s, q) => s + q.lat, 0) / group.length;
        const lng = group.reduce((s, q) => s + q.lng, 0) / group.length;
        clusters.push({ id: p.id, lat, lng, entities: group });
    }
    return clusters;
}

// Extract RDG number prefix for a compact badge, e.g. "1_CLIMATE_RESILIENCE" → "RDG 1"
export function rdgLabel(rdg: string): string {
    const match = /^(\d+)/.exec(rdg);
    return match ? `RDG ${match[1]}` : rdg;
}

export function entityTypeLabel(entity: MapEntity, t: (key: string) => string): string {
    if (entity.type === 'individual') return t('layers.individuals');
    if (entity.type === 'community') return t('layers.communities');
    if (entity.type === 'event') return t('layers.events');
    if (entity.type === 'issue') return t('layers.issues');
    return t('layers.signals');
}

export function entityDetailHref(entity: MapEntity): string {
    if (entity.type === 'community') return `/communities/${entity.id}`;
    if (entity.type === 'event') return `/events/${entity.id}`;
    if (entity.type === 'issue') return `/social-issues/${entity.id}`;
    if (entity.type === 'signal') return `/signals/${entity.id}`;
    return `/profile/${entity.id}`;
}

export function entityDetailActionLabel(entity: MapEntity, t: (key: string) => string): string {
    if (entity.type === 'community') return t('preview.viewCommunity');
    if (entity.type === 'event') return t('preview.viewEvent');
    if (entity.type === 'issue') return t('preview.viewIssue');
    if (entity.type === 'signal') return t('preview.viewSignal');
    return t('preview.viewProfile');
}

export function formatCoordinate(value: number | null | undefined): string | null {
    return typeof value === 'number' ? value.toFixed(3) : null;
}

export function compactList(values: string[] | undefined, limit = 6): string[] {
    return (values ?? []).filter(Boolean).slice(0, limit);
}

export function entityPointColor(type: MapEntity['type']): string {
    if (type === 'community') return '#facc15';
    if (type === 'event') return '#f43f5e';
    if (type === 'issue') return '#ef4444';
    if (type === 'signal') return '#a855f7';
    return '#38bdf8';
}

export function entityPointSize(type: MapEntity['type']): number {
    if (type === 'community') return 0.8;
    if (type === 'event') return 0.6;
    if (type === 'issue') return 0.7;
    if (type === 'signal') return 0.55;
    return 0.6;
}

export function createEmptyAdvancedFilters(): Record<AdvancedPlanetFilterKey, Set<string>> {
    return Object.fromEntries(
        ADVANCED_PLANET_FILTER_KEYS.map((key) => [key, new Set([] as string[])]),
    ) as Record<AdvancedPlanetFilterKey, Set<string>>;
}

export function uniqueOptions(values: (string | null | undefined)[]): FilterOption[] {
    return [...new Set(values.filter((value): value is string => Boolean(value)))]
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value }));
}

export function mergeOptions(primary: FilterOption[], extras: FilterOption[]): FilterOption[] {
    const seen = new Set<string>();
    return [...primary, ...extras].filter((option) => {
        const key = option.value.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export function localizedFilterLabel(option: LocalizedFilterOption, language: string): string {
    if (language === 'hu' && option.labelHu) return option.labelHu;
    if (language === 'es' && option.labelEs) return option.labelEs;
    return option.label;
}

export function matchesAny(values: (string | null | undefined)[], activeValues: ActiveStringSet): boolean {
    if (activeValues.size === 0) return true;
    const comparableValues = new Set(values
        .filter((value): value is string => Boolean(value))
        .map((value) => value.toLowerCase()));
    return [...activeValues].some((activeValue) => comparableValues.has(activeValue.toLowerCase()));
}

export function matchesRdgFilter(rdgs: string[] | undefined, activeRdgs: ActiveStringSet): boolean {
    if (activeRdgs.size === 0) return true;
    return (rdgs ?? []).some((rdg) => {
        const numberPrefix = /^(?:RDG)?(\d+)/i.exec(rdg)?.[1];
        return Boolean(numberPrefix && activeRdgs.has(numberPrefix));
    });
}

export function availabilityGroups(availabilityDetails: unknown): Array<[string, string[]]> {
    if (!availabilityDetails || typeof availabilityDetails !== 'object' || Array.isArray(availabilityDetails)) return [];

    return Object.entries(availabilityDetails as Record<string, unknown>)
        .map(([group, value]) => {
            if (!Array.isArray(value)) return [group, []] as [string, string[]];
            const items = value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
            return [group, items] as [string, string[]];
        })
        .filter(([, items]) => items.length > 0);
}

export function availabilityValues(availabilityDetails: unknown): string[] {
    return availabilityGroups(availabilityDetails).flatMap(([day, slots]) =>
        slots.map((slot) => `${day}-${slot}`),
    );
}
