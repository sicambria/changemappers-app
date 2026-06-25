export type CountryCentroid = {
  latitude: number;
  longitude: number;
};

const COUNTRY_CENTROIDS: Record<string, CountryCentroid> = {
  argentina: { latitude: -38.4161, longitude: -63.6167 },
  australia: { latitude: -25.2744, longitude: 133.7751 },
  austria: { latitude: 47.5162, longitude: 14.5501 },
  belgium: { latitude: 50.5039, longitude: 4.4699 },
  brazil: { latitude: -14.235, longitude: -51.9253 },
  canada: { latitude: 56.1304, longitude: -106.3468 },
  chile: { latitude: -35.6751, longitude: -71.543 },
  china: { latitude: 35.8617, longitude: 104.1954 },
  colombia: { latitude: 4.5709, longitude: -74.2973 },
  croatia: { latitude: 45.1, longitude: 15.2 },
  czechia: { latitude: 49.8175, longitude: 15.473 },
  denmark: { latitude: 56.2639, longitude: 9.5018 },
  estonia: { latitude: 58.5953, longitude: 25.0136 },
  finland: { latitude: 61.9241, longitude: 25.7482 },
  france: { latitude: 46.2276, longitude: 2.2137 },
  germany: { latitude: 51.1657, longitude: 10.4515 },
  greece: { latitude: 39.0742, longitude: 21.8243 },
  hungary: { latitude: 47.1625, longitude: 19.5033 },
  india: { latitude: 20.5937, longitude: 78.9629 },
  indonesia: { latitude: -0.7893, longitude: 113.9213 },
  ireland: { latitude: 53.4129, longitude: -8.2439 },
  italy: { latitude: 41.8719, longitude: 12.5674 },
  japan: { latitude: 36.2048, longitude: 138.2529 },
  mexico: { latitude: 23.6345, longitude: -102.5528 },
  netherlands: { latitude: 52.1326, longitude: 5.2913 },
  norway: { latitude: 60.472, longitude: 8.4689 },
  poland: { latitude: 51.9194, longitude: 19.1451 },
  portugal: { latitude: 39.3999, longitude: -8.2245 },
  romania: { latitude: 45.9432, longitude: 24.9668 },
  serbia: { latitude: 44.0165, longitude: 21.0059 },
  slovakia: { latitude: 48.669, longitude: 19.699 },
  slovenia: { latitude: 46.1512, longitude: 14.9955 },
  spain: { latitude: 40.4637, longitude: -3.7492 },
  sweden: { latitude: 60.1282, longitude: 18.6435 },
  switzerland: { latitude: 46.8182, longitude: 8.2275 },
  turkey: { latitude: 38.9637, longitude: 35.2433 },
  ukraine: { latitude: 48.3794, longitude: 31.1656 },
  'united kingdom': { latitude: 55.3781, longitude: -3.436 },
  'united states': { latitude: 37.0902, longitude: -95.7129 },
};

const COUNTRY_ALIASES: Record<string, string> = {
  magyarorszag: 'hungary',
  magyarország: 'hungary',
  usa: 'united states',
  'u.s.a.': 'united states',
  'us': 'united states',
  'u.s.': 'united states',
  uk: 'united kingdom',
  'great britain': 'united kingdom',
};

function normalizeCountryName(country: string): string {
  const normalized = country.trim().toLowerCase();
  return COUNTRY_ALIASES[normalized] ?? normalized;
}

export function getCountryCentroid(country: string | null | undefined): CountryCentroid | null {
  if (!country?.trim()) return null;
  return COUNTRY_CENTROIDS[normalizeCountryName(country)] ?? null;
}
