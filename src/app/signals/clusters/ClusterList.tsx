'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RadioIcon, ChevronDownIcon, ChevronUpIcon, SparklesIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getWeakSignals } from '@/app/actions/weak-signal';
import { findClusters } from '@/lib/weak-signal-clustering';
import type { WeakSignal, SignalCluster as SignalClusterType } from '@/types/weak-signal';
import { promoteClusterToPattern } from '@/app/actions/weak-signal-pattern';

export function ClusterList() {
  const { t } = useTranslation('signals');
  const [clusters, setClusters] = useState<SignalClusterType[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);

  useEffect(() => {
    async function loadClusters() {
      try {
        const result = await getWeakSignals({ take: 200 });
        if (result.success && result.data) {
          const found = findClusters(result.data);
          setClusters(found as unknown as SignalClusterType[]);
        }
      } finally {
        setLoading(false);
      }
    }
    loadClusters();
  }, []);

  const handlePromote = async (cluster: SignalClusterType) => {
    setPromoting(cluster.id);
    try {
      await promoteClusterToPattern({
        name: `${cluster.domain} — Cluster Pattern`,
        description: t('clusters.autoDescription', {
          domain: cluster.domain,
          count: cluster.signalCount,
          tags: cluster.sharedTags?.join(', ') ?? '',
        }),
        trajectory: 'EMERGING',
        signalIds: cluster.signalIds ?? [],
      });
    } finally {
      setPromoting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {['sk-1', 'sk-2', 'sk-3'].map((id) => (
          <div key={id} className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-2xl h-32" />
        ))}
      </div>
    );
  }

  if (clusters.length === 0) {
    return (
      <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center">
        <RadioIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">{t('clusters.noClusters')}</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('clusters.noClustersHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {clusters.map((cluster) => {
        const isExpanded = expandedId === cluster.id;
        const canPromote = (cluster.signalCount ?? 0) >= 5;
        return (
          <Card key={cluster.id} className="rounded-2xl border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-300">
            <div // NOSONAR(S6819) — role="button" trigger with nested button children (button-in-button blocked); a native button wrapper would be invalid button-in-button — role=button + tabIndex + keyboard handlers cover interaction
              className="p-4 cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : cluster.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setExpandedId(isExpanded ? null : cluster.id); }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded">
                    <RadioIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
                        {cluster.domain}
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {t('clusters.signalCount', { count: cluster.signalCount })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(cluster.sharedTags ?? []).map((tag: string) => (
                        <Badge key={tag} className="rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canPromote && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handlePromote(cluster); }}
                      disabled={promoting === cluster.id}
                    >
                      <SparklesIcon className="h-4 w-4 mr-1" />
                      {promoting === cluster.id ? t('clusters.promoting') : t('clusters.promoteToPattern')}
                    </Button>
                  )}
                  {isExpanded ? <ChevronUpIcon className="h-5 w-5 text-gray-400" /> : <ChevronDownIcon className="h-5 w-5 text-gray-400" />}
                </div>
              </div>
            </div>

            {isExpanded && (cluster.signals as unknown as WeakSignal[])?.length > 0 && (
              <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(cluster.signals as unknown as WeakSignal[]).map((signal) => (
                    <div key={signal.id} className="rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">{signal.title}</h4>
                      <div className="flex gap-1.5 mt-1">
                        <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                          {signal.confidence}
                        </span>
                        <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300">
                          {signal.novelty}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
