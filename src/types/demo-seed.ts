import type {
  SignalDomain,
  SignalConfidence,
  SignalNovelty,
  SignalScale,
  SocialIssueCategory,
  IssueSeverity,
} from "@/lib/prisma";

export interface DemoWeakSignalInput {
  title: string;
  description: string;
  domain: SignalDomain;
  confidence?: SignalConfidence;
  novelty?: SignalNovelty;
  scale?: SignalScale;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export interface DemoSocialIssueInput {
  title: string;
  description?: string;
  category: SocialIssueCategory;
  severity?: IssueSeverity;
  latitude?: number;
  longitude?: number;
  locationName?: string;
}

export const DEMO_SIGNAL_DOMAINS: { value: SignalDomain; labelKey: string }[] =
  [
    { value: "EDUCATION", labelKey: "demo.signalDomains.education" },
    { value: "GOVERNANCE", labelKey: "demo.signalDomains.governance" },
    { value: "FOOD", labelKey: "demo.signalDomains.food" },
    { value: "TECHNOLOGY", labelKey: "demo.signalDomains.technology" },
    { value: "HEALTH", labelKey: "demo.signalDomains.health" },
    { value: "ECONOMY", labelKey: "demo.signalDomains.economy" },
    { value: "ECOLOGY", labelKey: "demo.signalDomains.ecology" },
    { value: "CULTURE", labelKey: "demo.signalDomains.culture" },
    { value: "ENERGY", labelKey: "demo.signalDomains.energy" },
    { value: "HOUSING", labelKey: "demo.signalDomains.housing" },
    { value: "TRANSPORT", labelKey: "demo.signalDomains.transport" },
    { value: "MEDIA", labelKey: "demo.signalDomains.media" },
    { value: "JUSTICE", labelKey: "demo.signalDomains.justice" },
    { value: "FINANCE", labelKey: "demo.signalDomains.finance" },
    { value: "OTHER", labelKey: "demo.signalDomains.other" },
  ];

export const DEMO_ISSUE_CATEGORIES: {
  value: SocialIssueCategory;
  labelKey: string;
}[] = [
  { value: "ENVIRONMENTAL", labelKey: "demo.issueCategories.environmental" },
  { value: "GOVERNANCE", labelKey: "demo.issueCategories.governance" },
  { value: "MEDIA", labelKey: "demo.issueCategories.media" },
  { value: "EDUCATION", labelKey: "demo.issueCategories.education" },
  { value: "ECONOMIC", labelKey: "demo.issueCategories.economic" },
  { value: "SOCIAL", labelKey: "demo.issueCategories.social" },
  { value: "INFRASTRUCTURE", labelKey: "demo.issueCategories.infrastructure" },
  { value: "HEALTH", labelKey: "demo.issueCategories.health" },
  { value: "OTHER", labelKey: "demo.issueCategories.other" },
];

export const DEMO_BATCH_PREFIX = "[DEMO] ";

export interface BatchWeakSignalSpec {
  title: string;
  description: string;
  domain: SignalDomain;
  confidence: SignalConfidence;
  novelty: SignalNovelty;
  scale: SignalScale;
  latitude: number;
  longitude: number;
  locationName: string;
}

export interface BatchSocialIssueSpec {
  title: string;
  description: string;
  category: SocialIssueCategory;
  severity: IssueSeverity;
  latitude: number;
  longitude: number;
  locationName: string;
}

export const BATCH_DEMO_WEAK_SIGNALS: BatchWeakSignalSpec[] = [
  {
    title: "Micro-forests in urban parking lots",
    description:
      "Citizens in multiple European cities are converting abandoned parking spaces into Miyawaki micro-forests, creating biodiversity hotspots in under 20 square metres. These pocket forests mature 10x faster than conventional plantings.",
    domain: "ECOLOGY",
    confidence: "MEDIUM",
    novelty: "UNCOMMON",
    scale: "COMMUNITY",
    latitude: 47.4979,
    longitude: 19.0402,
    locationName: "Budapest",
  },
  {
    title: "Community-owned mesh networks",
    description:
      "Neighbourhoods in Southern Europe are building decentralised internet infrastructure using mesh networking, bypassing commercial ISPs. These networks remain operational during natural disasters and corporate outages.",
    domain: "TECHNOLOGY",
    confidence: "LOW",
    novelty: "RARE",
    scale: "COMMUNITY",
    latitude: 37.5665,
    longitude: 126.978,
    locationName: "Seoul",
  },
  {
    title: "Time-banking for elder care",
    description:
      "Intergenerational time-banking cooperatives where younger members provide companionship and errands for elders, earning credits redeemable for future care. Piloted in Japan, now spreading to European municipalities.",
    domain: "HEALTH",
    confidence: "MEDIUM",
    novelty: "UNCOMMON",
    scale: "INSTITUTIONAL",
    latitude: 52.4853,
    longitude: 13.4291,
    locationName: "Berlin",
  },
  {
    title: "Open-source farm equipment",
    description:
      "Farmers are sharing CAD designs and DIY builds for agricultural machinery via online platforms, reducing equipment costs by 80%. The open-source tractor movement has grown 300% in two years across East Africa and South Asia.",
    domain: "FOOD",
    confidence: "HIGH",
    novelty: "NOVEL",
    scale: "ECOSYSTEM",
    latitude: -1.2921,
    longitude: 36.8219,
    locationName: "Nairobi",
  },
  {
    title: "Decentralised renewable energy tokens",
    description:
      "Blockchain-based energy tokens allow households with solar panels to sell surplus directly to neighbours at peer-negotiated rates, bypassing utility companies. Pilot programmes show 40% cost reductions for consumers.",
    domain: "ENERGY",
    confidence: "LOW",
    novelty: "NOVEL",
    scale: "COMMUNITY",
    latitude: -34.6118,
    longitude: -58.396,
    locationName: "Buenos Aires",
  },
  {
    title: "Participatory budgeting via sortition",
    description:
      "Municipalities are replacing elected budget committees with randomly selected citizen assemblies to allocate public funds. Early results show higher satisfaction and more equitable spending patterns across neighbourhoods.",
    domain: "GOVERNANCE",
    confidence: "MEDIUM",
    novelty: "RARE",
    scale: "INSTITUTIONAL",
    latitude: 47.186,
    longitude: 18.4221,
    locationName: "Székesfehérvár",
  },
  {
    title: "Regenerative aquaculture kelp farms",
    description:
      "Coastal communities are establishing integrated kelp-and-shellfish farms that sequester carbon, restore marine habitats, and provide sustainable livelihoods. Kelp farming requires no freshwater, fertiliser, or land.",
    domain: "ECOLOGY",
    confidence: "HIGH",
    novelty: "UNCOMMON",
    scale: "ECOSYSTEM",
    latitude: -36.8509,
    longitude: 174.7645,
    locationName: "Auckland",
  },
  {
    title: "Freecycle-based local currencies",
    description:
      "Communities are creating hyperlocal exchange systems where goods and services are traded using community-issued currencies backed by pledged volunteer hours, not national money. Stabilises during inflationary periods.",
    domain: "ECONOMY",
    confidence: "LOW",
    novelty: "RARE",
    scale: "COMMUNITY",
    latitude: 6.5244,
    longitude: 3.3792,
    locationName: "Lagos",
  },
  {
    title: "AI-assisted indigenous language revival",
    description:
      'Machine learning models trained on archival recordings are helping indigenous communities reconstruct and teach endangered languages. Three languages previously classified as "sleeping" now have active speaker communities.',
    domain: "CULTURE",
    confidence: "MEDIUM",
    novelty: "NOVEL",
    scale: "ECOSYSTEM",
    latitude: 49.2827,
    longitude: -123.1207,
    locationName: "Vancouver",
  },
  {
    title: "Housing cooperatives using CLT structures",
    description:
      "Community land trusts paired with cross-laminated timber construction are enabling housing costs 50% below market rate. The model eliminates speculative land value and uses carbon-negative building materials.",
    domain: "HOUSING",
    confidence: "HIGH",
    novelty: "UNCOMMON",
    scale: "INSTITUTIONAL",
    latitude: 19.076,
    longitude: 72.8777,
    locationName: "Mumbai",
  },
];

export const BATCH_DEMO_SOCIAL_ISSUES: BatchSocialIssueSpec[] = [
  {
    title: "Urban heat island effect in low-income neighbourhoods",
    description:
      "Lack of tree canopy and green space in economically disadvantaged areas leads to 5-8°C higher temperatures compared to wealthier districts, causing disproportionate heat-related illness.",
    category: "ENVIRONMENTAL",
    severity: "HIGH",
    latitude: -34.6118,
    longitude: -58.396,
    locationName: "Buenos Aires",
  },
  {
    title: "Digital divide in rural education",
    description:
      "Students in rural areas lack reliable internet access for remote learning, creating a growing educational achievement gap compared to urban peers.",
    category: "EDUCATION",
    severity: "HIGH",
    latitude: 46.0727,
    longitude: 18.233,
    locationName: "Pécs",
  },
  {
    title: "Algorithmic bias in public service delivery",
    description:
      "AI-driven decision systems for welfare, housing, and policing produce systematically discriminatory outcomes for minority communities due to biased training data.",
    category: "GOVERNANCE",
    severity: "CRITICAL",
    latitude: 52.4853,
    longitude: 13.4291,
    locationName: "Berlin",
  },
  {
    title: "Water privatization reducing access",
    description:
      "Corporate control of municipal water supplies has led to price increases of 200-400% in some cities, making clean water unaffordable for the poorest residents.",
    category: "INFRASTRUCTURE",
    severity: "CRITICAL",
    latitude: -1.2921,
    longitude: 36.8219,
    locationName: "Nairobi",
  },
  {
    title: "Media concentration and local news deserts",
    description:
      "Corporate consolidation has eliminated 70% of local newspapers in the past two decades, leaving communities without independent coverage of municipal governance.",
    category: "MEDIA",
    severity: "MODERATE",
    latitude: 37.5665,
    longitude: 126.978,
    locationName: "Seoul",
  },
  {
    title: "Gig economy worker precarity",
    description:
      "Platform workers classified as independent contractors lack health insurance, sick leave, and pension contributions, creating a growing underclass without social safety nets.",
    category: "ECONOMIC",
    severity: "HIGH",
    latitude: 13.7563,
    longitude: 100.5018,
    locationName: "Bangkok",
  },
  {
    title: "Social isolation among elderly",
    description:
      "Over 30% of people over 65 live alone with fewer than one meaningful social interaction per week, correlating with significantly increased mortality and cognitive decline.",
    category: "SOCIAL",
    severity: "MODERATE",
    latitude: 47.5316,
    longitude: 21.6244,
    locationName: "Debrecen",
  },
  {
    title: "Antibiotic resistance in community health",
    description:
      "Overprescription of antibiotics in primary care is accelerating antimicrobial resistance, threatening to make routine infections untreatable within a generation.",
    category: "HEALTH",
    severity: "CRITICAL",
    latitude: 6.5244,
    longitude: 3.3792,
    locationName: "Lagos",
  },
  {
    title: "Light pollution disrupting ecosystems",
    description:
      "Urban artificial light at night disrupts pollinator behaviour, bird migration, and circadian rhythms in humans. 80% of the world population lives under light-polluted skies.",
    category: "ENVIRONMENTAL",
    severity: "MODERATE",
    latitude: -23.5505,
    longitude: -46.6333,
    locationName: "São Paulo",
  },
  {
    title: "Informal waste recycling without worker protections",
    description:
      "Millions of waste pickers in the global South process 50-80% of recyclable materials but face hazardous conditions, no legal recognition, and no health coverage.",
    category: "OTHER",
    severity: "HIGH",
    latitude: 19.076,
    longitude: 72.8777,
    locationName: "Mumbai",
  },
];

// Single-entity demo creation inputs used by the admin seed actions.
export interface DemoUserInput {
  name: string;
  displayName?: string;
  bio?: string;
  city?: string;
  country?: string;
  archetypes?: string[];
}

export interface DemoCommunityInput {
  name: string;
  description?: string;
  type: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export interface DemoEventInput {
  title: string;
  description?: string;
  location?: string;
  category: string;
  startDate: string;
  endDate?: string;
  latitude?: number;
  longitude?: number;
}
