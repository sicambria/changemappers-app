'use client';

/**
 * AvailabilityStateIndicator
 *
 * Shows the current availability state with color coding.
 * RESTING renders in soft gray — no feature can override this visually.
 *
 * Color semantics:
 * - DELIVERING: amber (deep in commitment, lower bandwidth)
 * - BUILDING: blue (learning arc, available for exchange)
 * - BETWEEN: green (transition, fully available)
 * - REFLECTING: purple (integration, not surfaced to others)
 * - RESTING: gray (recovery, removed from all queues)
 */

import { useTranslation } from 'react-i18next';

type AvailabilityMode = 'DELIVERING' | 'BUILDING' | 'BETWEEN' | 'REFLECTING' | 'RESTING';

interface AvailabilityStateIndicatorProps {
  mode: AvailabilityMode;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const MODE_STYLES: Record<AvailabilityMode, { dot: string; badge: string }> = {
  DELIVERING: {
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  BUILDING: {
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  BETWEEN: {
    dot: 'bg-green-500',
    badge: 'bg-green-50 text-green-800 border-green-200',
  },
  REFLECTING: {
    dot: 'bg-purple-400',
    badge: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  RESTING: {
    dot: 'bg-gray-400',
    badge: 'bg-gray-50 text-gray-600 border-gray-200',
  },
};

const SIZE_STYLES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export default function AvailabilityStateIndicator({
  mode,
  showDescription = false,
  size = 'sm',
  className = '',
}: Readonly<AvailabilityStateIndicatorProps>) {
  const { t } = useTranslation('modalities');
  const styles = MODE_STYLES[mode];

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${styles.badge} ${SIZE_STYLES[size]}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} aria-hidden="true" />
        {t(`availability.${mode}`)}
      </span>
      {showDescription && (
        <p className="text-xs text-muted-foreground">
          {t(`availability.descriptions.${mode}`)}
        </p>
      )}
    </div>
  );
}
