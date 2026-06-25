'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { RadioIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getWeakSignalsTimeline } from '@/app/actions/weak-signal';
import type { WeakSignal, SignalDomain, SignalScale, SignalConfidence } from '@/types/weak-signal';

type GroupBy = 'day' | 'week' | 'month';

function getDateKey(date: Date, groupBy: GroupBy): string {
  const d = new Date(date);
  switch (groupBy) {
    case 'day':
      return d.toISOString().split('T')[0];
    case 'week': {
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay());
      return start.toISOString().split('T')[0];
    }
    case 'month':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }
}

function formatDateKey(key: string, groupBy: GroupBy, locale: string): string {
  if (groupBy === 'month') {
    const [year, month] = key.split('-');
    return new Date(Number(year), Number(month) - 1).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
    });
  }
  return new Date(key + 'T00:00:00').toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getDomainColor(domain: SignalDomain): string {
  const colors: Record<string, string> = {
    EDUCATION: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    GOVERNANCE: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    FOOD: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    TECHNOLOGY: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    HEALTH: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    ECONOMY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    ECOLOGY: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    CULTURE: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    ENERGY: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    HOUSING: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    TRANSPORT: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    MEDIA: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    JUSTICE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    FINANCE: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };
  return colors[domain] || colors.OTHER;
}

const DOMAIN_OPTIONS: SignalDomain[] = [
  'EDUCATION', 'GOVERNANCE', 'FOOD', 'TECHNOLOGY', 'HEALTH',
  'ECONOMY', 'ECOLOGY', 'CULTURE', 'ENERGY', 'HOUSING',
  'TRANSPORT', 'MEDIA', 'JUSTICE', 'FINANCE', 'OTHER',
];

export function TimelineClient() {
  const { t, i18n } = useTranslation('signals');
  const dateLocale = i18n.resolvedLanguage || 'en';
  const [signals, setSignals] = useState<WeakSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [groupBy, setGroupBy] = useState<GroupBy>('week');
  const [selectedDomain, setSelectedDomain] = useState<SignalDomain | ''>('');
  const [selectedScale, setSelectedScale] = useState<SignalScale | ''>('');
  const [selectedConfidence, setSelectedConfidence] = useState<SignalConfidence | ''>('');

  const PAGE_SIZE = 30;

  const loadSignals = useCallback(async (currentSkip: number, append = false) => {
    setIsLoading(true);
    const result = await getWeakSignalsTimeline({
      domain: selectedDomain || undefined,
      scale: selectedScale || undefined,
      confidence: selectedConfidence || undefined,
      skip: currentSkip,
      take: PAGE_SIZE,
    });

    if (result.success && result.data) {
      setSignals((prev) => append ? [...prev, ...result.data] : result.data);
      setHasMore(result.data.length === PAGE_SIZE);
    } else {
      if (!append) setSignals([]);
      setHasMore(false);
    }
    setIsLoading(false);
  }, [selectedDomain, selectedScale, selectedConfidence]);

  useEffect(() => {
    setSkip(0);
    loadSignals(0, false);
  }, [loadSignals]);

  const loadMore = () => {
    const newSkip = skip + PAGE_SIZE;
    setSkip(newSkip);
    loadSignals(newSkip, true);
  };

  const grouped: Record<string, WeakSignal[]> = {};
  signals.forEach((signal) => {
    const key = getDateKey(signal.createdAt, groupBy);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(signal);
  });

  const sortedKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          {(['day', 'week', 'month'] as GroupBy[]).map((g) => (
            <Button
              key={g}
              variant={groupBy === g ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setGroupBy(g)}
            >
              {t(`timeline.${g}`)}
            </Button>
          ))}
        </div>

        <select
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value as SignalDomain | '')}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        >
          <option value="">{t('filters.domain')}</option>
          {DOMAIN_OPTIONS.map((d) => (
            <option key={d} value={d}>{t(`domains.${d}`)}</option>
          ))}
        </select>

        <select
          value={selectedScale}
          onChange={(e) => setSelectedScale(e.target.value as SignalScale | '')}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        >
          <option value="">{t('filters.scale')}</option>
          <option value="INDIVIDUAL">{t('scale.INDIVIDUAL')}</option>
          <option value="COMMUNITY">{t('scale.COMMUNITY')}</option>
          <option value="INSTITUTIONAL">{t('scale.INSTITUTIONAL')}</option>
          <option value="ECOSYSTEM">{t('scale.ECOSYSTEM')}</option>
        </select>

        <select
          value={selectedConfidence}
          onChange={(e) => setSelectedConfidence(e.target.value as SignalConfidence | '')}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        >
          <option value="">{t('filters.confidence')}</option>
          <option value="LOW">{t('confidence.LOW')}</option>
          <option value="MEDIUM">{t('confidence.MEDIUM')}</option>
          <option value="HIGH">{t('confidence.HIGH')}</option>
        </select>
      </div>

      {(() => {
      if (isLoading && signals.length === 0) return <div className="text-center py-12 text-gray-500">{t('common:loading')}</div>;
      if (sortedKeys.length === 0) return (
        <Card className="p-8 text-center">
          <RadioIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('empty.title')}
          </h3>
          <p className="text-gray-500">{t('empty.description')}</p>
        </Card>
      );
      return (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-emerald-200 dark:bg-emerald-800" />

          <div className="space-y-8">
            {sortedKeys.map((key) => (
              <div key={key}>
                <div className="sticky top-20 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-2 px-4 -mx-4">
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {formatDateKey(key, groupBy, dateLocale)}
                    <span className="ml-2 text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full">
                      {grouped[key].length}
                    </span>
                  </h2>
                </div>

                <div className="space-y-3 ml-12">
                  {grouped[key].map((signal) => (
                    <Link key={signal.id} href={`/signals/${signal.id}`}>
                      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 rounded-full bg-teal-100 dark:bg-teal-900/50">
                            <RadioIcon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {signal.title}
                            </h3>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              <span className={`px-1.5 py-0.5 text-xs rounded-full ${getDomainColor(signal.domain)}`}>
                                {t(`domains.${signal.domain}`)}
                              </span>
                            </div>
                            {signal.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {signal.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="text-center py-6 ml-12">
              <Button
                variant="secondary"
                onClick={loadMore}
                disabled={isLoading}
              >
                {isLoading ? t('common:loading') : t('timeline.loadMore')}
              </Button>
            </div>
          )}
        </div>
      );
      })()}
    </div>
  );
}
