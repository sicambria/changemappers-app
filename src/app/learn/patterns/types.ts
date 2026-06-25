export interface ChangePattern {
  id: string;
  abbr: string;
  name: string;
  definition: string;
  example: string;
  mechanism: string;
  levelOfChange: string;
  successFactors: string;
  risks: string;
  scaling: string;
  strengths: string;
  weaknesses: string;
  bestContext: string;
  chartX: number;
  chartY: number;
  chartR: number;
}

export type LogicalOperator = 'AND' | 'OR' | 'XOR';

export interface FilterCondition {
  field: keyof ChangePattern;
  value: string;
  operator: LogicalOperator;
}

export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
}

export interface FilterCategory {
  id: string;
  label: string;
  values: string[];
}

export const FILTER_CATEGORIES: Record<string, FilterCategory> = {
  levelOfChange: {
    id: 'levelOfChange',
    label: 'Level of Change',
    values: ['Individual', 'Community', 'Institutional', 'Policy', 'Structural', 'Paradigm'],
  },
  primaryApproach: {
    id: 'primaryApproach',
    label: 'Primary Approach',
    values: ['Direct Action', 'Economic Pressure', 'Institutional Change', 'Building Alternatives', 'Cultural/Narrative', 'Organizing & Education'],
  },
  riskLevel: {
    id: 'riskLevel',
    label: 'Risk Level',
    values: ['Low', 'Moderate', 'High', 'Extreme'],
  },
  timeHorizon: {
    id: 'timeHorizon',
    label: 'Time Horizon',
    values: ['Immediate (days-weeks)', 'Short-term (months)', 'Medium-term (1-5 years)', 'Long-term (decades)'],
  },
  participantRequirement: {
    id: 'participantRequirement',
    label: 'Participants Needed',
    values: ['Individual', 'Small Group', 'Community', 'Mass Movement'],
  },
};

// Keyword rules for primaryApproach classification (data-driven; replaces a 110-complexity
// if-chain — clean-code burndown 2026-06-14). `text` keywords match the combined
// name+definition+mechanism text; `name` keywords match the pattern NAME only — a stricter,
// intentional scope preserved verbatim from the original per-category checks. Order matters:
// it determines the order of returned approaches.
const PRIMARY_APPROACH_RULES: ReadonlyArray<{ approach: string; text: string[]; name: string[] }> = [
  { approach: 'Economic Pressure', name: [], text: ['strike', 'boycott', 'divest', 'debt', 'economic', 'labor', 'withdrawal', 'financial', 'currency', 'purchas', 'consumer', 'tax', 'rent', 'asset'] },
  { approach: 'Direct Action', name: ['sit-in', 'block'], text: ['occupation', 'sit-in', 'block', 'direct action', 'disrupt', 'civil disobedience', 'hunger', 'walkout', 'flash mob', 'camp', 'chain', 'physical', 'fraterniz', 'sanctuary'] },
  { approach: 'Institutional Change', name: ['policy', 'litigation'], text: ['litigation', 'policy', 'advocacy', 'legislation', 'budgeting', 'democracy', 'regulation', 'voting', 'ballot', 'election', 'parliament', 'resign', 'whistleblow', 'system'] },
  { approach: 'Building Alternatives', name: ['local institution', 'alternative'], text: ['building', 'institution', 'cooperative', 'alternative', 'mutual aid', 'commons', 'currency', 'gardening', 'prefigur', 'autonomous', 'solidarity econom'] },
  { approach: 'Cultural/Narrative', name: ['artiv', 'media', 'subvert'], text: ['narrative', 'story', 'media', 'art', 'culture', 'theater', 'symbol', 'subvert', 'meme', 'narratives', 'visibility'] },
  { approach: 'Organizing & Education', name: ['education', 'organiz', 'coalition'], text: ['organizing', 'coalition', 'education', 'teach', 'community', 'network', 'mobiliz', 'outreach'] },
];

// Priority-ordered keyword tiers for the single-result classifiers below. The first tier
// with a keyword present in the scanned text wins; otherwise the caller's fallback applies.
// Replaces three return-early if-chains (complexity 40/24/31) — clean-code burndown 2026-06-14.
type KeywordTier = { result: string; keywords: string[] };
const firstTierMatch = (text: string, tiers: ReadonlyArray<KeywordTier>): string | null =>
  tiers.find((tier) => tier.keywords.some((k) => text.includes(k)))?.result ?? null;

const RISK_TIERS: ReadonlyArray<KeywordTier> = [
  { result: 'Extreme', keywords: ['death', 'extreme', 'severe', 'permanent', 'prison', 'violent', 'organ damage', 'life', 'killed'] },
  { result: 'High', keywords: ['arrest', 'retaliation', 'prosecution', 'repression', 'personal risk', 'danger', 'injury', 'prosecut', 'criminal', 'deport', 'evict', 'job loss', 'force'] },
  { result: 'Moderate', keywords: ['burnout', 'co-optation', 'backlash', 'suspension', 'fines', 'isolated', 'alienation', 'symbol', 'commodif', 'ignor', 'naiv'] },
];
const TIME_HORIZON_TIERS: ReadonlyArray<KeywordTier> = [
  { result: 'Immediate (days-weeks)', keywords: ['immediate', 'instant', 'rapid', 'quick', 'sudden', 'brief', 'surprise', 'hours', 'days'] },
  { result: 'Long-term (decades)', keywords: ['slow', 'long-term', 'decades', 'permanent', 'sustainable', 'resilient', 'deep', 'process', 'years'] },
  { result: 'Medium-term (1-5 years)', keywords: ['momentum', 'campaign', 'sequential', 'builds', 'movement'] },
];
const PARTICIPANT_TIERS: ReadonlyArray<KeywordTier> = [
  { result: 'Mass Movement', keywords: ['mass', 'millions', 'thousands', 'general', 'nationwide', 'global', 'cross-sector', 'entire', 'economy'] },
  { result: 'Community', keywords: ['community', 'coalition', 'group', 'collective', 'neighborhood', 'local', 'grassroots', 'network', 'team'] },
  { result: 'Individual', keywords: ['individual', 'personal', 'whistleblow', 'hunger strike', 'single', 'one '] },
  { result: 'Small Group', keywords: ['workers', 'union', 'small', 'cell', 'team', 'few'] },
];

export const PATTERN_CATEGORIES: Record<string, (pattern: ChangePattern) => string[]> = {
  primaryApproach: (pattern) => {
    const nameLower = pattern.name.toLowerCase();
    const allText = `${nameLower} ${pattern.definition.toLowerCase()} ${pattern.mechanism.toLowerCase()}`;
    const approaches = PRIMARY_APPROACH_RULES.filter(
      (rule) => rule.text.some((k) => allText.includes(k)) || rule.name.some((k) => nameLower.includes(k)),
    ).map((rule) => rule.approach);

    return approaches.length > 0 ? approaches : ['Organizing & Education'];
  },

  riskLevel: (pattern) => {
    const text = `${pattern.risks} ${pattern.weaknesses}`.toLowerCase();
    const levelText = (pattern.levelOfChange || '').toLowerCase();

    const tier = firstTierMatch(text, RISK_TIERS);
    if (tier) return [tier];

    // Low is a compound condition (low-stakes change level, no escalation markers), not a
    // keyword tier — kept explicit to preserve the original behavior exactly.
    if (
      (levelText.includes('individual') || levelText.includes('community')) &&
      !text.includes('arrest') &&
      !text.includes('repression') &&
      !text.includes('violence')
    ) {
      return ['Low'];
    }

    return ['Moderate'];
  },

  timeHorizon: (pattern) => {
    const text = `${pattern.strengths} ${pattern.weaknesses} ${pattern.scaling}`.toLowerCase();
    return [firstTierMatch(text, TIME_HORIZON_TIERS) ?? 'Short-term (months)'];
  },

  participantRequirement: (pattern) => {
    const text = `${pattern.name} ${pattern.definition} ${pattern.successFactors} ${pattern.mechanism}`.toLowerCase();
    return [firstTierMatch(text, PARTICIPANT_TIERS) ?? 'Community'];
  },
};

