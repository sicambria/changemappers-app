import { prisma, SystemKillSwitch, AuditAction } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';

export type KillSwitchFeature =
  | 'activityPubEnabled'
  | 'lanDiscoveryEnabled'
  | 'externalExportsEnabled'
  | 'userRegistrationEnabled'
  | 'rssFetchingEnabled';

let cachedSwitches: SystemKillSwitch | null = null;
let lastFetch = 0;
const CACHE_TTL = 30000; // 30 seconds

// Fail-closed: when the DB is unreachable, all risky features are disabled.
// Previously this was all-true (fail-open), meaning a DB outage silently
// re-enabled features that an operator had explicitly shut down.
const DEFAULT_SWITCHES: SystemKillSwitch = {
  id: 'singleton',
  activityPubEnabled: false,
  lanDiscoveryEnabled: false,
  externalExportsEnabled: false,
  userRegistrationEnabled: false,
  rssFetchingEnabled: false,
  updatedAt: new Date(),
};

/**
 * Fetches the global kill switch configuration.
 * Uses a short-lived in-memory cache to minimize database load.
 * Falls back to all-disabled (fail-closed) defaults when the database is unavailable,
 * so a DB outage cannot silently re-enable restricted features.
 */
export async function getKillSwitches(): Promise<SystemKillSwitch> {
  const now = Date.now();
  if (cachedSwitches && now - lastFetch < CACHE_TTL) {
    return cachedSwitches;
  }

  try {
    const switches = await prisma.systemKillSwitch.findUnique({
      where: { id: 'singleton' },
      select: {
        id: true,
        activityPubEnabled: true,
        lanDiscoveryEnabled: true,
        externalExportsEnabled: true,
        userRegistrationEnabled: true,
        rssFetchingEnabled: true,
        updatedAt: true,
      },
    });

    if (!switches) {
      try {
        const initial = await prisma.systemKillSwitch.create({
          data: DEFAULT_SWITCHES,
        });
        cachedSwitches = initial ?? DEFAULT_SWITCHES;
        lastFetch = now;
        return cachedSwitches;
      } catch {
        return DEFAULT_SWITCHES;
      }
    }

    cachedSwitches = switches;
    lastFetch = now;
    return switches;
  } catch {
    return DEFAULT_SWITCHES;
  }
}

/**
 * Checks if a specific feature is globally enabled.
 */
export async function isFeatureEnabled(feature: KillSwitchFeature): Promise<boolean> {
  const switches = await getKillSwitches();
  return switches[feature] ?? false;
}

/**
 * Toggles a global kill switch.
 * Requires a mandatory reasoning (min 20 characters) and logs the action to AuditLog.
 */
export async function toggleKillSwitch(input: {
  feature: KillSwitchFeature;
  enabled: boolean;
  reasoning: string;
  userId: string;
  userEmail: string;
}): Promise<{ success: boolean; error?: string }> {
  const { feature, enabled, reasoning, userId, userEmail } = input;

  if (!reasoning || reasoning.trim().length < 20) {
    return { success: false, error: 'security.minCharsError' };
  }

  // Get current state before update for audit logging
  const previous = await getKillSwitches();

  try {
    const updated = await prisma.systemKillSwitch.update({
      where: { id: 'singleton' },
      data: { [feature]: enabled },
      select: {
        id: true,
        activityPubEnabled: true,
        lanDiscoveryEnabled: true,
        externalExportsEnabled: true,
        userRegistrationEnabled: true,
        rssFetchingEnabled: true,
        updatedAt: true,
      },
    });

    // Invalidate local cache
    cachedSwitches = updated;
    lastFetch = Date.now();

    // Log the action
    await createAuditLog({
      userId,
      userEmail,
      action: AuditAction.KILL_SWITCH_TOGGLE,
      entityType: 'SystemKillSwitch',
      entityId: 'singleton',
      previousState: { [feature]: previous[feature] },
      newState: { [feature]: enabled },
      metadata: { reasoning: reasoning.trim() },
    });

    return { success: true };
  } catch (error) {
    console.error(`[kill-switch] Failed to toggle ${feature}:`, error);
    return { success: false, error: 'security.error' };
  }
}

/**
 * Internal helper to clear cache for testing purposes.
 */
export function clearKillSwitchCacheForTests() {
  cachedSwitches = null;
  lastFetch = 0;
}
