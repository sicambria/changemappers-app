'use client';

/**
 * CommunityHealthSnapshot
 *
 * Renders aggregate availability state distribution for a community.
 * No individual user modes are shown — only counts per state.
 *
 * Alert fires when (reflecting + resting) / total < 15%:
 * meaning the community is burning through contributors without recovery.
 * This is a failure signal, not a success metric.
 */

import { useTranslation } from 'react-i18next';
import type { CommunityHealthResult } from '@/lib/health';

interface CommunityHealthSnapshotProps {
  health: CommunityHealthResult;
  className?: string;
}

interface BarSegmentProps {
  count: number;
  total: number;
  color: string;
  label: string;
}

function BarSegment({ count, total, color, label }: Readonly<BarSegmentProps>) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  if (pct === 0) return null;

  return (
    <div // NOSONAR(S6819) — role="img"+aria-label on a CSS/SVG-rendered graphic; no img src exists
      className={`${color} h-3 rounded-sm transition-all`}
      style={{ width: `${pct}%` }}
      title={`${label}: ${count} (${pct}%)`}
      role="img"
      aria-label={`${label}: ${count}`}
    />
  );
}

export default function CommunityHealthSnapshot({
  health,
  className = '',
}: Readonly<CommunityHealthSnapshotProps>) {
  const { t } = useTranslation('contribute');

  const {
    totalActiveMembers,
    deliveringCount,
    buildingCount,
    betweenCount,
    reflectingCount,
    restingCount,
    alertTriggered,
  } = health;

  return (
    <div className={`rounded-lg border border-border bg-card p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-foreground mb-3">
        {t('health.title')}
      </h3>

      {alertTriggered && (
        <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {t('health.alert')}
        </div>
      )}

      {/* Stacked bar */}
      <div className="flex gap-0.5 mb-3 h-3">
        <BarSegment
          count={deliveringCount}
          total={totalActiveMembers}
          color="bg-amber-400"
          label={t('health.delivering')}
        />
        <BarSegment
          count={buildingCount}
          total={totalActiveMembers}
          color="bg-blue-400"
          label={t('health.building')}
        />
        <BarSegment
          count={betweenCount}
          total={totalActiveMembers}
          color="bg-green-400"
          label={t('health.between')}
        />
        <BarSegment
          count={reflectingCount}
          total={totalActiveMembers}
          color="bg-purple-400"
          label={t('health.reflecting')}
        />
        <BarSegment
          count={restingCount}
          total={totalActiveMembers}
          color="bg-gray-300"
          label={t('health.resting')}
        />
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {[
          { label: t('health.delivering'), count: deliveringCount, color: 'bg-amber-400' },
          { label: t('health.building'), count: buildingCount, color: 'bg-blue-400' },
          { label: t('health.between'), count: betweenCount, color: 'bg-green-400' },
          { label: t('health.reflecting'), count: reflectingCount, color: 'bg-purple-400' },
          { label: t('health.resting'), count: restingCount, color: 'bg-gray-300' },
        ].map(({ label, count, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-sm ${color}`} aria-hidden="true" />
            <span>
              {label}: {count}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {totalActiveMembers} {t('health.members')}
      </p>
    </div>
  );
}
