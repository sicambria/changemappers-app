// Demo-seed geography data and pure helpers shared by the admin seed actions.
import { DEMO_BATCH_PREFIX } from "@/types/demo-seed";

export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Budapest: { lat: 47.4979, lng: 19.0402 },
  Pusztaszer: { lat: 46.7667, lng: 20.15 },
  Gömörszőlős: { lat: 48.2167, lng: 19.9167 },
  Őrség: { lat: 46.85, lng: 16.25 },
  Aszaló: { lat: 48.15, lng: 20.85 },
  Jánoshida: { lat: 47.4, lng: 20.3 },
  Lovasberény: { lat: 47.2667, lng: 18.3833 },
  Fót: { lat: 47.6167, lng: 19.2 },
  Mozsgó: { lat: 46.15, lng: 17.75 },
  Terény: { lat: 47.9167, lng: 19.3667 },
  Polgár: { lat: 47.85, lng: 21.1167 },
  Zsámbék: { lat: 47.55, lng: 18.7167 },
  Kóspallag: { lat: 47.8833, lng: 18.75 },
  Szombathely: { lat: 47.2308, lng: 16.6217 },
  Zalaegerszeg: { lat: 46.8417, lng: 16.8417 },
  Pápa: { lat: 47.3317, lng: 17.4717 },
  Csákvár: { lat: 47.4, lng: 18.5833 },
  Tata: { lat: 47.6417, lng: 18.6417 },
  Szomód: { lat: 47.7, lng: 18.5 },
  Pécs: { lat: 46.0727, lng: 18.233 },
  Mohács: { lat: 45.9717, lng: 18.6817 },
  Kaposvár: { lat: 46.3667, lng: 17.8 },
  Szekszárd: { lat: 46.3483, lng: 18.705 },
  Gödöllő: { lat: 47.6, lng: 19.3667 },
  Esztergom: { lat: 47.7833, lng: 18.7417 },
  Szolnok: { lat: 47.1833, lng: 20.1833 },
  Kecskemét: { lat: 46.9063, lng: 19.6926 },
  Miskolc: { lat: 48.1035, lng: 20.7784 },
  Debrecen: { lat: 47.5316, lng: 21.6244 },
  Nyíregyháza: { lat: 47.9495, lng: 21.7244 },
  Békéscsaba: { lat: 46.6767, lng: 21.1017 },
  Szeged: { lat: 46.253, lng: 20.1414 },
  Székesfehérvár: { lat: 47.186, lng: 18.4221 },
  Győr: { lat: 47.6875, lng: 17.6504 },
  Dinnyeberki: { lat: 46.1667, lng: 18.05 },
  Nagyszékely: { lat: 46.5333, lng: 18.4167 },
  Galgahévíz: { lat: 47.6167, lng: 19.55 },
  Siklós: { lat: 45.8517, lng: 18.295 },
  Siófok: { lat: 46.9083, lng: 18.045 },
  Ráckeve: { lat: 47.15, lng: 18.95 },
  Bátonyterenye: { lat: 47.9167, lng: 19.85 },
  Bölcske: { lat: 46.85, lng: 18.9667 },
  Bonyhád: { lat: 46.2667, lng: 18.4 },
  Dombóvár: { lat: 46.3667, lng: 18.2 },
};

export function resolveCityCoords(city: string): { lat: number; lng: number } | null {
  const firstCity = city.split(",")[0].split("(")[0].trim();
  return CITY_COORDS[firstCity] || null;
}

export function resolveEventCoords(
  location: string,
): { lat: number; lng: number } | null {
  const firstWord = location.split(",")[0].split("(")[0].trim();
  return CITY_COORDS[firstWord] || null;
}

export const DEFAULT_DEMO_LOCATION = {
  name: "Budapest",
  lat: 47.4979,
  lng: 19.0402,
};

export function withDemoPrefix(value: string): string {
  return value.startsWith(DEMO_BATCH_PREFIX)
    ? value
    : `${DEMO_BATCH_PREFIX}${value}`;
}

export function resolveDemoCoords(input: {
  latitude?: number;
  longitude?: number;
  place?: string;
}): { lat: number; lng: number; locationName: string } {
  const hasLat = input.latitude != null;
  const hasLng = input.longitude != null;

  if (hasLat !== hasLng) {
    throw new Error("Latitude and longitude must be provided together.");
  }

  if (hasLat && hasLng) {
    const latitude = input.latitude ?? Number.NaN;
    const longitude = input.longitude ?? Number.NaN;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new TypeError("Latitude and longitude must be valid numbers.");
    }

    return {
      lat: latitude,
      lng: longitude,
      locationName: input.place?.trim() || DEFAULT_DEMO_LOCATION.name,
    };
  }

  const resolved = input.place ? resolveCityCoords(input.place) : null;
  return {
    lat: resolved?.lat ?? DEFAULT_DEMO_LOCATION.lat,
    lng: resolved?.lng ?? DEFAULT_DEMO_LOCATION.lng,
    locationName: input.place?.trim() || DEFAULT_DEMO_LOCATION.name,
  };
}
export const DEMO_EMAIL_SUFFIX = "@demo.changemappers.local";
