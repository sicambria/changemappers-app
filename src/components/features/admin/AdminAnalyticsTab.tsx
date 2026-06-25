'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { BarChartIcon, TrendingUpIcon, FilterIcon, CalendarIcon, UsersIcon } from 'lucide-react';

const PAGE_MODULES = [
  'TRAINING', 'MENTORING', 'PEER_SUPPORT', 'COACHING', 'CONTRIBUTION',
  'CANVAS', 'COORDINATE', 'PROFILE', 'COMMUNITY', 'EVENT', 'MAP', 'ADMIN',
  'FEED', 'CAUSES', 'REFLECT', 'COMPASS', 'LEARNING', 'MESSAGES', 'CONNECTIONS',
  'MATCHMAKING', 'SOCIAL_ISSUES', 'DASHBOARD', 'GROWTH', 'ENERGY', 'SCHEDULING',
  'TASKS', 'STORIES', 'GRAPH', 'VOLUNTEER', 'PITCH', 'OTHER',
] as const;
type PageModule = typeof PAGE_MODULES[number];

type Granularity = 'daily' | 'weekly' | 'monthly';

interface AnalyticsData {
  id: string;
  date?: Date;
  weekStart?: Date;
  monthStart?: Date;
  module: PageModule;
  visitCount: number;
  uniqueVisitors: number;
  archetypeBreakdown: Record<string, number>;
}


const ARCHETYPE_COLORS: Record<string, string> = {
  LOCAL_PRACTITIONER: '#10b981',
  NETWORK_WEAVER: '#3b82f6',
  INSTITUTIONAL_CHANGEMAKER: '#8b5cf6',
  GLOBAL_AMPLIFIER: '#f59e0b',
  RESOURCE_MOBILIZER: '#ef4444',
  INNOVATION_CATALYST: '#ec4899',
  SYSTEM_DISRUPTOR: '#6366f1',
  STRATEGIC_ADVISOR: '#14b8a6',
  MYCELIUM: '#84cc16',
  KEYSTONE: '#f97316',
  POLLINATOR: '#06b6d4',
  PRISM: '#a855f7',
  COMPOST: '#65a30d',
  SENTINEL: '#0ea5e9',
  ALCHEMIST: '#d946ef',
  CANOPY: '#22c55e',
  SPARK: '#eab308',
  ECHO: '#7c3aed',
  TIDE: '#0891b2',
  HORIZON: '#dc2626',
  UNKNOWN: '#6b7280',
};

export function AdminAnalyticsTab() {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [selectedModule, setSelectedModule] = useState<PageModule | undefined>(undefined);
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [moduleSummary, setModuleSummary] = useState<{ module: PageModule; _sum: { visitCount: number | null } }[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { getPageVisitAnalytics, getModuleSummary } = await import('@/app/actions/page-visits');
      const params = {
        granularity,
        module: selectedModule,
        limit: pageSize,
        offset: page * pageSize,
      };

      const [analyticsResult, summaryResult] = await Promise.all([
        getPageVisitAnalytics(params),
        getModuleSummary(),
      ]);

      if (analyticsResult.success && analyticsResult.data) {
        setData(analyticsResult.data as AnalyticsData[]);
        setTotal(analyticsResult.total);
      }

      if (summaryResult.success && summaryResult.data) {
        setModuleSummary(summaryResult.data as typeof moduleSummary);
      }

      setLoading(false);
    };

    fetchData();
  }, [granularity, selectedModule, page]);

  const getDateLabel = (item: AnalyticsData): string => {
    if (granularity === 'daily' && item.date) {
      return new Date(item.date).toLocaleDateString(i18n.resolvedLanguage);
    }
    if (granularity === 'weekly' && item.weekStart) {
      return `${t('admin:analytics.week')} ${new Date(item.weekStart).toLocaleDateString(i18n.resolvedLanguage)}`;
    }
    if (granularity === 'monthly' && item.monthStart) {
      return new Date(item.monthStart).toLocaleDateString(i18n.resolvedLanguage, { year: 'numeric', month: 'long' });
    }
    return '-';
  };

  const totalVisits = useMemo(() => {
    return data.reduce((sum, item) => sum + item.visitCount, 0);
  }, [data]);

  const maxVisitCount = useMemo(() => {
    return Math.max(...data.map(d => d.visitCount), 1);
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            {t('admin:analytics.filters')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-500" />
              <select
                value={granularity}
                onChange={(e) => setGranularity(e.target.value as Granularity)}
                className="border rounded px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-700"
              >
                <option value="daily">{t('admin:analytics.daily')}</option>
                <option value="weekly">{t('admin:analytics.weekly')}</option>
                <option value="monthly">{t('admin:analytics.monthly')}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <BarChartIcon className="h-4 w-4 text-gray-500" />
              <select
                value={selectedModule ?? ''}
                onChange={(e) => setSelectedModule(e.target.value ? (e.target.value as PageModule) : undefined)}
                className="border rounded px-3 py-1.5 text-sm dark:bg-gray-800 dark:border-gray-700"
              >
<option value="">{t('admin:analytics.allModules')}</option>
{PAGE_MODULES.map((m) => (
  <option key={m} value={m}>{t(`admin:analytics.modules.${m}`, m)}</option>
))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('admin:analytics.totalVisits')}</p>
                <p className="text-2xl font-bold">{totalVisits.toLocaleString()}</p>
              </div>
              <TrendingUpIcon className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('admin:analytics.recordsShown')}</p>
                <p className="text-2xl font-bold">{data.length}</p>
              </div>
              <BarChartIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('admin:analytics.totalRecords')}</p>
                <p className="text-2xl font-bold">{total.toLocaleString()}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{t('admin:analytics.modulesActive')}</p>
                <p className="text-2xl font-bold">{moduleSummary.length}</p>
              </div>
              <UsersIcon className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Summary Bar Chart */}
      {moduleSummary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('admin:analytics.visitsByModule')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {moduleSummary.slice(0, 10).map((item) => {
                const count = item._sum.visitCount || 0;
                const maxCount = moduleSummary[0]?._sum.visitCount || 1;
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={item.module} className="flex items-center gap-3">
                    <span className="w-32 text-sm truncate">{t(`admin:analytics.modules.${item.module}`, item.module)}</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-16 text-right">{count.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin:analytics.visitDetails')}</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
          if (loading) return <div className="text-center py-8 text-gray-500">{t('common:loading')}</div>;
          if (data.length === 0) return <div className="text-center py-8 text-gray-500">{t('admin:analytics.noData')}</div>;
          return (
            <div className="space-y-4">
              {data.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium">{t(`admin:analytics.modules.${item.module}`, item.module)}</p>
                      <p className="text-sm text-gray-500">{getDateLabel(item)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{item.visitCount.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{t('admin:analytics.visits')}</p>
                    </div>
                  </div>

                  {/* Visit Count Bar */}
                  <div className="mb-3">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(item.visitCount / maxVisitCount) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Archetype Breakdown */}
                  {item.archetypeBreakdown && Object.keys(item.archetypeBreakdown).length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">{t('admin:analytics.archetypeBreakdown')}</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(item.archetypeBreakdown).map(([archetype, count]) => (
                          <span
                            key={archetype}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs"
                            style={{
                              backgroundColor: `${ARCHETYPE_COLORS[archetype] || '#6b7280'}20`,
                              color: ARCHETYPE_COLORS[archetype] || '#6b7280',
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: ARCHETYPE_COLORS[archetype] || '#6b7280' }}
                            />
                            {t(`admin:analytics.archetypes.${archetype}`, archetype)}: {count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Pagination */}
              {total > pageSize && (
                <div className="flex justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                  >
                    {t('common:previous')}
                  </Button>
                  <span className="px-4 py-1.5 text-sm">
                    {page + 1} / {Math.ceil(total / pageSize)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(page + 1) * pageSize >= total}
                    onClick={() => setPage(p => p + 1)}
                  >
                    {t('common:next')}
                  </Button>
                </div>
              )}
            </div>
          );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
