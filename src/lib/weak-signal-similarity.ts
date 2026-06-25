import type { WeakSignal } from '@/types/weak-signal';

interface SimilarSignalResult {
  signal: WeakSignal;
  score: number;
  breakdown: {
    tagOverlap: number;
    domainMatch: number;
    scaleMatch: number;
    geoProximity: number;
    levelAlignment: number;
  };
}

function jaccardCoefficient(setA: string[], setB: string[]): number {
  if (setA.length === 0 && setB.length === 0) return 0;
  const a = new Set(setA);
  const b = new Set(setB);
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function geoProximityScore(
  source: WeakSignal,
  candidate: WeakSignal
): number {
  if (!source.isLocalizable || !candidate.isLocalizable) return 0;
  if (source.latitude == null || source.longitude == null) return 0;
  if (candidate.latitude == null || candidate.longitude == null) return 0;

  const distance = haversineDistanceKm(
    source.latitude,
    source.longitude,
    candidate.latitude,
    candidate.longitude
  );

  if (distance <= 50) return 1;
  if (distance <= 100) return 0.7;
  if (distance <= 250) return 0.4;
  if (distance <= 500) return 0.2;
  return 0;
}

function levelAlignmentScore(
  source: WeakSignal,
  candidate: WeakSignal
): number {
  let matches = 0;
  let total = 0;
  if (source.confidence && candidate.confidence) {
    total += 1;
    if (source.confidence === candidate.confidence) matches += 1;
  }
  if (source.novelty && candidate.novelty) {
    total += 1;
    if (source.novelty === candidate.novelty) matches += 1;
  }
  return total === 0 ? 0 : matches / total;
}

export function computeSimilarityScore(
  source: WeakSignal,
  candidate: WeakSignal
): { score: number; breakdown: SimilarSignalResult['breakdown'] } {
  const tagOverlap = jaccardCoefficient(source.tags ?? [], candidate.tags ?? []);
  const domainMatch = source.domain === candidate.domain ? 1 : 0;
  const scaleMatch = source.scale === candidate.scale ? 1 : 0;
  const geoProximity = geoProximityScore(source, candidate);
  const levelAlignment = levelAlignmentScore(source, candidate);

  const score =
    0.4 * tagOverlap +
    0.3 * domainMatch +
    0.15 * scaleMatch +
    0.1 * geoProximity +
    0.05 * levelAlignment;

  return {
    score,
    breakdown: {
      tagOverlap,
      domainMatch,
      scaleMatch,
      geoProximity,
      levelAlignment,
    },
  };
}

export function findSimilarSignals(
  source: WeakSignal,
  candidates: WeakSignal[],
  limit = 6
): SimilarSignalResult[] {
  return candidates
    .filter((c) => c.id !== source.id)
    .map((candidate) => {
      const { score, breakdown } = computeSimilarityScore(source, candidate);
      return { signal: candidate, score, breakdown };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export { jaccardCoefficient, haversineDistanceKm, geoProximityScore, levelAlignmentScore };
