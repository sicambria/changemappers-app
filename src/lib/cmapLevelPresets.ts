/**
 * CMAP-level default visibility presets for main nav features.
 * Based on docs/product/menu-logic.md — "Default Presets by Changemaker Level".
 *
 * These sets represent *which features are shown by default* at each tier.
 * They are recommendation guidance only — users can override any item in Profile → Settings.
 * CHANGEMAPPER role always sees all features regardless of level.
 */

import type { Feature } from '@/lib/featureAccess';

// Level 0-2: orientation, reflection, learning, local community
const LEVEL_0_2: ReadonlySet<Feature> = new Set([
  'feed', 'platform-intro', 'cases',
  'compass', 'reflect-checkin', 'reflect-deep',
  'events', 'communities', 'causes', 'social-issues', 'planet',
  'learning-central', 'stories',
  'map', 'connect-nature',
]);

// Level 3-4: peer solidarity, growth tools, guidance
const LEVEL_3_4: ReadonlySet<Feature> = new Set([
  ...LEVEL_0_2,
  'growth-hub', 'connections', 'video', 'matchmaking', 'coachme', 'helpers',
]);

// Level 5-6: coordination, contribution, systems tools
const LEVEL_5_6: ReadonlySet<Feature> = new Set([
  ...LEVEL_3_4,
  'contribute', 'energy', 'tools', 'graph', 'canvas',
  'kanban', 'pitch', 'scheduling', 'calendar',
]);

// Level 7-9: advanced monitoring, creative and stewardship tools
const LEVEL_7_9: ReadonlySet<Feature> = new Set([
  ...LEVEL_5_6,
  'signals', 'draw',
]);

export function getLevelPreset(cmapLevel: number | null = 0): ReadonlySet<Feature> {
  // A `null` argument coerces to 0 in the numeric `>=` comparisons (all false),
  // so it falls through to LEVEL_0_2 — identical to the previous `cmapLevel ?? 0`.
  const level = cmapLevel ?? 0;
  if (level >= 7) return LEVEL_7_9;
  if (level >= 5) return LEVEL_5_6;
  if (level >= 3) return LEVEL_3_4;
  return LEVEL_0_2;
}
