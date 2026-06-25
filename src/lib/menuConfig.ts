/**
 * Menu configuration — all menu items, groups, and navigation helpers.
 * Access control logic lives in featureAccess.ts.
 *
 * NAVIGATION CHANGE CHECKLIST — when adding/removing/moving items:
 *   1. allMenuItems      — register every navigable feature here first
 *   2. mainNavFeatures   — controls what getMainNavItems() returns (the pool Header draws from)
 *   3. *MenuGroup        — update the relevant group export to keep data layer consistent
 *   4. Header.tsx        — update the matching *_NAV_FEATURES constant (covers desktop + mobile)
 *   5. featureAccess.ts  — ensure access rules are set for the right profile types
 *   6. locales/{en,es,hu}/common.json — add nav.<featureId> if the label is new
 *
 * See docs/architecture/navigation-change-guide.md for the full guide.
 *
 * NOTE: The *MenuGroup exports below are NOT used by Header.tsx for rendering.
 * Header.tsx has its own parallel *_NAV_FEATURES constants. Both must be kept in sync.
 */

import { type ProfileType, type Feature, type MenuItem, type MenuGroup, canAccess } from '@/lib/featureAccess';
import { resolveNavVisibility, type UserPrefs } from '@/lib/featureVisibility';

export type { UserPrefs } from '@/lib/featureVisibility';

/**
 * All available menu items
 */
export const allMenuItems: MenuItem[] = [
  { id: 'home', feature: 'home', icon: 'Home', translationKey: 'nav.home', path: '/' },
  { id: 'feed', feature: 'feed', icon: 'MessageSquare', translationKey: 'nav.feed', path: '/feed' },
  { id: 'map', feature: 'map', icon: 'Map', translationKey: 'nav.map', path: '/map' },
  { id: 'causes', feature: 'causes', icon: 'HeartHandshake', translationKey: 'nav.causes', path: '/causes' },
  { id: 'communities', feature: 'communities', icon: 'Users', translationKey: 'nav.communities', path: '/communities' },
  { id: 'events', feature: 'events', icon: 'Calendar', translationKey: 'nav.events', path: '/events' },
  { id: 'profile', feature: 'profile', icon: 'User', translationKey: 'nav.profile', path: '/profile' },
  { id: 'onboarding', feature: 'profile', icon: 'Route', translationKey: 'nav.onboarding', path: '/onboarding' },
  { id: 'connections', feature: 'connections', icon: 'Heart', translationKey: 'nav.connections', path: '/connections' },
  { id: 'messages', feature: 'messages', icon: 'MessageCircle', translationKey: 'nav.messages', path: '/messages' },
  { id: 'video', feature: 'video', icon: 'Video', translationKey: 'nav.video', path: '/video' },
  { id: 'settings', feature: 'settings', icon: 'Settings', translationKey: 'nav.settings', path: '/settings' },
  { id: 'admin', feature: 'admin', icon: 'Shield', translationKey: 'nav.admin', path: '/admin' },
  { id: 'favorites', feature: 'favorites', icon: 'Star', translationKey: 'nav.favorites', path: '/favorites' },
  { id: 'glossary', feature: 'glossary', icon: 'Book', translationKey: 'nav.glossary', path: '/glossary' },
  { id: 'calendar', feature: 'calendar', icon: 'CalendarDays', translationKey: 'nav.calendar', path: '/calendar' },
  { id: 'roadmap', feature: 'roadmap', icon: 'Route', translationKey: 'nav.roadmap', path: '/roadmap' },
  { id: 'stories', feature: 'stories', icon: 'Sparkles', translationKey: 'nav.stories', path: '/stories' },
  { id: 'feedback', feature: 'feedback', icon: 'MessageSquare', translationKey: 'nav.feedback', path: '/feedback' },
  { id: 'matchmaking', feature: 'matchmaking', icon: 'Sparkles', translationKey: 'nav.matchmaking', path: '/matchmaking' },
  { id: 'learning-hub', feature: 'learning-hub', icon: 'Book', translationKey: 'nav.learningHub', path: '/learn' },
  { id: 'traditions', feature: 'traditions', icon: 'Globe', translationKey: 'nav.traditions', path: '/learn/traditions' },
  { id: 'regenerative-skills', feature: 'regenerative-skills', icon: 'Sparkles', translationKey: 'nav.regenerativeSkills', path: '/learn/skills' },
  { id: 'change-patterns', feature: 'change-patterns', icon: 'Zap', translationKey: 'nav.changePatterns', path: '/learn/patterns' },
  { id: 'metamodels', feature: 'metamodels', icon: 'Layers', translationKey: 'nav.metamodels', path: '/learn/metamodels' },
  { id: 'tools', feature: 'tools', icon: 'BarChart2', translationKey: 'nav.tools', path: '/tools' },
  { id: 'graph', feature: 'graph', icon: 'Network', translationKey: 'nav.graph', path: '/graph' },
  { id: 'reflect', feature: 'reflect', icon: 'Zap', translationKey: 'nav.reflect', path: '/reflect' },
  { id: 'compass', feature: 'compass', icon: 'Compass', translationKey: 'nav.compass', path: '/compass' },
  { id: 'lifewheel', feature: 'lifewheel', icon: 'Compass', translationKey: 'nav.lifewheel', path: '/reflect/lifewheel' },
  { id: 'reflect-checkin', feature: 'reflect-checkin', icon: 'Zap', translationKey: 'nav.reflectCheckin', path: '/reflect?tab=checkin' },
  { id: 'reflect-deep', feature: 'reflect-deep', icon: 'Compass', translationKey: 'nav.reflectDeep', path: '/reflect?tab=deep' },
  { id: 'planet', feature: 'planet', icon: 'Globe', translationKey: 'nav.planet', path: '/planet' },
  { id: 'platform-intro', feature: 'platform-intro', icon: 'Info', translationKey: 'nav.platformIntro', path: '/about' },
  { id: 'growth-hub', feature: 'growth-hub', icon: 'Sprout', translationKey: 'nav.growthHub', path: '/growth' },
  { id: 'social-issues', feature: 'social-issues', icon: 'AlertTriangle', translationKey: 'nav.socialIssues', path: '/social-issues' },
  { id: 'signals', feature: 'signals', icon: 'Radio', translationKey: 'nav.signals', path: '/signals' },
  { id: 'contribute', feature: 'contribute', icon: 'Gift', translationKey: 'nav.contribute', path: '/contribute' },
  { id: 'contribute-find', feature: 'contribute-find', icon: 'Search', translationKey: 'nav.contributeFind', path: '/contribute/find' },
  { id: 'kanban', feature: 'kanban', icon: 'Kanban', translationKey: 'nav.tasks', path: '/tasks' },
  { id: 'pitch', feature: 'pitch', icon: 'Lightbulb', translationKey: 'nav.pitch', path: '/pitch' },
  { id: 'contribute-offer', feature: 'contribute-offer', icon: 'Gift', translationKey: 'nav.contributeOffer', path: '/contribute/offer/new' },
  { id: 'canvas', feature: 'canvas', icon: 'LayoutDashboard', translationKey: 'nav.canvas', path: '/canvas' },
  { id: 'energy', feature: 'energy', icon: 'Zap', translationKey: 'nav.energy', path: '/energy' },
  { id: 'volunteer', feature: 'volunteer', icon: 'HeartHandshake', translationKey: 'nav.volunteer', path: '/volunteer' },
  { id: 'scheduling', feature: 'scheduling', icon: 'CalendarClock', translationKey: 'nav.scheduling', path: '/meet' },
  { id: 'value-compass', feature: 'value-compass', icon: 'Compass', translationKey: 'nav.valueCompass', path: '/reflect/values' },
  { id: 'principles', feature: 'principles', icon: 'Star', translationKey: 'nav.principles', path: '/reflect/principles' },
  { id: 'helpers', feature: 'helpers', icon: 'Heart', translationKey: 'nav.helpers', path: '/reflect/helpers' },
  { id: 'connect-nature', feature: 'connect-nature', icon: 'Sprout', translationKey: 'nav.connectNature', path: '/connect-nature' },
  { id: 'coachme', feature: 'coachme', icon: 'Heart', translationKey: 'coachme:nav.coachme', path: '/coachme' },
  { id: 'learning-central', feature: 'learning-central', icon: 'BookOpen', translationKey: 'nav.learningCentral', path: '/learning' },
  { id: 'draw', feature: 'draw', icon: 'PenLine', translationKey: 'nav.draw', path: '/draw' },
  { id: 'governance', feature: 'governance', icon: 'ShieldCheck', translationKey: 'nav.governance', path: '/about/governance' },
  { id: 'cases', feature: 'cases', icon: 'BookOpen', translationKey: 'nav.cases', path: '/cases' },
];

/**
 * Connect menu group — default orientation: receiving (what do I need?)
 */
export const connectMenuGroup: MenuGroup = {
  id: 'connect',
  labelKey: 'modalities:menu.connect',
  descriptionKey: 'modalities:menu.connectSubtitle',
  items: [
    { id: 'planet', feature: 'planet', icon: 'Globe', translationKey: 'nav.planet', path: '/planet' },
    { id: 'communities', feature: 'communities', icon: 'Users', translationKey: 'nav.communities', path: '/communities' },
    { id: 'connections', feature: 'connections', icon: 'Heart', translationKey: 'nav.connections', path: '/connections' },
    { id: 'growth-hub', feature: 'growth-hub', icon: 'Sprout', translationKey: 'nav.growthHub', path: '/growth' },
  ],
};

export const actMenuGroup: MenuGroup = {
  id: 'act',
  labelKey: 'modalities:menu.act',
  descriptionKey: 'modalities:menu.actSubtitle',
  items: [
    { id: 'kanban', feature: 'kanban', icon: 'Kanban', translationKey: 'nav.tasks', path: '/tasks' },
    { id: 'pitch', feature: 'pitch', icon: 'Lightbulb', translationKey: 'nav.pitch', path: '/pitch' },
    { id: 'contribute', feature: 'contribute', icon: 'Gift', translationKey: 'nav.contribute', path: '/contribute' },
    { id: 'scheduling', feature: 'scheduling', icon: 'CalendarClock', translationKey: 'nav.scheduling', path: '/meet' },
  ],
};

export const toolsMenuGroup: MenuGroup = {
  id: 'tools',
  labelKey: 'nav.tools',
  descriptionKey: 'nav.toolsSubtitle',
  items: [
    { id: 'canvas', feature: 'canvas', icon: 'LayoutDashboard', translationKey: 'nav.canvas', path: '/canvas' },
    { id: 'draw', feature: 'draw', icon: 'PenLine', translationKey: 'nav.draw', path: '/draw' },
    { id: 'energy', feature: 'energy', icon: 'Zap', translationKey: 'nav.energy', path: '/energy' },
    { id: 'kanban', feature: 'kanban', icon: 'Kanban', translationKey: 'nav.tasks', path: '/tasks' },
  ],
};

const mainNavFeatures: Feature[] = [
  'platform-intro', 'cases', 'feed',
  'compass', 'reflect-checkin', 'reflect-deep', 'coachme', 'connections', 'video', 'events', 'communities', 'matchmaking', 'connect-nature', 'planet', 'helpers',
  'learning-central', 'stories', 'causes',
  'map', 'social-issues', 'signals', 'energy',
  'tools', 'graph', 'draw', 'canvas',
  'growth-hub', 'contribute',
  'kanban', 'pitch', 'scheduling',
  'calendar',
];

const mapNavFeatures: Feature[] = ['map', 'social-issues', 'signals', 'energy'];

const userMenuFeatures = new Set<Feature>(['profile', 'favorites', 'settings']);

type VisibilityOpts = { cmapLevel?: number | null; userPrefs?: UserPrefs | null };

export function getMenuItems(profileType: ProfileType): MenuItem[] {
  return allMenuItems.filter(item => canAccess(profileType, item.feature));
}

export function getMainNavItems(profileType: ProfileType, opts?: VisibilityOpts): MenuItem[] {
  const { cmapLevel, userPrefs } = opts ?? {};
  return mainNavFeatures
    .map(f => allMenuItems.find(m => m.feature === f))
    .filter((item): item is MenuItem => !!item && resolveNavVisibility(item.feature, profileType, cmapLevel, userPrefs));
}

export function getMapNavItems(profileType: ProfileType, opts?: VisibilityOpts): MenuItem[] {
  const { cmapLevel, userPrefs } = opts ?? {};
  return mapNavFeatures
    .map(f => allMenuItems.find(m => m.feature === f))
    .filter((item): item is MenuItem => !!item && resolveNavVisibility(item.feature, profileType, cmapLevel, userPrefs));
}

export function getUserMenuItems(profileType: ProfileType): MenuItem[] {
  return allMenuItems
    .filter(item => userMenuFeatures.has(item.feature))
    .filter(item => canAccess(profileType, item.feature));
}
