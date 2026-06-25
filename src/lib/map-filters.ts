// Shared map filter/availability helpers (used by DiscoveryMap and PlanetViewerClient).

/**
 * Returns true when the opaque `availabilityDetails` object marks the given
 * `"day-time"` slot as available.
 */
export function hasAvailabilitySlot(availabilityDetails: unknown, slot: string): boolean {
    const [day, time] = slot.split('-');
    if (!day || !time || !availabilityDetails || typeof availabilityDetails !== 'object' || Array.isArray(availabilityDetails)) return false;

    const value = (availabilityDetails as Record<string, unknown>)[day];
    return Array.isArray(value) && value.includes(time);
}
