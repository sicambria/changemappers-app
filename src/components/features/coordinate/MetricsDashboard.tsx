'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { hoursToReadable } from '@/lib/utils/task-metrics';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
);

type BlockedItem = {
  id: string;
  title: string;
  state: string;
  daysInState: number;
};

type MetricsData = {
  totalInitiatives: number;
  completedInitiatives: number;
  avgCycleTime: number | null;
  avgLeadTime: number | null;
  throughput: number;
  wip: number;
  flowEfficiency: number | null;
  byState: Record<string, number>;
  blockedItems: BlockedItem[];
};

const STATE_COLORS: Record<string, string> = {
  IMAGINED: 'rgb(100, 116, 139)',
  EXPLORING: 'rgb(147, 51, 234)',
  PLANNED: 'rgb(59, 130, 246)',
  IN_PROGRESS: 'rgb(245, 158, 11)',
  INTEGRATING: 'rgb(249, 115, 22)',
  COMPLETED: 'rgb(34, 197, 94)',
  ARCHIVED: 'rgb(71, 85, 105)',
};

const STATE_KEYS: Record<string, string> = {
  IMAGINED: 'states.IMAGINED',
  EXPLORING: 'states.EXPLORING',
  PLANNED: 'states.PLANNED',
  IN_PROGRESS: 'states.IN_PROGRESS',
  INTEGRATING: 'states.INTEGRATING',
  COMPLETED: 'states.COMPLETED',
  ARCHIVED: 'states.ARCHIVED',
};

function MetricCard({ label, value, unit, color }: Readonly<{ label: string; value: string | number; unit?: string; color?: string }>) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color ?? 'text-slate-100'}`}>
        {value}
        {unit && <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

export default function MetricsDashboard({ metrics }: Readonly<{ boardId: string; metrics: MetricsData }>) {
  const { t } = useTranslation('coordinate');
  const stateDistributionData = useMemo(() => {
    const states = Object.keys(metrics.byState).filter((s) => metrics.byState[s] > 0);
    return {
      labels: states.map((s) => STATE_KEYS[s] ? t(STATE_KEYS[s]) : s),
      datasets: [
        {
          data: states.map((s) => metrics.byState[s]),
          backgroundColor: states.map((s) => STATE_COLORS[s] ?? 'rgb(100, 116, 139)'),
          borderWidth: 0,
        },
      ],
    };
  }, [metrics.byState, t]);

  const throughputData = useMemo(() => {
    const labels = [t('metrics.week1'), t('metrics.week2'), t('metrics.week3'), t('metrics.week4')];
    return {
      labels,
      datasets: [
        {
          label: t('metrics.completed'),
          data: [Math.floor(metrics.throughput / 4), Math.floor(metrics.throughput / 4), Math.floor(metrics.throughput / 4), metrics.throughput % 4],
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderRadius: 4,
        },
      ],
    };
  }, [metrics.throughput, t]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(71, 85, 105, 0.3)',
        },
        ticks: {
          color: 'rgb(148, 163, 184)',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgb(148, 163, 184)',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'rgb(148, 163, 184)',
          font: { size: 11 },
        },
      },
    },
    cutout: '60%',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard
        label={t('metrics.cycleTime')}
        value={hoursToReadable(metrics.avgCycleTime)}
        color={metrics.avgCycleTime != null && metrics.avgCycleTime > 168 ? 'text-red-400' : 'text-green-400'}
      />
      <MetricCard
        label={t('metrics.leadTime')}
        value={hoursToReadable(metrics.avgLeadTime)}
        color={metrics.avgLeadTime != null && metrics.avgLeadTime > 336 ? 'text-red-400' : 'text-green-400'}
      />
      <MetricCard
        label={t('metrics.throughput')}
        value={metrics.throughput}
        unit={t('metrics.throughputUnit')}
        color="text-blue-400"
      />
      <MetricCard
        label={t('metrics.wip')}
        value={metrics.wip}
        color="text-amber-400"
      />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <h3 className="text-sm font-semibold text-slate-100 mb-4">{t('metrics.distributionByState')}</h3>
          <div className="h-64">
            <Doughnut data={stateDistributionData} options={doughnutOptions} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <h3 className="text-sm font-semibold text-slate-100 mb-4">{t('metrics.weeklyThroughput')}</h3>
          <div className="h-64">
            <Bar data={throughputData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <h3 className="text-sm font-semibold text-slate-100 mb-4">{t('metrics.flowEfficiency')}</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-amber-500"
                style={{ width: `${metrics.flowEfficiency ?? 0}%` }}
              />
            </div>
            <span className="text-xl font-bold text-slate-100">
              {metrics.flowEfficiency?.toFixed(0) ?? t('metrics.na')}%
            </span>
          </div>
        <p className="text-xs text-slate-500 mt-2">
          {t('metrics.flowEfficiencyDescription')}
        </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <h3 className="text-sm font-semibold text-slate-100 mb-4">{t('metrics.completionRate')}</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-4 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{ width: `${metrics.totalInitiatives > 0 ? (metrics.completedInitiatives / metrics.totalInitiatives) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xl font-bold text-slate-100">
              {metrics.totalInitiatives > 0
                ? ((metrics.completedInitiatives / metrics.totalInitiatives) * 100).toFixed(0)
                : 0}%
            </span>
          </div>
        <p className="text-xs text-slate-500 mt-2">
          {t('metrics.completedOf', { completed: metrics.completedInitiatives, total: metrics.totalInitiatives })}
        </p>
        </div>
      </div>

      {metrics.blockedItems.length > 0 && (
        <div className="rounded-xl border border-red-700 bg-red-900/20 p-4">
        <h3 className="text-sm font-semibold text-red-300 mb-3">
          {t('metrics.blockedItems')} ({metrics.blockedItems.length})
        </h3>
        <p className="text-xs text-red-400 mb-3">
          {t('metrics.blockedItemsDescription')}
        </p>
          <div className="space-y-2">
            {metrics.blockedItems.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                href={`/tasks/initiative/${item.id}`}
                className="flex items-center justify-between rounded-lg bg-slate-800 p-3 hover:bg-slate-750 transition"
              >
                <div>
                  <p className="text-sm text-slate-100">{item.title}</p>
                  <p className="text-xs text-slate-500">{STATE_KEYS[item.state] ? t(STATE_KEYS[item.state]) : item.state}</p>
                </div>
                <span className="text-xs text-red-400 font-medium">
                  {item.daysInState}d
                </span>
              </Link>
            ))}
            {metrics.blockedItems.length > 5 && (
          <p className="text-xs text-slate-500 text-center pt-2">
            +{metrics.blockedItems.length - 5} {t('metrics.moreBlocked')}
          </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
