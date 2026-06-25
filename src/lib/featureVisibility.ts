/**
 * 4-layer feature-visibility resolver (docs/product/menu-logic.md):
 *
 *   1. Role floor  — canAccess(profileType, feature)
 *   2. Level preset — CMAP level selects default visible set (CHANGEMAPPER always visible)
 *   3. User override — explicit show/hide stored in featureVisibilityPreferences
 *   4. Operational set — implicit; only items in menuConfig.mainNavFeatures are candidates
 *
 * This module is pure (no I/O, no DB) so it is fully unit-testable.
 */

import { canAccess, type Feature, type ProfileType } from '@/lib/featureAccess';
import { getLevelPreset } from '@/lib/cmapLevelPresets';

export type UserPrefs = Record<string, boolean>;

export function resolveNavVisibility(
  feature: Feature,
  profileType: ProfileType,
  cmapLevel: number | null | undefined,
  userPrefs: UserPrefs | null | undefined,
): boolean {
  // Layer 1: role floor — hard gate
  if (!canAccess(profileType, feature)) return false;

  // Layer 3: user override — takes precedence over preset
  if (userPrefs && feature in userPrefs) return userPrefs[feature];

  // Layer 2: level presets only apply to COMMUNITY_SEEKER progression.
  // CHANGEMAPPER sees all role-allowed features; GUEST has a small fixed role set.
  if (profileType !== 'COMMUNITY_SEEKER') return true;

  // Layer 2: level preset for COMMUNITY_SEEKER
  return getLevelPreset(cmapLevel).has(feature);
}
