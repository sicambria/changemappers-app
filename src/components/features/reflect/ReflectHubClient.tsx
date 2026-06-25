'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { ZapIcon, RefreshCwIcon, FolderOpenIcon, ClockIcon, CompassIcon, StarIcon, BatteryChargingIcon, WindIcon, ArrowRightIcon } from 'lucide-react';
import type { ReflectionPriority } from '@/lib/reflection-cadence';

interface ReflectData {
  functional: {
    availabilityMode: string;
    currentOffer: string | null;
    energisingFunctions: string[];
    functionsUpdatedAt: Date;
  } | null;
  lastPulse: Date | null | undefined;
  lastAvailability: Date | null | undefined;
  lastProject?: Date | null;
}

function getDaysSinceLabel(
  t: (key: string, options?: { count?: number }) => string,
  date: Date | null | undefined,
  now: Date,
): string {
  if (!date) return t('hub.lastNever');
  const days = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (days === 0) return t('hub.lastToday');
  if (days === 1) return t('hub.lastYesterday');
  return t('hub.lastDaysAgo', { count: days });
}

interface ReflectHubClientProps {
  data: ReflectData;
  activeTab: 'checkin' | 'deep';
  renderedAt: string;
  nextPrompt?: ReflectionPriority | null;
}

function NextPromptCard({ prompt }: Readonly<{ prompt: ReflectionPriority }>) {
  const { t } = useTranslation('reflect');
  const getBadgeText = () => {
    if (prompt.staleness === 'overdue') return t('hub.nextPromptOverdue');
    if (prompt.staleness === 'soft') return t('hub.nextPromptSoft');
    return t('hub.nextPromptNever');
  };
  const badgeText = getBadgeText();
  const badgeClass =
    prompt.staleness === 'overdue'
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';

  return (
    <Link
      href={prompt.href}
      className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 transition-colors hover:border-emerald-300 dark:border-emerald-800 dark:bg-emerald-900/20 dark:hover:border-emerald-700"
    >
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          {t('hub.nextPromptTitle')}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
            {badgeText}
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {(() => {
              if (prompt.level === 'L1_PULSE') return t('hub.currentPulse');
              if (prompt.level === 'L2_AVAILABILITY') return t('hub.functionalAvailability');
              return t('hub.projectReflection');
            })()}
          </span>
        </div>
      </div>
      <ArrowRightIcon className="h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
    </Link>
  );
}

export default function ReflectHubClient({ data, activeTab, renderedAt, nextPrompt }: Readonly<ReflectHubClientProps>) {
  const { t } = useTranslation('reflect');
  const renderedAtDate = new Date(renderedAt);

  const MODE_LABELS: Record<string, string> = {
    DELIVERING: t('availability.delivering'),
    BETWEEN: t('availability.between'),
    BUILDING: t('availability.building'),
    REFLECTING: t('availability.reflecting'),
    RESTING: t('availability.resting'),
  };

  const CHECKIN_LEVELS = [
    {
      id: 'L1',
      href: '/reflect/pulse',
      icon: <ZapIcon className="h-5 w-5 text-emerald-500" />,
      title: t('hub.currentPulse'),
      desc: t('hub.currentPulseDesc'),
      last: getDaysSinceLabel(t, data.lastPulse, renderedAtDate),
    },
    {
      id: 'L2',
      href: '/reflect/availability',
      icon: <RefreshCwIcon className="h-5 w-5 text-blue-500" />,
      title: t('hub.functionalAvailability'),
      desc: t('hub.functionalAvailabilityDesc'),
      last: getDaysSinceLabel(t, data.lastAvailability, renderedAtDate),
    },
    {
      id: 'L3',
      href: '/reflect/project',
      icon: <FolderOpenIcon className="h-5 w-5 text-purple-500" />,
      title: t('hub.projectReflection'),
      desc: t('hub.projectReflectionDesc'),
      last: getDaysSinceLabel(t, data.lastProject, renderedAtDate),
    },
    {
      id: 'calm',
      href: '/reflect/calming-exercises',
      icon: <WindIcon className="h-5 w-5 text-sky-400" />,
      title: t('hub.calmingExercises'),
      desc: t('hub.calmingExercisesDesc'),
      last: '—',
    },
  ];

  const DEEP_LEVELS = [
    {
      id: 'L4',
      href: '/reflect/year-compass',
      icon: <CompassIcon className="h-5 w-5 text-journal-secondary" />,
      title: t('hub.yearCompass'),
      desc: t('hub.yearCompassDesc'),
      last: '—',
    },
    {
      id: 'L5',
      href: '/reflect/lifewheel',
      icon: <ClockIcon className="h-5 w-5 text-rose-500" />,
      title: t('hub.lifewheel'),
      desc: t('hub.lifewheelDesc'),
      last: '—',
    },
    {
      id: 'L6',
      href: '/reflect/values',
      icon: <CompassIcon className="h-5 w-5 text-sky-500" />,
      title: t('hub.valueCompass'),
      desc: t('hub.valueCompassDesc'),
      last: '—',
    },
    {
      id: 'L7',
      href: '/reflect/principles',
      icon: <StarIcon className="h-5 w-5 text-amber-500" />,
      title: t('hub.principles'),
      desc: t('hub.principlesDesc'),
      last: '—',
    },
    {
      id: 'L8',
      href: '/reflect/focus',
      icon: <BatteryChargingIcon className="h-5 w-5 text-emerald-500" />,
      title: t('hub.focusTest'),
      desc: t('hub.focusTestDesc'),
      last: '—',
    },
    {
      id: 'L9',
      href: '/coachme',
      icon: <StarIcon className="h-5 w-5 text-rose-500" />,
      title: t('hub.solutionPath'),
      desc: t('hub.solutionPathDesc'),
      last: '—',
    },
    {
      id: 'L10',
      href: '/reflect/helpers',
      icon: <BatteryChargingIcon className="h-5 w-5 text-teal-500" />,
      title: t('hub.helpers'),
      desc: t('hub.helpersDesc'),
      last: '—',
    },
  ];

  const levels = activeTab === 'checkin' ? CHECKIN_LEVELS : DEEP_LEVELS;

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('hub.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          {t('hub.subtitle')}
        </p>
      </div>

      {nextPrompt && activeTab === 'checkin' && <NextPromptCard prompt={nextPrompt} />}

      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
        <Link
          href="/reflect?tab=checkin"
          className={`flex-1 text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'checkin'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {t('hub.quickCheckin')}
        </Link>
        <Link
          href="/reflect?tab=deep"
          className={`flex-1 text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'deep'
              ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {t('hub.deepReflection')}
        </Link>
      </div>

      {activeTab === 'checkin' && data.functional && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-300">
            {MODE_LABELS[data.functional.availabilityMode] ?? data.functional.availabilityMode}
          </div>
          {data.functional.currentOffer && (
            <p className="text-sm text-emerald-700 dark:text-emerald-400 italic">
              &ldquo;{data.functional.currentOffer}&rdquo;
            </p>
          )}
          <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <ClockIcon className="h-3 w-3" />
            {t('availability.functionsUpdatedAt', { time: getDaysSinceLabel(t, data.functional.functionsUpdatedAt, renderedAtDate) })}
            {data.functional.energisingFunctions.length > 0 && (
              <span className="ml-2">{t('availability.energisingCount', { count: data.functional.energisingFunctions.length })}</span>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {activeTab === 'checkin' ? t('hub.quickCheckins') : t('hub.deepTools')}
        </h2>
        {levels.map((level) => (
          <Link key={level.id} href={level.href}
            className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors bg-white dark:bg-gray-900 group">
            <div className="mt-0.5 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 transition-colors">
              {level.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 dark:text-white text-sm">{level.title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{level.desc}</div>
            </div>
            <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500 pt-0.5">
              {level.last}
            </div>
          </Link>
        ))}
      </div>

      {activeTab === 'deep' && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center pb-4">
          {t('hub.deepLevelsComing')}
        </p>
      )}
    </main>
  );
}
