'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import {
  acceptTrainingEngagementAction,
  completeTrainingEngagementAction,
  cancelTrainingEngagementAction,
} from '@/app/actions/training';
import {
  LifecycleActionButton,
  type LifecycleActionLabels,
} from '@/components/features/growth-hub/LifecycleActionButton';

interface Engagement {
  id: string;
  status: string;
  completedAt: Date | null;
  currentUserId: string;
  feedback: { id: string; learnerReflection: string; trainerObservation: string | null } | null;
  request: {
    skillGapDescription: string | null;
  };
  offer: {
    domain: string;
    format: string | null;
    creator: {
      id: string;
      name: string | null;
      profilePhoto: string | null;
    };
  };
}

interface TrainingConnectionsClientProps {
  engagements: Engagement[];
}

type EngagementStatus = 'PENDING' | 'ACTIVE' | 'COMPLETE' | 'CANCELLED';

const STATUS_CONFIG: Record<
  EngagementStatus,
  { label: string; badgeClass: string; order: number }
> = {
  ACTIVE: {
    label: '',
    badgeClass: 'bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-700/40',
    order: 1,
  },
  PENDING: {
    label: '',
    badgeClass: 'bg-amber-900/50 text-amber-300 border-amber-700/40',
    order: 2,
  },
  COMPLETE: {
    label: '',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-800',
    order: 3,
  },
  CANCELLED: {
    label: '',
    badgeClass: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700',
    order: 4,
  },
};

export default function TrainingConnectionsClient({ engagements }: Readonly<TrainingConnectionsClientProps>) {
  const { t, i18n } = useTranslation(['training', 'growth']);

  const getStatusLabel = (status: string): string => {
    const key = `status.${status.toLowerCase()}` as const;
    return t(key);
  };

  const lifecycleLabels = (
    key: 'accept' | 'complete' | 'cancelEngagement',
  ): LifecycleActionLabels => ({
    label: t(`growth:lifecycle.${key}.label`),
    confirmPrompt: t(`growth:lifecycle.${key}.confirmPrompt`),
    confirmYes: t(`growth:lifecycle.${key}.confirmYes`),
    pendingLabel: t(`growth:lifecycle.${key}.pending`),
    cancelLabel: t('growth:lifecycle.cancelEngagement.label'),
    errorFallback: t(`growth:lifecycle.${key}.failed`),
  });

  const grouped = (Object.keys(STATUS_CONFIG) as EngagementStatus[])
    .sort((a, b) => STATUS_CONFIG[a].order - STATUS_CONFIG[b].order)
    .map((status) => ({
      status,
      items: engagements.filter((e) => e.status === status),
    }));

  const total = engagements.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('myConnections')}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('connectionsSummary', { count: total })}
            </p>
          </div>
          <Link
            href="/training/find"
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium px-4 py-2 transition-colors"
          >
            {t('browseOffers')}
          </Link>
        </div>

        {total === 0 && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">{t('noConnections')}</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link
                href="/training/find"
                className="text-emerald-400 hover:text-emerald-700 dark:text-emerald-300 underline underline-offset-4 text-sm"
              >
                {t('findTrainer')}
              </Link>
              <Link
                href="/training/request/new"
                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 underline underline-offset-4 text-sm"
              >
                {t('postRequestCta')}
              </Link>
            </div>
          </div>
        )}

        {total > 0 &&
          grouped.map(({ status, items }) => {
            if (items.length === 0) return null;
            const config = STATUS_CONFIG[status];

            return (
              <section key={status} className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-base font-semibold text-white">{getStatusLabel(status)}</h2>
                  <span
                    className={`inline-flex items-center rounded-full border text-xs px-2 py-0.5 ${config.badgeClass}`}
                  >
                    {items.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {items.map((engagement) => {
                    const trainerName = engagement.offer.creator.name ?? t('unknownTrainer');
                    // accept: trainer-only on PENDING (PENDING→ACTIVE). complete: either party, ACTIVE
                    // only (accept is wired, so completion is reachable). cancel: either party while open.
                    const isTrainer = engagement.offer.creator.id === engagement.currentUserId;
                    const canAccept = engagement.status === 'PENDING' && isTrainer;
                    const isOpen = engagement.status === 'PENDING' || engagement.status === 'ACTIVE';
                    const canComplete = engagement.status === 'ACTIVE';

                    return (
                      <div
                        key={engagement.id}
                        className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                              {engagement.offer.domain}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {engagement.offer.format ?? t('trainingFallback')}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full border text-xs px-2.5 py-0.5 shrink-0 ${config.badgeClass}`}
                          >
                            {getStatusLabel(status)}
                          </span>
                        </div>

                        {engagement.request.skillGapDescription && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {engagement.request.skillGapDescription}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          {engagement.offer.creator.profilePhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={engagement.offer.creator.profilePhoto}
                              alt={trainerName}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                              <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                                {trainerName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span>{trainerName}</span>
                        </div>

                        {(canAccept || isOpen) && (
                          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                            {canAccept && (
                              <LifecycleActionButton
                                tone="primary"
                                action={() => acceptTrainingEngagementAction(engagement.id)}
                                labels={lifecycleLabels('accept')}
                              />
                            )}
                            {canComplete && (
                              <LifecycleActionButton
                                tone="primary"
                                action={() => completeTrainingEngagementAction(engagement.id)}
                                labels={lifecycleLabels('complete')}
                              />
                            )}
                            {isOpen && (
                              <LifecycleActionButton
                                action={() => cancelTrainingEngagementAction(engagement.id)}
                                labels={lifecycleLabels('cancelEngagement')}
                              />
                            )}
                          </div>
                        )}

                        {status === 'COMPLETE' && !engagement.feedback && (
                          <div className="mt-4 rounded-xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/30 px-4 py-3">
                            <p className="text-xs text-sky-300">
                              {t('completeNeedsReflection')}
                            </p>
                          </div>
                        )}

                        {engagement.completedAt && (
                          <p className="mt-3 text-xs text-slate-600">
                            {t('completedOn', { date: new Date(engagement.completedAt).toLocaleDateString(i18n.resolvedLanguage || i18n.language, { day: 'numeric', month: 'short', year: 'numeric' }) })}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
      </div>
    </div>
  );
}
