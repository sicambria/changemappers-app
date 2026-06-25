// Types for map entities

export interface MapEntity {
  id: string;
  type: 'community' | 'individual' | 'event' | 'issue' | 'signal';
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  avatar?: string | null;
  tags?: string[];

  // Community specific
  communityType?: string;
  memberCount?: number;
  isAcceptingMembers?: boolean;
  appreciateCount?: number;

  // Individual specific
  archetypes?: string[];
  changemakeLevel?: string;
  lastActive?: string;
  isRecentlyActive?: boolean;
  rdgAreas?: string[];
  availabilityDetails?: unknown;
  skills?: string[];
  offers?: string[];
  needs?: string[];
  values?: string[];

  // Event specific
  eventType?: string;
  eventDate?: string;
  organizerName?: string;

  // Issue specific
  issueCategory?: string;
  issueSeverity?: string;

  // Signal specific
  signalDomain?: string;
  signalConfidence?: string;
  signalNovelty?: string;
}
