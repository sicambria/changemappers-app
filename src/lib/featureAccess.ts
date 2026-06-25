import { customAlphabet } from 'nanoid';

/**
 * Feature Access Control based on ProfileType
 *
 * Defines which features are accessible per profile type:
 * - GUEST: Basic access (main page, map, communities, events)
 * - COMMUNITY_SEEKER: Community seeker features (connections, messaging, profiles)
 * - CHANGEMAPPER: Full access including admin
 *
 * Menu item definitions and navigation helpers live in menuConfig.ts.
 */

// Re-export menu helpers so tests/consumers that import from here keep working
export { getMenuItems, getMainNavItems, getMapNavItems, getUserMenuItems } from '@/lib/menuConfig';

export type ProfileType = 'GUEST' | 'COMMUNITY_SEEKER' | 'CHANGEMAPPER';

export type Feature =
  | 'home'
  | 'map'
  | 'causes'
  | 'communities'
  | 'events'
  | 'profile'
  | 'connections'
  | 'messages'
  | 'video'
  | 'settings'
  | 'admin'
  | 'glossary'
  | 'calendar'
  | 'favorites'
  | 'roadmap'
  | 'feedback'
  | 'stories'
  | 'matchmaking'
  | 'learning-hub'
  | 'traditions'
  | 'regenerative-skills'
  | 'change-patterns'
  | 'tools'
  | 'graph'
  | 'reflect'
  | 'lifewheel'
  | 'metamodels'
  | 'planet'
  | 'platform-intro'
  | 'feed'
  | 'growth-hub'
  | 'social-issues'
  | 'contribute'
  | 'contribute-find'
  | 'contribute-offer'
  | 'canvas'
  | 'kanban'
  | 'volunteer'
  | 'scheduling'
  | 'energy'
  | 'value-compass'
  | 'principles'
  | 'helpers'
  | 'reflect-checkin'
  | 'reflect-deep'
  | 'connect-nature'
  | 'compass'
  | 'coachme'
  | 'pitch'
  | 'learning-central'
  | 'signals'
  | 'draw'
  | 'governance'
  | 'cases';

export interface MenuItem {
  id: string;
  feature: Feature;
  icon: string;
  translationKey: string;
  path: string;
}

/** A dropdown group of menu items with a group label and description */
export interface MenuGroup {
  id: string;
  labelKey: string;
  descriptionKey?: string;
  items: MenuItem[];
}

/**
 * Feature access map per profile type
 */
const featureAccessMap: Record<ProfileType, Feature[]> = {
  GUEST: [
    'home',
    'map',
    'causes',
    'communities',
    'events',
    'feed',
    'social-issues',
    'signals',
    'platform-intro',
  ],

  COMMUNITY_SEEKER: [
    'home',
    'map',
    'causes',
    'communities',
    'events',
    'feed',
    'social-issues',
    'signals',
    'profile',
    'connections',
    'messages',
    'video',
    'settings',
    'glossary',
    'calendar',
    'favorites',
    'feedback',
    'stories',
    'matchmaking',
    'learning-hub',
    'traditions',
    'regenerative-skills',
    'change-patterns',
    'metamodels',
    'tools',
    'graph',
    'reflect',
    'lifewheel',
    'reflect-checkin',
    'reflect-deep',
    'planet',
    'growth-hub',
    'contribute',
    'contribute-find',
    'contribute-offer',
    'canvas',
    'kanban',
    'volunteer',
    'scheduling',
    'energy',
    'value-compass',
    'principles',
    'helpers',
    'reflect-checkin',
    'reflect-deep',
    'connect-nature',
    'compass',
    'coachme',
    'pitch',
    'learning-central',
    'draw',
    'cases',
  ],

  CHANGEMAPPER: [
    'home',
    'map',
    'causes',
    'communities',
    'events',
    'feed',
    'social-issues',
    'signals',
    'profile',
    'connections',
    'messages',
    'video',
    'settings',
    'glossary',
    'calendar',
    'favorites',
    'roadmap',
    'feedback',
    'stories',
    'matchmaking',
    'learning-hub',
    'traditions',
    'regenerative-skills',
    'change-patterns',
    'metamodels',
    'tools',
    'graph',
    'reflect',
    'lifewheel',
    'reflect-checkin',
    'reflect-deep',
    'planet',
    'growth-hub',
    'contribute',
    'contribute-find',
    'contribute-offer',
    'canvas',
    'kanban',
    'volunteer',
    'scheduling',
    'energy',
    'value-compass',
    'principles',
    'helpers',
    'reflect-checkin',
    'reflect-deep',
    'connect-nature',
    'compass',
    'coachme',
    'pitch',
    'learning-central',
    'draw',
    'cases',
  ],
};

/**
 * Check if a profile type has access to a specific feature
 */
export function canAccess(profileType: ProfileType, feature: Feature): boolean {
  return featureAccessMap[profileType]?.includes(feature) ?? false;
}

/**
 * Parse invite code to extract profile type
 * Format: XX-XXXXX where XX is:
 * - G = GUEST
 * - CO = COMMUNITY_SEEKER
 * - CM = CHANGEMAPPER
 */
export function parseInviteCodeProfileType(inviteCode: string): ProfileType {
  if (!inviteCode || inviteCode.length < 1) {
    return 'GUEST';
  }

  const code = inviteCode.toUpperCase();

  // New multi-character prefixes
  if (code.startsWith('CO')) return 'COMMUNITY_SEEKER';
  if (code.startsWith('CM')) return 'CHANGEMAPPER';

  // Legacy single-character prefixes
  const prefix = code.charAt(0);
  switch (prefix) {
    case 'K':
      return 'COMMUNITY_SEEKER';
    case 'C':
      return 'CHANGEMAPPER';
    case 'G':
      return 'GUEST';
    default:
      return 'GUEST';
  }
}

/**
 * Generate a new invite code with profile type prefix
 */
export function generateInviteCode(profileType: ProfileType): string {
  const prefixMap: Record<ProfileType, string> = {
    GUEST: 'G',
    COMMUNITY_SEEKER: 'CO',
    CHANGEMAPPER: 'CM',
  };

  const prefix = prefixMap[profileType];
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nanoid = customAlphabet(alphabet, 6);
  const randomPart = nanoid();

  return `${prefix}-${randomPart}`;
}
