export type RdgDomainId = 'D1' | 'D2' | 'D3' | 'D4' | 'D5';
export type RdgId =
  | 'RDG01' | 'RDG02' | 'RDG03' | 'RDG04' | 'RDG05' | 'RDG06'
  | 'RDG07' | 'RDG08' | 'RDG09' | 'RDG10' | 'RDG11' | 'RDG12'
  | 'RDG13' | 'RDG14' | 'RDG15' | 'RDG16' | 'RDG17' | 'RDG18'
  | 'RDG19' | 'RDG20' | 'RDG21' | 'RDG22' | 'RDG23' | 'RDG24'
  | 'RDG25' | 'RDG26' | 'RDG27' | 'RDG28' | 'RDG29' | 'RDG30';

export interface RdgDomain { id: RdgDomainId; name: string; sortOrder: number; rdgRange: string }
export interface RdgGoal { id: RdgId; number: number; domainId: RdgDomainId; slug: string; officialTitle: string; sortOrder: number }
export interface SocialCauseTopicTaxonomy { slug: string; title: string; taxonomyKind: 'rdg-goal' | 'topic' | 'social-cause'; domainId: RdgDomainId; primaryRdgId: RdgId; crossRdgIds: RdgId[] }
export interface LinkedTaxonomyOption<TValue extends string = string> { value: TValue; label: string; rdgIds: RdgId[] }

export const RDG_DOMAINS = [
  { id: 'D1', name: 'Human Development & Inner Capacity', sortOrder: 1, rdgRange: 'RDG01-RDG06' },
  { id: 'D2', name: 'Living Systems Regeneration', sortOrder: 2, rdgRange: 'RDG07-RDG12' },
  { id: 'D3', name: 'Regenerative Economy & Infrastructure', sortOrder: 3, rdgRange: 'RDG13-RDG18' },
  { id: 'D4', name: 'Governance & Collective Intelligence', sortOrder: 4, rdgRange: 'RDG19-RDG24' },
  { id: 'D5', name: 'Long-Term Stewardship & Civilizational Resilience', sortOrder: 5, rdgRange: 'RDG25-RDG30' },
] as const satisfies readonly RdgDomain[];

const RDG_ROWS = [
  ['RDG01','D1','Universal Developmental Foundations','universal-developmental-foundations'], ['RDG02','D1','Trauma-Informed Societies','trauma-informed-societies'], ['RDG03','D1','Psychological Sovereignty','psychological-sovereignty'], ['RDG04','D1','Meaning & Purpose Infrastructure','meaning-purpose-infrastructure'], ['RDG05','D1','Relational Competence','relational-competence'], ['RDG06','D1','Developmental Leadership','developmental-leadership'],
  ['RDG07','D2','Soil & Land Regeneration','soil-land-regeneration'], ['RDG08','D2','Water Cycle Restoration','water-cycle-restoration'], ['RDG09','D2','Biodiversity & Ecosystem Function','biodiversity-ecosystem-function'], ['RDG10','D2','Atmospheric & Climate Stability','atmospheric-climate-stability'], ['RDG11','D2','Urban-Ecological Integration','urban-ecological-integration'], ['RDG12','D2','Food System Regeneration','food-system-regeneration'],
  ['RDG13','D3','Regenerative Enterprise','regenerative-enterprise'], ['RDG14','D3','Commons & Shared Wealth','commons-shared-wealth'], ['RDG15','D3','Circular Material Flows','circular-material-flows'], ['RDG16','D3','Distributed Energy Systems','distributed-energy-systems'], ['RDG17','D3','Regenerative Finance','regenerative-finance'], ['RDG18','D3','Place-Based Infrastructure','place-based-infrastructure'],
  ['RDG19','D4','Participatory Governance','participatory-governance'], ['RDG20','D4','Collective Intelligence','collective-intelligence'], ['RDG21','D4','Systems Literacy & Civic Sense-Making','systems-literacy-civic-sense-making'], ['RDG22','D4','Conflict Transformation','conflict-transformation'], ['RDG23','D4','Distributed Power & Anti-Capture','distributed-power-anti-capture'], ['RDG24','D4','Intercultural & Interspiritual Governance','intercultural-interspiritual-governance'],
  ['RDG25','D5','Intergenerational Thinking','intergenerational-thinking'], ['RDG26','D5','Cultural Memory & Living Heritage','cultural-memory-living-heritage'], ['RDG27','D5','Epistemic Diversity','epistemic-diversity'], ['RDG28','D5','Technology Stewardship','technology-stewardship'], ['RDG29','D5','Civilizational Resilience','civilizational-resilience'], ['RDG30','D5','Planetary Stewardship Identity','planetary-stewardship-identity'],
] as const;

export const RDG_GOALS = RDG_ROWS.map(([id, domainId, officialTitle, slug], index) => ({ id, number: index + 1, domainId, slug, officialTitle, sortOrder: index + 1 })) as readonly RdgGoal[];

export const LEGACY_RDG_KEY_ALIASES = {
  FOOD_SOVEREIGNTY: 'RDG12', LAND_RESTORATION: 'RDG07', BIODIVERSITY: 'RDG09', WATER_SECURITY: 'RDG08', CLIMATE_ADAPTATION: 'RDG10', REGENERATIVE_AGRICULTURE: 'RDG12', ECOSYSTEM_RESTORATION: 'RDG09',
  COMMUNITY_RESILIENCE: 'RDG20', DEMOCRATIC_PARTICIPATION: 'RDG19', EDUCATION_ACCESS: 'RDG03', HEALTH_WELLBEING: 'RDG01', SOCIAL_JUSTICE: 'RDG21', INTERGENERATIONAL_EQUITY: 'RDG25', CULTURAL_HERITAGE: 'RDG26',
  LOCAL_ECONOMY: 'RDG14', CIRCULAR_ECONOMY: 'RDG15', FAIR_TRADE: 'RDG14', SOCIAL_ENTERPRISE: 'RDG13', COOPERATIVE_MODELS: 'RDG14', ETHICAL_INVESTMENT: 'RDG17', DEGROWTH: 'RDG29',
  INSTITUTIONAL_TRANSFORMATION: 'RDG19', PARTICIPATORY_GOVERNANCE: 'RDG19', TRANSPARENCY_ACCOUNTABILITY: 'RDG19', POLICY_REFORM: 'RDG24', INDIGENOUS_RIGHTS: 'RDG24', CLIMATE_JUSTICE: 'RDG21', COMMONS_GOVERNANCE: 'RDG14',
  '1_CLIMATE_RESILIENCE': 'RDG10', '2_REGENERATIVE_AGRI': 'RDG12', '3_LOCAL_ECONOMY': 'RDG14', '4_INNER_DEVELOPMENT': 'RDG03', '5_HOLISTIC_HEALTH': 'RDG01', '6_COMMUNITY_GOVERNANCE': 'RDG20', '7_NATURE_CONNECTION': 'RDG09', '8_SUSTAINABLE_HOUSING': 'RDG18', '9_OPEN_EDUCATION': 'RDG03', '10_PEACEFUL_TRANSITION': 'RDG22', '11_CLEAN_WATER': 'RDG08', '12_BIODIVERSITY': 'RDG09', '13_MENTAL_HEALTH': 'RDG02', '14_INTEGRAL_EDUCATION': 'RDG03', '15_CHILDRENS_RIGHTS': 'RDG01', '16_ELDER_DIGNITY': 'RDG25', '17_CLEAN_ENERGY': 'RDG16', '18_EQUITY': 'RDG21', '19_SAFE_HOUSING': 'RDG18', '20_MEANINGFUL_WORK': 'RDG13', '21_TECH_ETHICS': 'RDG28', '22_PEACEBUILDING': 'RDG22', '23_ANIMAL_WELFARE': 'RDG09', '24_OPEN_SCIENCE': 'RDG27', '25_CULTURAL_HERITAGE': 'RDG26', '26_DISASTER_RESILIENCE': 'RDG29', '27_EXISTENTIAL_RISK': 'RDG29', '28_PLANETARY_AWARENESS': 'RDG30', '29_COMMUNITY_ECONOMICS': 'RDG14', '30_DIGITAL_COMMONS': 'RDG23',
} as const satisfies Record<string, RdgId>;
const CAUSE_ROWS = [
  ['topic-permaculture','Permaculture','topic','RDG09',''], ['topic-eco-architecture','Eco-Architecture','topic','RDG16',''], ['topic-community-building','Community Building','topic','RDG20',''], ['topic-local-economy','Local Economy','topic','RDG14',''], ['topic-education','Education','topic','RDG03',''], ['topic-health','Health','topic','RDG01',''], ['topic-spirituality','Spirituality','topic','RDG30',''], ['topic-renewable-energy','Renewable Energy','topic','RDG18',''],
  ['clean-water-access','Clean Water Access','social-cause','RDG10','RDG13'], ['basic-sanitation','Basic Sanitation','social-cause','RDG13','RDG09'], ['mental-health','Mental Health','social-cause','RDG02','RDG01,RDG03'], ['childrens-rights',"Children's Rights",'social-cause','RDG01','RDG02,RDG26'], ['dignity-in-old-age','Dignity in Old Age','social-cause','RDG26','RDG21'], ['intergenerational-solidarity','Intergenerational Solidarity','social-cause','RDG26','RDG01'], ['safe-housing','Safe Housing','social-cause','RDG13','RDG16'], ['animal-welfare','Animal Welfare','social-cause','RDG08','RDG09,RDG06'], ['cultural-heritage','Cultural Heritage','social-cause','RDG06','RDG30'], ['human-diversity','Human Diversity','social-cause','RDG21','RDG22'], ['disaster-preparedness','Disaster Preparedness','social-cause','RDG27','RDG07,RDG25'], ['community-resilience','Community Resilience','social-cause','RDG20','RDG22,RDG13'],
] as const;

const RDG_BY_ID = new Map<RdgId, RdgGoal>(RDG_GOALS.map((goal) => [goal.id, goal]));
const RDG_BY_SLUG = new Map<string, RdgGoal>(RDG_GOALS.map((goal) => [goal.slug, goal]));
const DOMAIN_BY_ID = new Map<RdgDomainId, RdgDomain>(RDG_DOMAINS.map((domain) => [domain.id, domain]));

export const SOCIAL_CAUSE_TOPIC_TAXONOMY = CAUSE_ROWS.map(([slug, title, taxonomyKind, primaryRdgId, cross]) => {
  const goal = RDG_BY_ID.get(primaryRdgId as RdgId);
  if (!goal) throw new Error(`Unknown RDG mapping for ${slug}`);
  return { slug, title, taxonomyKind, domainId: goal.domainId, primaryRdgId, crossRdgIds: cross ? cross.split(',') : [] };
}) as readonly SocialCauseTopicTaxonomy[];

const linked = <TValue extends string>(rows: readonly (readonly [TValue, string, string])[]) => rows.map(([value, label, rdgs]) => ({ value, label, rdgIds: rdgs.split(',') as RdgId[] }));
export const CONTRIBUTION_TYPE_OPTIONS = linked([['SKILL_OFFERING','Skill offering','RDG03,RDG20'], ['ACCOMPANIMENT','Accompaniment','RDG05,RDG22'], ['KNOWLEDGE_COMMONS','Knowledge commons','RDG23,RDG27'], ['HOLDING_SPACE','Holding space','RDG02,RDG05']] as const);
export const EVENT_TYPE_OPTIONS = linked([['PUBLIC','Public','RDG19'], ['COMMUNITY','Community','RDG20'], ['PRIVATE','Private','RDG05']] as const);
export const EVENT_CATEGORY_OPTIONS = linked([['WORKSHOP','Workshop','RDG03'], ['MEETUP','Meetup','RDG20'], ['CELEBRATION','Celebration','RDG06'], ['OPEN_SPACE','Open space','RDG20'], ['WORKDAY','Workday','RDG12'], ['OPEN_DAY','Open day','RDG19'], ['TRAINING','Training','RDG03'], ['RETREAT','Retreat','RDG02'], ['CONFERENCE','Conference','RDG03'], ['CONVERGENCE','Convergence','RDG20'], ['GATHERING','Gathering','RDG20'], ['OTHER','Other','RDG30']] as const);
export const COMMUNITY_TYPE_OPTIONS = linked([['NATURE_CONNECTED_ECO_HUB','Nature-connected eco hub','RDG09'], ['HEALING_SANCTUARY','Healing sanctuary','RDG02'], ['INCLUSIVE_SUPPORT_NETWORK','Inclusive support network','RDG21'], ['CREATIVE_ARTS_COLONY','Creative arts colony','RDG06'], ['EGALITARIAN_LIVING','Egalitarian living','RDG14'], ['SPIRITUAL_HAVEN','Spiritual haven','RDG30'], ['KNOWLEDGE_HUB','Knowledge hub','RDG23'], ['NOMADIC_NETWORK','Nomadic network','RDG20'], ['REGENERATIVE_ECONOMIC','Regenerative economic community','RDG13'], ['VISIONARY_MODEL_CITY','Visionary model city','RDG11'], ['EARTH_REGENERATION_CENTER','Earth regeneration center','RDG07'], ['FRONTLINE_ACTIVIST','Frontline activist group','RDG22'], ['OTHER','Other','RDG30']] as const);
export const VOLUNTEER_FORMAT_OPTIONS = linked([['ONLINE','Online','RDG23'], ['OFFLINE','On site','RDG11'], ['HYBRID','Hybrid','RDG20']] as const);
export const IMPACT_SCALE_OPTIONS = linked([['LOCAL','Local','RDG11'], ['BIOREGIONAL','Bioregional','RDG07'], ['NATIONAL','National','RDG19'], ['GLOBAL','Global','RDG29']] as const);

const SOCIAL_CAUSE_BY_SLUG = new Map<string, SocialCauseTopicTaxonomy>(SOCIAL_CAUSE_TOPIC_TAXONOMY.map((cause) => [cause.slug, cause]));

/** Accepted shapes for RDG id/domain lookup helpers (string id, numeric code, or nullish). */
type RdgIdInput = string | number | null | undefined;

function canonicalFromNumber(numberText: string): RdgId | null {
  const number = Number.parseInt(numberText, 10);
  if (!Number.isInteger(number) || number < 1 || number > 30) return null;
  return `RDG${String(number).padStart(2, '0')}` as RdgId;
}

export function normalizeRdgId(value: RdgIdInput): RdgId | null {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  if (RDG_BY_ID.has(upper as RdgId)) return upper as RdgId;
  const aliased = LEGACY_RDG_KEY_ALIASES[upper as keyof typeof LEGACY_RDG_KEY_ALIASES];
  if (aliased) return aliased;
  const rdgMatch = /^RDG[-_\s:]?(\d{1,2})$/i.exec(raw) ?? /^rdg:(\d{1,2})$/i.exec(raw) ?? /^rdg-(\d{1,2})(?:-.+)?$/i.exec(raw);
  if (rdgMatch) return canonicalFromNumber(rdgMatch[1]);
  const numericPrefixMatch = /^(\d{1,2})(?:[_\s-].*)?$/.exec(raw);
  if (numericPrefixMatch) return canonicalFromNumber(numericPrefixMatch[1]);
  return RDG_BY_SLUG.get(raw.toLowerCase())?.id ?? null;
}

export function normalizeRdgIds(values: readonly (string | number)[]): RdgId[] {
  return Array.from(new Set(values.map((value) => normalizeRdgId(value)).filter((value): value is RdgId => Boolean(value))));
}

export function assertCanonicalRdgIds(values: readonly string[]): RdgId[] {
  const normalized = values.map((value) => normalizeRdgId(value));
  const invalid = values.find((_, index) => !normalized[index]);
  if (invalid) throw new Error(`Invalid RDG selection: ${invalid}`);
  return Array.from(new Set(normalized as RdgId[]));
}

export function getRdgById(id: RdgIdInput): RdgGoal | undefined {
  const normalized = normalizeRdgId(id);
  return normalized ? RDG_BY_ID.get(normalized) : undefined;
}

export function normalizeRdgDomainId(value: RdgIdInput): RdgDomainId | null {
  if (value === null || value === undefined) return null;
  const match = /^D?(\d)$/i.exec(String(value).trim());
  if (!match) return null;
  const id = `D${match[1]}` as RdgDomainId;
  return DOMAIN_BY_ID.has(id) ? id : null;
}

export function getDomainForRdg(id: RdgIdInput): RdgDomain | undefined {
  const goal = getRdgById(id);
  return goal ? DOMAIN_BY_ID.get(goal.domainId) : undefined;
}

export function getRdgIdsForDomain(domainId: string): RdgId[] {
  const normalizedDomain = normalizeRdgDomainId(domainId);
  return normalizedDomain ? RDG_GOALS.filter((goal) => goal.domainId === normalizedDomain).map((goal) => goal.id) : [];
}

export function formatRdgLabel(id: RdgIdInput): string {
  const goal = getRdgById(id);
  return goal ? `${goal.id}: ${goal.officialTitle}` : String(id ?? '');
}

export function getSocialCauseTopicBySlug(slug: string): SocialCauseTopicTaxonomy | undefined {
  return SOCIAL_CAUSE_BY_SLUG.get(slug);
}

export function getStructuredCauseMetadata(slug: string, websites?: string | null): Pick<SocialCauseTopicTaxonomy, 'taxonomyKind' | 'domainId' | 'primaryRdgId' | 'crossRdgIds'> | null {
  const mapped = getSocialCauseTopicBySlug(slug);
  if (mapped) return { taxonomyKind: mapped.taxonomyKind, domainId: mapped.domainId, primaryRdgId: mapped.primaryRdgId, crossRdgIds: [...mapped.crossRdgIds] };
  const primaryRdgId = normalizeRdgId(/(?:^|\|)rdg:(\d{1,2})(?:\||$)/.exec((websites ?? ''))?.[1]);
  if (!primaryRdgId) return null;
  const goal = getRdgById(primaryRdgId);
  const crossRdgIds = (/(?:^|\|)xrdg:([0-9,]+)/.exec((websites ?? ''))?.[1] ?? '').split(',').filter(Boolean).map((id) => normalizeRdgId(id)).filter((id): id is RdgId => Boolean(id));
  let taxonomyKind: 'topic' | 'rdg-goal' | 'social-cause';
  if ((websites ?? '').includes('topic:1')) {
    taxonomyKind = 'topic';
  } else if (slug.startsWith('rdg-')) {
    taxonomyKind = 'rdg-goal';
  } else {
    taxonomyKind = 'social-cause';
  }
  return { taxonomyKind, domainId: goal?.domainId ?? 'D1', primaryRdgId, crossRdgIds };
}
