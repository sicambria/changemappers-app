import type { WeakSignal } from '@/types/weak-signal';

export interface SignalCluster {
  id: string;
  domain: string;
  signalIds: string[];
  signals: WeakSignal[];
  sharedTags: string[];
  signalCount: number;
  tagOverlapAverage: number;
  noveltyBonus: number;
  score: number;
  averageConfidence: string;
}

export function computeTagOverlap(tagsA: string[], tagsB: string[]): number {
  if (tagsA.length === 0 && tagsB.length === 0) return 0;
  const setA = new Set(tagsA);
  const setB = new Set(tagsB);
  const intersection = new Set([...setA].filter((t) => setB.has(t)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function computeNoveltyBonus(signals: WeakSignal[]): number {
  const noveltyValues: Record<string, number> = {
    COMMON: 0,
    UNCOMMON: 0.2,
    RARE: 0.5,
    NOVEL: 1,
  };
  const total = signals.reduce((sum, s) => sum + (noveltyValues[s.novelty] ?? 0), 0);
  return signals.length === 0 ? 0 : total / signals.length;
}

function computeAverageConfidence(signals: WeakSignal[]): string {
  const confidenceValues: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };
  const total = signals.reduce((sum, s) => sum + (confidenceValues[s.confidence] ?? 1), 0);
  const avg = signals.length === 0 ? 1 : total / signals.length;
  if (avg >= 2.5) return 'HIGH';
  if (avg >= 1.5) return 'MEDIUM';
  return 'LOW';
}

function findSharedTags(signals: WeakSignal[], minSignals: number): string[] {
  const tagCounts: Record<string, number> = {};
  for (const signal of signals) {
    const uniqueTags = new Set(signal.tags);
    for (const tag of uniqueTags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  return Object.entries(tagCounts)
    .filter(([, count]) => count >= minSignals)
    .map(([tag]) => tag);
}

function computeClusterTagOverlapAverage(signals: WeakSignal[], sharedTags: string[]): number {
  if (signals.length < 2 || sharedTags.length === 0) return 0;
  let totalOverlap = 0;
  let pairs = 0;
  for (let i = 0; i < signals.length; i++) {
    for (let j = i + 1; j < signals.length; j++) {
      totalOverlap += computeTagOverlap(signals[i].tags, signals[j].tags);
      pairs++;
    }
  }
  return pairs === 0 ? 0 : totalOverlap / pairs;
}

export function groupByDomain(signals: WeakSignal[]): Record<string, WeakSignal[]> {
  const groups: Record<string, WeakSignal[]> = {};
  for (const signal of signals) {
    const domain = signal.domain as string;
    if (!groups[domain]) groups[domain] = [];
    groups[domain].push(signal);
  }
  return groups;
}

export function scoreCluster(signals: WeakSignal[]): Omit<SignalCluster, 'id' | 'domain' | 'signalIds' | 'signals'> {
  const sharedTags = findSharedTags(signals, 2);
  const tagOverlapAverage = computeClusterTagOverlapAverage(signals, sharedTags);
  const noveltyBonus = computeNoveltyBonus(signals);
  const score = signals.length * tagOverlapAverage * (1 + noveltyBonus);
  const averageConfidence = computeAverageConfidence(signals);
  return {
    sharedTags,
    signalCount: signals.length,
    tagOverlapAverage,
    noveltyBonus,
    score,
    averageConfidence,
  };
}

export function findClusters(
  signals: WeakSignal[],
  minSignals: number = 3,
  minSharedTags: number = 2
): SignalCluster[] {
  const domainGroups = groupByDomain(signals);
  const clusters: SignalCluster[] = [];

  for (const [domain, domainSignals] of Object.entries(domainGroups)) {
    if (domainSignals.length < minSignals) continue;

    const sharedTags = findSharedTags(domainSignals, minSharedTags);
    if (sharedTags.length === 0) continue;

    const clusterSignals = domainSignals.filter(
      (s) => sharedTags.some((tag) => s.tags.includes(tag))
    );

    if (clusterSignals.length < minSignals) continue;

    const scored = scoreCluster(clusterSignals);
    clusters.push({
      id: `cluster-${domain}-${clusters.length}`,
      domain,
      signalIds: clusterSignals.map((s) => s.id),
      signals: clusterSignals,
      ...scored,
    });
  }

  return clusters.sort((a, b) => b.score - a.score);
}
