'use client';

import { useTranslation } from 'react-i18next';
import {
  completeCoachingEngagementAction,
  cancelCoachingEngagementAction,
} from '@/app/actions/coaching';
import {
  LifecycleActionButton,
  type LifecycleActionLabels,
} from '@/components/features/growth-hub/LifecycleActionButton';

const STATUS_ORDER = ['PENDING', 'ACTIVE', 'COMPLETE', 'CANCELLED'] as const;
type EngagementStatus = (typeof STATUS_ORDER)[number];

interface CoachEngagement {
  id: string;
  status: EngagementStatus;
  style: string | null;
  arcLength: string | null;
  currentUserId: string;
  offer: {
    coach: {
      id: string;
      name: string | null;
    };
  };
}

interface CoachingConnectionsClientProps {
  engagements: CoachEngagement[];
}

export function CoachingConnectionsClient({ engagements }: Readonly<CoachingConnectionsClientProps>) {
  const { t } = useTranslation(['coaching', 'growth']);

  const lifecycleLabels = (key: 'complete' | 'cancelEngagement'): LifecycleActionLabels => ({
    label: t(`growth:lifecycle.${key}.label`),
    confirmPrompt: t(`growth:lifecycle.${key}.confirmPrompt`),
    confirmYes: t(`growth:lifecycle.${key}.confirmYes`),
    pendingLabel: t(`growth:lifecycle.${key}.pending`),
    cancelLabel: t('growth:lifecycle.cancelEngagement.label'),
    errorFallback: t(`growth:lifecycle.${key}.failed`),
  });

  const grouped = STATUS_ORDER.reduce<
    Record<EngagementStatus, CoachEngagement[]>
  >((acc, status) => {
    acc[status] = engagements.filter((e) => e.status === status);
    return acc;
  }, { PENDING: [], ACTIVE: [], COMPLETE: [], CANCELLED: [] });

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('coaching:connections.title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          {t('coaching:connections.subtitle')}
        </p>

        {engagements.length === 0 && (
          <p className="text-gray-400 dark:text-gray-500 text-center py-16">
            {t('coaching:connections.empty')}
          </p>
        )}

        {STATUS_ORDER.map((status) => {
          const items = grouped[status];
          if (items.length === 0) return null;
          return (
            <section key={status} className="mb-8">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                {t(`coaching:engagement.status.${status}`)}
              </h2>
              <div className="space-y-3">
                {items.map((eng) => {
                  const coachName = eng.offer.coach.name ?? t('coaching:connections.unknownCoach');
                  // complete/cancel are either-party server-side; gate on status only.
                  const isOpen = eng.status === 'PENDING' || eng.status === 'ACTIVE';
                  return (
                    <div
                      key={eng.id}
                      className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4 flex flex-wrap items-center justify-between gap-3"
                    >
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {coachName}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {eng.style && (
                          <span className="text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950 px-2 py-0.5 rounded">
                            {eng.style}
                          </span>
                        )}
                        {eng.arcLength && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                            {eng.arcLength}
                          </span>
                        )}
                        {isOpen && (
                          <LifecycleActionButton
                            tone="primary"
                            action={() => completeCoachingEngagementAction(eng.id)}
                            labels={lifecycleLabels('complete')}
                          />
                        )}
                        {isOpen && (
                          <LifecycleActionButton
                            action={() => cancelCoachingEngagementAction(eng.id)}
                            labels={lifecycleLabels('cancelEngagement')}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
