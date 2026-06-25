export type ProfileTab =
  | 'profile'
  | 'invite'
  | 'security'
  | 'activity'
  | 'settings'
  | 'advanced';

/** Shape of the authenticated user as consumed by the profile page tabs. */
export interface AuthUserProfile {
  id: string;
  name: string;
  displayName?: string;
  coverImage?: string;
  profilePhoto?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  motto?: string;
  timezone?: string;
  organizationName?: string;
  organizationDescription?: string;
  mainCommunity?: string;
  connectionCount?: number;
  verificationLevel?: string;
  isEmailVerified?: boolean;
  bio?: string;
  website?: string;
  socialLinks?: Record<string, string>;
  skills?: Array<{ id: string; skill: string; skillType: 'OFFERED' | 'SEEKING' | 'EXPERIENCE' }>;
  values?: Array<{ id: string; value: string }>;
  mainCauses?: Array<{ id: string; title: string }>;
  interestedCauses?: Array<{ id: string; title: string }>;
  archetypes?: string[];
  changemakeLevel?: string;
  collaborationPreference?: string[];
  constraints?: string;
  currentIntention?: string;
  enjoyDoing?: string;
  availabilityDetails?: unknown;
  federationConsentAt?: string;
  federationSettings?: unknown;
  isRemoteCapable?: boolean;
  profileVisibility?: string;
  rdgAreas?: string[];
  routeOverrides?: Record<string, boolean>;
  emailNotificationsEnabled?: boolean;
}
