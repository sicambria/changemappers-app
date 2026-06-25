// ─── Demo entity types ──────────────────────────────────────────────────────

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  city: string | null;
  createdAt: Date;
}
export interface DemoCommunity {
  id: string;
  name: string;
  type: string;
  city: string | null;
  createdAt: Date;
}
export interface DemoEvent {
  id: string;
  title: string;
  category: string;
  location: string | null;
  startDate: Date;
  createdAt: Date;
}
export interface DemoWeakSignal {
  id: string;
  title: string;
  domain: string;
  confidence: string;
  locationName: string | null;
  createdAt: Date;
}
export interface DemoSocialIssue {
  id: string;
  title: string;
  category: string;
  severity: string;
  locationName: string | null;
  createdAt: Date;
}

export interface BatchResult {
  name: string;
  status: "created" | "skipped";
  email: string;
}

// ─── Demo entity constants ──────────────────────────────────────────────────

export const COMMUNITY_TYPE_KEYS: { value: string; labelKey: string }[] = [
  {
    value: "NATURE_CONNECTED_ECO_HUB",
    labelKey: "demo.communityTypes.natureConnectedEcoHub",
  },
  {
    value: "HEALING_SANCTUARY",
    labelKey: "demo.communityTypes.healingSanctuary",
  },
  {
    value: "INCLUSIVE_SUPPORT_NETWORK",
    labelKey: "demo.communityTypes.inclusiveSupportNetwork",
  },
  {
    value: "CREATIVE_ARTS_COLONY",
    labelKey: "demo.communityTypes.creativeArtsColony",
  },
  {
    value: "EGALITARIAN_LIVING",
    labelKey: "demo.communityTypes.egalitarianLiving",
  },
  { value: "SPIRITUAL_HAVEN", labelKey: "demo.communityTypes.spiritualHaven" },
  { value: "KNOWLEDGE_HUB", labelKey: "demo.communityTypes.knowledgeHub" },
  { value: "NOMADIC_NETWORK", labelKey: "demo.communityTypes.nomadicNetwork" },
  {
    value: "REGENERATIVE_ECONOMIC",
    labelKey: "demo.communityTypes.regenerativeEconomic",
  },
  {
    value: "VISIONARY_MODEL_CITY",
    labelKey: "demo.communityTypes.visionaryModelCity",
  },
  {
    value: "EARTH_REGENERATION_CENTER",
    labelKey: "demo.communityTypes.earthRegenerationCenter",
  },
  {
    value: "FRONTLINE_ACTIVIST",
    labelKey: "demo.communityTypes.frontlineActivist",
  },
];

export const EVENT_CATEGORY_KEYS: { value: string; labelKey: string }[] = [
  { value: "MEETUP", labelKey: "demo.eventCategories.meetup" },
  { value: "WORKSHOP", labelKey: "demo.eventCategories.workshop" },
  { value: "RETREAT", labelKey: "demo.eventCategories.retreat" },
  { value: "CELEBRATION", labelKey: "demo.eventCategories.celebration" },
  { value: "OPEN_DAY", labelKey: "demo.eventCategories.openDay" },
  { value: "WORKDAY", labelKey: "demo.eventCategories.workday" },
  { value: "OPEN_SPACE", labelKey: "demo.eventCategories.openSpace" },
  { value: "OTHER", labelKey: "demo.eventCategories.other" },
];

export const ARCHETYPES = [
  "LOCAL_PRACTITIONER",
  "NETWORK_WEAVER",
  "INSTITUTIONAL_CHANGEMAKER",
  "GLOBAL_AMPLIFIER",
  "RESOURCE_MOBILIZER",
  "INNOVATION_CATALYST",
  "SYSTEM_DISRUPTOR",
  "STRATEGIC_ADVISOR",
];
