export const DEFAULT_COMMONS_LICENSE = 'CC-BY-SA-4.0' as const;

export const TEMPORAL_CLASS_PRESETS = [
  { value: 'PROJECT', label: 'Project', description: 'Useful for current work, campaigns, prototypes, and near-term collaboration.' },
  { value: 'SEASONAL', label: 'Seasonal', description: 'Useful across a season of work, recurring cycles, or changing local conditions.' },
  { value: 'GENERATIONAL', label: 'Generational', description: 'Useful as long-term stewardship, lineage, or slow-change knowledge.' },
] as const;

export type TemporalClass = (typeof TEMPORAL_CLASS_PRESETS)[number]['value'];

export const TK_BC_PROTOCOL_LABELS = [
  { value: 'TK_NOTICE', label: 'TK Notice', description: 'Traditional Knowledge context is relevant; follow the named community protocol.' },
  { value: 'TK_ATTRIBUTION', label: 'TK Attribution', description: 'Attribution to the knowledge holders or community context is expected.' },
  { value: 'BC_NOTICE', label: 'BC Notice', description: 'Biocultural context is relevant; do not detach use from place and stewardship context.' },
  { value: 'BC_PROVENANCE', label: 'BC Provenance', description: 'Keep origin, lineage, and stewardship context visible when sharing.' },
] as const;

export const CONTRIBUTION_SEED_TYPES = [
  { value: 'QUESTION', label: 'Question' },
  { value: 'PERSPECTIVE', label: 'Perspective' },
  { value: 'SKILL', label: 'Skill' },
  { value: 'LOCAL_PATTERN', label: 'Local pattern' },
  { value: 'RESOURCE', label: 'Resource' },
  { value: 'OFFER', label: 'Offer' },
] as const;

export type ContributionSeedType = (typeof CONTRIBUTION_SEED_TYPES)[number]['value'];

export const CMAP_DISCLOSURE_STAGES = [
  { id: 'ARRIVAL', label: 'Arrival', levelRange: 'L0-L2', minLevel: 0, maxLevel: 2 },
  { id: 'SETTLING', label: 'Settling', levelRange: 'L3-L5', minLevel: 3, maxLevel: 5 },
  { id: 'STEWARDSHIP', label: 'Stewardship', levelRange: 'L6+', minLevel: 6, maxLevel: 9 },
] as const;

export type CmapDisclosureStage = (typeof CMAP_DISCLOSURE_STAGES)[number]['id'];

export function getCmapDisclosureStage(level: number | null | undefined): CmapDisclosureStage {
  const normalized = Math.max(0, Math.min(9, Number.isFinite(level ?? Number.NaN) ? Number(level) : 0));
  if (normalized <= 2) return 'ARRIVAL';
  if (normalized <= 5) return 'SETTLING';
  return 'STEWARDSHIP';
}

export const GOVERNANCE_ROUTES = [
  { slug: 'charter', title: 'Universal Charter' },
  { slug: 'refusal-register', title: 'Refusal Register' },
  { slug: 'challenge-path', title: 'Challenge Path' },
  { slug: 'what-we-cannot-yet-hold', title: 'What We Cannot Yet Hold' },
  { slug: 'defederation-protocol', title: 'Defederation Protocol' },
  { slug: 'governance-roster', title: 'Governance Roster' },
  { slug: 'tk-bc-labels', title: 'TK/BC Protocol Labels' },
  { slug: 'term-limits-successors', title: 'Term Limits and Successors' },
] as const;
