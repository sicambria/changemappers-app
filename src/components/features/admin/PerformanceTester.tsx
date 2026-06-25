'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { Button } from '@/components/ui';
import { GaugeIcon, RefreshCwIcon, CheckCircleIcon, XCircleIcon, MinusCircleIcon, DownloadIcon } from 'lucide-react';
import { getPerfRoutesAction } from '@/app/actions/admin/routes';

interface RouteResult {
  path: string;
  labelKey: string;
  group: string;
  status: 'pending' | 'running' | 'ok' | 'error' | 'skipped';
  ttfbMs: number | null;
  totalMs: number | null;
  httpStatus: number | null;
  error?: string;
}

function getGroupForPath(path: string): string {
  if (path.startsWith('/admin')) return 'Admin';
  if (path.startsWith('/reflect') || path.startsWith('/compass')) return 'Reflect';
  if (path.startsWith('/learn')) return 'Learn';
  if (path.startsWith('/coachme') || path.startsWith('/coach') || path.startsWith('/mentor')) return 'Coach';
  if (path.startsWith('/contribute') || path.startsWith('/volunteer')) return 'Contribute';
  if (path.startsWith('/tasks') || path.startsWith('/kanban')) return 'Tasks';
  if (path.startsWith('/tools') || path.startsWith('/canvas') || path.startsWith('/draw') || path.startsWith('/energy')) return 'Tools';
  if (path.startsWith('/pitch')) return 'Pitch';
  if (['/dashboard', '/feed', '/profile', '/connections', '/messages', '/calendar', '/graph', '/matchmaking', '/settings', '/favorites'].includes(path)) return 'Core';
  if (['/', '/about', '/login', '/register', '/verify-email', '/map', '/communities', '/events', '/causes', '/stories', '/glossary', '/roadmap', '/planet', '/health'].includes(path)) return 'Public';
  return 'Other';
}

const PUBLIC_PATHS = new Set(['/', '/about', '/login', '/register', '/verify-email', '/map', '/communities', '/events', '/causes', '/stories', '/glossary', '/roadmap', '/planet', '/health']);

function usePerfRoutes(): { path: string; labelKey: string; group: string; requiresAuth: boolean }[] {
  const [routes, setRoutes] = useState<{ path: string; labelKey: string; group: string; requiresAuth: boolean }[]>([]);

  useEffect(() => {
    getPerfRoutesAction().then(res => {
      if (res.success && res.data) {
        setRoutes(res.data.map(r => ({
          path: r.path,
          labelKey: r.labelKey,
          group: getGroupForPath(r.path),
          requiresAuth: !PUBLIC_PATHS.has(r.path),
        })));
      }
    });
  }, []);

  return routes;
}

function getColor(ms: number | null): string {
    if (ms === null) return 'text-gray-400';
    if (ms < 300) return 'text-emerald-600 dark:text-emerald-400';
    if (ms < 800) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
}

function getBar(ms: number | null, max: number): number {
    if (!ms || max === 0) return 0;
    return Math.min(100, (ms / max) * 100);
}

function buildLogContent(results: RouteResult[], runAt: Date, t: TFunction): string {
  const lines: string[] = [
    t('perf.log.header'),
    t('perf.log.runAt', { date: runAt.toISOString() }),
    t('perf.log.totalRoutes', { count: results.length }),
    t('perf.log.summary', { ok: results.filter(r => r.status === 'ok').length, errors: results.filter(r => r.status === 'error').length }),
    '',
    `${t('perf.log.table.route').padEnd(50)} ${t('perf.log.table.label').padEnd(40)} ${t('perf.log.table.group').padEnd(12)} ${t('perf.log.table.status').padEnd(8)} ${t('perf.log.table.http').padEnd(6)} ${t('perf.log.table.ttfb').padEnd(12)} ${t('perf.log.table.total').padEnd(12)} ${t('perf.log.table.error')}`,
    '-'.repeat(160),
  ];

  for (const r of results) {
    const label = t(r.labelKey);
    const status = r.status.toUpperCase().padEnd(8);
    const http = (r.httpStatus?.toString() ?? '-').padEnd(6);
    const ttfb = (r.ttfbMs?.toString() ?? '-').padEnd(12);
    const total = (r.totalMs?.toString() ?? '-').padEnd(12);
    const err = r.error ?? '';
    const groupKey = `perf.groups.${r.group}`;
    lines.push(
      `${r.path.padEnd(50)} ${label.padEnd(40)} ${t(groupKey, r.group).padEnd(12)} ${status} ${http} ${ttfb} ${total} ${err}`
    );
  }

  const completed = results.filter(r => r.totalMs !== null);
  if (completed.length > 0) {
    const avg = completed.reduce((s, r) => s + (r.totalMs ?? 0), 0) / completed.length;
    const min = Math.min(...completed.map(r => r.totalMs ?? 0));
    const max = Math.max(...completed.map(r => r.totalMs ?? 0));
    lines.push('', '-'.repeat(160), t('perf.log.stats', { avg: Math.round(avg), min, max }));
  }

  return lines.join('\n');
}

export function PerformanceTester() {
  const routes = usePerfRoutes();
  const { t } = useTranslation('admin');
  const [results, setResults] = useState<RouteResult[]>([]);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [runAt, setRunAt] = useState<Date | null>(null);

  const runTests = async () => {
    setRunning(true);
    setFinished(false);
    const startedAt = new Date();
    setRunAt(startedAt);

    const initial: RouteResult[] = routes.map(r => ({
      path: r.path,
      labelKey: r.labelKey,
      group: r.group,
      status: 'pending',
      ttfbMs: null,
      totalMs: null,
      httpStatus: null,
    }));
    setResults(initial);

    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];

      setResults(prev => prev.map((r, idx) =>
        idx === i ? { ...r, status: 'running' } : r
      ));

      try {
        const start = performance.now();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(route.path, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-store',
          headers: { 'x-perf-test': '1' },
        });
        const ttfb = performance.now() - start;

        await response.text();
        const total = performance.now() - start;
        clearTimeout(timeout);

        setResults(prev => prev.map((r, idx) =>
          idx === i ? {
            ...r,
            status: response.ok || response.status < 400 ? 'ok' : 'error',
            ttfbMs: Math.round(ttfb),
            totalMs: Math.round(total),
            httpStatus: response.status,
          } : r
        ));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setResults(prev => prev.map((r, idx) =>
          idx === i ? {
            ...r,
            status: 'error',
            ttfbMs: null,
            totalMs: null,
            httpStatus: null,
            error: msg.includes('abort') ? t('perf.timeout') : msg,
          } : r
        ));
      }
    }

    setRunning(false);
    setFinished(true);
  };

  const downloadResults = () => {
    if (!runAt || results.length === 0) return;
    const ts = runAt.toISOString().replaceAll(/[:.]/g, '-').slice(0, 19);
    const content = buildLogContent(results, runAt, t);
    const blob = new Blob([content], { type: 'text/plain; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perf-test-${ts}.log`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const maxMs = Math.max(...results.map(r => r.totalMs ?? 0), 1);
  const okCount = results.filter(r => r.status === 'ok').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const completed = results.filter(r => r.totalMs !== null);
  const avgMs = completed.reduce((sum, r) => sum + (r.totalMs ?? 0), 0) / Math.max(1, completed.length);

  const groups = Array.from(new Set(routes.map(r => r.group)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <GaugeIcon className="w-5 h-5 text-blue-500" />
            {t('perf.title')}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {t('perf.description', { count: routes.length })}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {finished && results.length > 0 && (
            <Button
              onClick={downloadResults}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <DownloadIcon className="w-4 h-4 mr-2" />
              {t('perf.downloadLog')}
            </Button>
          )}
          <Button
            onClick={runTests}
            disabled={running}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {(() => {
              if (running) return <><RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />{t('perf.running')}</>;
              if (finished) return <><RefreshCwIcon className="w-4 h-4 mr-2" />{t('perf.rerunTests')}</>;
              return <><GaugeIcon className="w-4 h-4 mr-2" />{t('perf.runTests')}</>;
            })()}
          </Button>
        </div>
      </div>

      {finished && results.length > 0 && (
        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{results.length}</div>
            <div className="text-xs text-gray-500">{t('perf.routesTested')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{okCount}</div>
            <div className="text-xs text-gray-500">{t('perf.pagesOk')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            <div className="text-xs text-gray-500">{t('perf.errors')}</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${getColor(avgMs)}`}>{Math.round(avgMs)}ms</div>
            <div className="text-xs text-gray-500">{t('perf.avgTotal')}</div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          {groups.map(group => {
            const groupResults = results.filter(r => r.group === group);
            if (groupResults.length === 0) return null;
            return (
              <div key={group} className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {t(`perf.groups.${group}`, group)}
                    <span className="ml-2 text-gray-400 font-normal normal-case">({groupResults.length} {t('perf.routesLabel')})</span>
                  </span>
                </div>
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs">{t('perf.colRoute')}</th>
                      <th className="px-4 py-2 text-center font-medium text-gray-500 uppercase text-xs w-20">{t('perf.colStatus')}</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase text-xs w-24">TTFB</th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500 uppercase text-xs w-24">{t('perf.colTotal')}</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500 uppercase text-xs">{t('perf.colBar')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-800">
                    {groupResults.map((r) => {
                      let perfBarColor: string;
                      if (r.totalMs !== null && r.totalMs < 300) { perfBarColor = 'bg-emerald-500'; }
                      else if (r.totalMs !== null && r.totalMs < 800) { perfBarColor = 'bg-amber-400'; }
                      else { perfBarColor = 'bg-red-500'; }
                      return (
                        <tr key={r.path} className={r.status === 'running' ? 'bg-blue-50 dark:bg-blue-900/10' : ''}>
                          <td className="px-4 py-2.5">
                            <div className="font-medium text-gray-900 dark:text-white">{t(r.labelKey)}</div>
                            <div className="text-xs text-gray-400 font-mono">{r.path}</div>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {r.status === 'running' && (
                              <RefreshCwIcon className="w-4 h-4 animate-spin text-blue-500 mx-auto" />
                            )}
                            {r.status === 'ok' && (
                              <span className="flex items-center justify-center gap-1 text-emerald-600">
                                <CheckCircleIcon className="w-4 h-4" />
                                <span className="text-xs font-mono">{r.httpStatus}</span>
                              </span>
                            )}
                            {r.status === 'error' && (
                              <span className="flex items-center justify-center gap-1 text-red-600">
                                <XCircleIcon className="w-4 h-4" />
                                <span className="text-xs font-mono">{r.httpStatus ?? 'ERR'}</span>
                              </span>
                            )}
                            {r.status === 'pending' && (
                              <MinusCircleIcon className="w-4 h-4 text-gray-300 mx-auto" />
                            )}
                          </td>
                          <td className={`px-4 py-2.5 text-right font-mono font-medium ${getColor(r.ttfbMs)}`}>
                            {(() => {
                              if (r.ttfbMs !== null) return `${r.ttfbMs}ms`;
                              if (r.error) return <span className="text-xs text-red-500">{r.error}</span>;
                              return '—';
                            })()}
                          </td>
                          <td className={`px-4 py-2.5 text-right font-mono font-bold ${getColor(r.totalMs)}`}>
                            {r.totalMs !== null ? `${r.totalMs}ms` : '—'}
                          </td>
                          <td className="px-4 py-2.5 w-32 min-w-[120px]">
                            {r.totalMs !== null && (
                              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${perfBarColor}`}
                                  style={{ width: `${getBar(r.totalMs, maxMs)}%` }}
                                />
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-gray-400">
        {t('perf.legend')}
      </p>
    </div>
  );
}
