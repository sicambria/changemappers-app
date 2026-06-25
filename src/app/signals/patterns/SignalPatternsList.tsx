'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Link2Icon, PlusIcon, AlertTriangleIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getWeakSignalPatterns } from '@/app/actions/weak-signal-pattern';
import type { WeakSignalPattern, PatternTrajectory, PatternLibraryStatus } from '@/types/weak-signal';

const TRAJECTORY_COLORS: Record<string, string> = {
  EMERGING: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  STABILIZING: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
  DECLINING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
};

const STATUS_COLORS: Record<string, string> = {
  PROPOSED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  VALIDATED: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  RETIRED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function SignalPatternsList() {
  const { t } = useTranslation('signals');
  const [patterns, setPatterns] = useState<WeakSignalPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrajectory, setSelectedTrajectory] = useState<PatternTrajectory | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<PatternLibraryStatus | ''>('');

  useEffect(() => {
    async function loadPatterns() {
      setIsLoading(true);
      const result = await getWeakSignalPatterns({
        trajectory: selectedTrajectory || undefined,
        status: selectedStatus || undefined,
      });
      if (result.success && result.data) {
        setPatterns(result.data);
      }
      setIsLoading(false);
    }
    loadPatterns();
  }, [selectedTrajectory, selectedStatus]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {['sk-1', 'sk-2', 'sk-3'].map((id) => (
          <div key={id} className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-2xl h-32" />
        ))}
      </div>
    );
  }

  if (patterns.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Link href="/signals/patterns/create">
            <Button variant="primary" size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              {t('pattern.create')}
            </Button>
          </Link>
        </div>
        <Card className="p-8 text-center">
          <AlertTriangleIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('pattern.noPatterns')}
          </h3>
          <p className="text-gray-500 mb-4">{t('pattern.noPatternsHint')}</p>
          <Link href="/signals/patterns/create">
            <Button variant="primary">{t('pattern.create')}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-wrap">
          <select
            value={selectedTrajectory}
            onChange={(e) => setSelectedTrajectory(e.target.value as PatternTrajectory | '')}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            <option value="">{t('pattern.trajectory')}</option>
            {(['EMERGING', 'STABILIZING', 'DECLINING'] as PatternTrajectory[]).map((tr) => (
              <option key={tr} value={tr}>
                {t(`trajectory.${tr}`)}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as PatternLibraryStatus | '')}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
          >
            <option value="">{t('pattern.status')}</option>
            {(['PROPOSED', 'VALIDATED', 'RETIRED'] as PatternLibraryStatus[]).map((st) => (
              <option key={st} value={st}>
                {t(`pattern.statusBadge.${st}`)}
              </option>
            ))}
          </select>
        </div>
        <Link href="/signals/patterns/create">
          <Button variant="primary" size="sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('pattern.create')}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {patterns.map((pattern) => (
          <Link key={pattern.id} href={`/signals/patterns/${pattern.id}`}>
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer h-full">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                  <Link2Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {pattern.name}
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${TRAJECTORY_COLORS[pattern.trajectory] ?? 'bg-gray-100 text-gray-700'}`}>
                      {t(`trajectory.${pattern.trajectory}`)}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[pattern.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {t(`pattern.statusBadge.${pattern.status}`)}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {pattern.signalCount ?? 0} {t('pattern.signals')}
                    </span>
                  </div>
                  {pattern.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                      {pattern.description}
                    </p>
                  )}
                  {pattern.proposedBy && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {t('pattern.proposedBy')}: {pattern.proposedBy.displayName ?? pattern.proposedBy.name}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
