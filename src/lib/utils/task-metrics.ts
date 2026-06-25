export type TaskMetrics = {
  cycleTime: number | null;
  leadTime: number | null;
  waitTime: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
};

export type AggregatedMetrics = {
  avgCycleTime: number | null;
  avgLeadTime: number | null;
  avgWaitTime: number | null;
  throughput: number;
  wip: number;
  flowEfficiency: number | null;
};

export function hoursToReadable(hours: number | null): string {
  if (hours === null) return 'N/A';
  
  if (hours < 24) {
    return `${hours}h`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d`;
  }
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `${weeks}w`;
  }
  
  const months = Math.floor(days / 30);
  return `${months}mo`;
}

export function calculateFlowEfficiency(cycleTime: number, leadTime: number): number | null {
  if (leadTime === 0) return null;
  return (cycleTime / leadTime) * 100;
}

export function getMetricColor(value: number, thresholds: { good: number; warning: number }): string {
  if (value <= thresholds.good) return 'text-green-400';
  if (value <= thresholds.warning) return 'text-amber-400';
  return 'text-red-400';
}

export function getBlockedStatus(updatedAt: Date): { isBlocked: boolean; daysBlocked: number } {
  const now = new Date();
  const diffMs = now.getTime() - updatedAt.getTime();
  const daysBlocked = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return {
    isBlocked: daysBlocked > 30,
    daysBlocked,
  };
}
