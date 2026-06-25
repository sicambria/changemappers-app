export type PersistedLocationPrecision = 'COUNTRY' | 'REGION' | 'CITY' | 'EXACT';

const LOCATION_PRECISION_DECIMALS: Record<PersistedLocationPrecision, number | null> = {
  COUNTRY: 0,
  REGION: 0,
  CITY: 2,
  EXACT: null,
};

function roundCoordinate(value: number, decimals: number | null): number {
  if (decimals === null) return value;
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function normalizeCoordinatesForPrecision(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  precision: PersistedLocationPrecision = 'COUNTRY',
): { latitude: number | null | undefined; longitude: number | null | undefined } {
  if (latitude == null || longitude == null) {
    return { latitude, longitude };
  }

  const decimals = LOCATION_PRECISION_DECIMALS[precision] ?? LOCATION_PRECISION_DECIMALS.REGION;
  return {
    latitude: roundCoordinate(latitude, decimals),
    longitude: roundCoordinate(longitude, decimals),
  };
}

