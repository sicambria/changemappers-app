export interface CompassProfileData {
  userId: string;
  // Pillar I
  northStar: string | null;
  nonNegotiables: string[];
  originQuestion: string | null;
  biographyEntries: unknown;
  // Pillar II
  ecosystemMap: unknown;
  translationMap: unknown;
  conflictStyleNote: string | null;
  communicationNote: string | null;
  // Pillar III
  timeScore: number | null;
  resourceScore: number | null;
  bandwidthScore: number | null;
  confirmedScope: number | null;
  energyPatterns: string | null;
  riskFears: string | null;
  emotionalPattern: string | null;
  supportNetwork: unknown;
  // Pillar IV
  experiments: unknown;
  domainBalance: unknown;
  storyWhy: string | null;
  storyVision: string | null;
  storyShift: string | null;
  // State
  unlockedPillars: string[];
  lastActiveSection: string | null;
  createdAt: Date;
  updatedAt: Date;
}
