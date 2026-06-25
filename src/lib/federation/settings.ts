import { Visibility } from '@/lib/prisma-shared';

export const FEDIVERSE_CONSENT_VERSION = 1;
export const FEDERATED_MATCHMAKING_STAGE = 'single-server-mvp';
export const REMOTE_MATCHMAKING_CACHE_TTL_DAYS = 30;

export interface PublicProfileExposureSettings {
  showBio: boolean;
  showLocation: boolean;
  showWebsite: boolean;
  showSocialLinks: boolean;
  showAvatar: boolean;
  showCoverImage: boolean;
  showSkills: boolean;
  showOffers: boolean;
  showNeeds: boolean;
  showValues: boolean;
  showInterests: boolean;
  showRdgAreas: boolean;
  showCauses: boolean;
  showArchetypes: boolean;
  showChangemakerLevel: boolean;
  showIntentions: boolean;
  showBoundaries: boolean;
}

export interface ActivityPubSettings {
  enabled: boolean;
  discoverable: boolean;
  exposeProfile: boolean;
  exposePublicPosts: boolean;
  showWebsiteInActor: boolean;
  showSocialLinksInActor: boolean;
  showLocationInActor: boolean;
}

export interface VerificationSettings {
  relMeLinks: boolean;
}

export interface FediverseSettings {
  consentVersion: number | null;
  publicProfile: PublicProfileExposureSettings;
  activityPub: ActivityPubSettings;
  verification: VerificationSettings;
}

export interface FederatedMatchmakingPolicy {
  stage: typeof FEDERATED_MATCHMAKING_STAGE;
  remoteDiscoveryEnabled: boolean;
  remoteCandidateImportEnabled: boolean;
  remoteCandidateExportEnabled: boolean;
  remoteCacheTtlDays: number;
  reason: string;
}

export const DEFAULT_FEDIVERSE_SETTINGS: FediverseSettings = {
  consentVersion: null,
  publicProfile: {
    showBio: true,
    showLocation: true,
    showWebsite: true,
    showSocialLinks: true,
    showAvatar: true,
    showCoverImage: true,
    showSkills: true,
    showOffers: true,
    showNeeds: true,
    showValues: true,
    showInterests: true,
    showRdgAreas: true,
    showCauses: true,
    showArchetypes: true,
    showChangemakerLevel: true,
    showIntentions: true,
    showBoundaries: true,
  },
  activityPub: {
    enabled: false,
    discoverable: false,
    exposeProfile: false,
    exposePublicPosts: false,
    showWebsiteInActor: false,
    showSocialLinksInActor: false,
    showLocationInActor: false,
  },
  verification: {
    relMeLinks: false,
  },
};

export const STAGE0_FEDERATED_MATCHMAKING_POLICY: FederatedMatchmakingPolicy = {
  stage: FEDERATED_MATCHMAKING_STAGE,
  remoteDiscoveryEnabled: false,
  remoteCandidateImportEnabled: false,
  remoteCandidateExportEnabled: false,
  remoteCacheTtlDays: REMOTE_MATCHMAKING_CACHE_TTL_DAYS,
  reason: 'MVP ships as a single-server product; cross-instance matchmaking starts after the post-MVP federation foundation.',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function getNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

export function normalizeFediverseSettings(raw: unknown): FediverseSettings {
  if (!isRecord(raw)) {
    return DEFAULT_FEDIVERSE_SETTINGS;
  }

  const publicProfile = isRecord(raw.publicProfile) ? raw.publicProfile : {};
  const activityPub = isRecord(raw.activityPub) ? raw.activityPub : {};
  const verification = isRecord(raw.verification) ? raw.verification : {};

  return {
    consentVersion: getNumberOrNull(raw.consentVersion),
    publicProfile: {
      showBio: getBoolean(publicProfile.showBio, DEFAULT_FEDIVERSE_SETTINGS.publicProfile.showBio),
      showLocation: getBoolean(publicProfile.showLocation, DEFAULT_FEDIVERSE_SETTINGS.publicProfile.showLocation),
      showWebsite: getBoolean(publicProfile.showWebsite, DEFAULT_FEDIVERSE_SETTINGS.publicProfile.showWebsite),
      showSocialLinks: getBoolean(publicProfile.showSocialLinks, DEFAULT_FEDIVERSE_SETTINGS.publicProfile.showSocialLinks),
      showAvatar: getBoolean(publicProfile.showAvatar, DEFAULT_FEDIVERSE_SETTINGS.publicProfile.showAvatar),
      showCoverImage: getBoolean(publicProfile.showCoverImage, DEFAULT_FEDIVERSE_SETTINGS.publicProfile.showCoverImage),
      showSkills: getBoolean(publicProfile.showSkills, DEFAULT_FEDIVERSE_SETTINGS.publicProfile.showSkills),
      showOffers: getBoolean(publicProfile.showOffers, getBoolean(publicProfile.showSkills, DEFAULT_FEDIVERSE_SETTINGS.publicProfile.showOffers)),
      showNeeds: getBoolean(publicProfile.showNeeds, getBoolean(publicProfile.showSkills, DEFAULT_FEDIVERSE_SETTINGS.publicProfile.showNeeds)),
      showValues: getBoolean(publicProfile.showValues, DEFAULT_FEDIVERSE_SETTINGS.publicProfile.showValues),
      showInterests: getBoolean(publicProfile.showInterests, DEFAULT_FEDIVERSE_SETTINGS.publicProfile.showInterests),
      showRdgAreas: getBoolean(publicProfile.showRdgAreas, getBoolean(publicProfile.showInterests, DEFAULT_FEDIVERSE_SETTINGS.publicProfile.showRdgAreas)),
      showCauses: getBoolean(publicProfile.showCauses, getBoolean(publicProfile.showInterests, DEFAULT_FEDIVERSE_SETTINGS.publicProfile.showCauses)),
      showArchetypes: getBoolean(publicProfile.showArchetypes, DEFAULT_FEDIVERSE_SETTINGS.publicProfile.showArchetypes),
      showChangemakerLevel: getBoolean(publicProfile.showChangemakerLevel, DEFAULT_FEDIVERSE_SETTINGS.publicProfile.showChangemakerLevel),
      showIntentions: getBoolean(publicProfile.showIntentions, DEFAULT_FEDIVERSE_SETTINGS.publicProfile.showIntentions),
      showBoundaries: getBoolean(publicProfile.showBoundaries, getBoolean(publicProfile.showIntentions, DEFAULT_FEDIVERSE_SETTINGS.publicProfile.showBoundaries)),
    },
    activityPub: {
      enabled: getBoolean(activityPub.enabled, DEFAULT_FEDIVERSE_SETTINGS.activityPub.enabled),
      discoverable: getBoolean(activityPub.discoverable, DEFAULT_FEDIVERSE_SETTINGS.activityPub.discoverable),
      exposeProfile: getBoolean(activityPub.exposeProfile, DEFAULT_FEDIVERSE_SETTINGS.activityPub.exposeProfile),
      exposePublicPosts: getBoolean(activityPub.exposePublicPosts, DEFAULT_FEDIVERSE_SETTINGS.activityPub.exposePublicPosts),
      showWebsiteInActor: getBoolean(activityPub.showWebsiteInActor, DEFAULT_FEDIVERSE_SETTINGS.activityPub.showWebsiteInActor),
      showSocialLinksInActor: getBoolean(activityPub.showSocialLinksInActor, DEFAULT_FEDIVERSE_SETTINGS.activityPub.showSocialLinksInActor),
      showLocationInActor: getBoolean(activityPub.showLocationInActor, DEFAULT_FEDIVERSE_SETTINGS.activityPub.showLocationInActor),
    },
    verification: {
      relMeLinks: getBoolean(verification.relMeLinks, DEFAULT_FEDIVERSE_SETTINGS.verification.relMeLinks),
    },
  };
}

export function withFediverseConsent(
  settings: FediverseSettings,
  consentVersion: number = FEDIVERSE_CONSENT_VERSION,
): FediverseSettings {
  return {
    ...settings,
    consentVersion,
  };
}

export function hasFediverseConsent(settings: FediverseSettings): boolean {
  return (settings.consentVersion ?? 0) >= FEDIVERSE_CONSENT_VERSION;
}

export function canExposeActivityPubProfile(input: {
  profileVisibility: Visibility;
  isSuspended: boolean;
  settings: FediverseSettings;
}): boolean {
  const { profileVisibility, isSuspended, settings } = input;
  if (isSuspended) return false;
  if (profileVisibility !== Visibility.PUBLIC) return false;
  if (!hasFediverseConsent(settings)) return false;
  return settings.activityPub.enabled && settings.activityPub.exposeProfile;
}

export function canExposeActivityPubPost(input: {
  profileVisibility: Visibility;
  isSuspended: boolean;
  settings: FediverseSettings;
  postVisibility: 'PUBLIC' | 'REGISTERED' | 'INTERNAL';
}): boolean {
  const { postVisibility, ...rest } = input;
  if (postVisibility !== 'PUBLIC') return false;
  if (!canExposeActivityPubProfile(rest)) return false;
  return rest.settings.activityPub.exposePublicPosts;
}

export function getFederatedMatchmakingPolicy(): FederatedMatchmakingPolicy {
  return STAGE0_FEDERATED_MATCHMAKING_POLICY;
}

export function canUseFederatedMatchmaking(): boolean {
  return getFederatedMatchmakingPolicy().remoteCandidateImportEnabled;
}

export function getActivityPubUsername(userId: string): string {
  return `cm-${userId.toLowerCase()}`;
}
