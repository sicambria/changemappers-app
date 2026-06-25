

/**
 * Calculates a decay multiplier for matchmaking scores based on how long ago
 * the user last updated their functional profile (or was created).
 * Implementation of the "Match Decay Algorithm" from PEER-SYSTEM.md.
 * 
 * - Standard: 1.0 (0-14 days)
 * - Noticeable Decay: 0.9 (14-30 days)
 * - Strong Decay: 0.7 (30+ days)
 */
export function calculateFreshnessDecay(lastUpdatedAt: Date | null | undefined): number {
    if (!lastUpdatedAt) return 0.7; // Unknown freshness defaults to strong decay

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastUpdatedAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) {
        return 0.7; // -30%
    } else if (diffDays > 14) {
        return 0.9; // -10%
    }
    return 1;
}

/**
 * L1 Pulse Trigger check.
 * Checks if the user has been static for over 3 months without an availability update.
 * If true, the frontend can render a toast/modal asking "Are you still heads-down building?"
 */
export function needsAvailabilityPulse(profile: { functionsUpdatedAt: Date | null | undefined } | null | undefined): boolean {
    if (!profile) return false;

    // If they are explicitly in REFLECTING or RESTING long-term, maybe we don't bother them as much,
    // but the spec says "static for over 3 months" applies generally.
    const lastUpdate = profile.functionsUpdatedAt;
    if (!lastUpdate) return false;

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastUpdate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 90; // 3 months
}
