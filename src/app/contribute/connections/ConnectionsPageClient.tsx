'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { MessageCircleIcon } from 'lucide-react';
import {
  acceptContributionConnectionAction,
  completeContributionConnectionAction,
  cancelContributionConnectionAction,
} from '@/app/actions/contribute';
import {
  LifecycleActionButton,
  type LifecycleActionLabels,
} from '@/components/features/growth-hub/LifecycleActionButton';

type ConnectionStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  COMPLETED: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_ORDER: ConnectionStatus[] = ['ACTIVE', 'PENDING', 'COMPLETED', 'CANCELLED'];

interface Connection {
  id: string;
  status: ConnectionStatus;
  currentUserId: string;
  feedback: { id: string; publicReflection: string } | null;
  offer: {
    offerer: { id: string; name: string };
  };
  request: {
    requester: { id: string; name: string };
  };
}

interface ConnectionsPageClientProps {
  connections: Connection[];
}

export default function ConnectionsPageClient({ connections }: Readonly<ConnectionsPageClientProps>) {
  const { t } = useTranslation(['contribute', 'growth']);

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

  const grouped = STATUS_ORDER.reduce<Record<ConnectionStatus, Connection[]>>(
    (acc, status) => {
      acc[status] = connections.filter((c) => c.status === status);
      return acc;
    },
    { PENDING: [], ACTIVE: [], COMPLETED: [], CANCELLED: [] },
  );

  const getConnectionActions = (conn: Connection, lifecycleLabels: (key: 'accept' | 'complete' | 'cancelEngagement') => LifecycleActionLabels) => {
    const isOfferer = conn.offer.offerer.id === conn.currentUserId;
    const canAccept = conn.status === 'PENDING' && isOfferer;
    const canComplete = conn.status === 'ACTIVE' && !!conn.feedback?.id;
    const canCancel = conn.status === 'PENDING' || conn.status === 'ACTIVE';
    if (!canAccept && !canComplete && !canCancel) return null;
    return (
      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gray-100 dark:border-gray-800 pt-3">
        {canAccept && (
          <LifecycleActionButton
            tone="primary"
            action={() => acceptContributionConnectionAction(conn.id)}
            labels={lifecycleLabels('accept')}
          />
        )}
        {canComplete && (
          <LifecycleActionButton
            tone="primary"
            action={() => completeContributionConnectionAction(conn.id)}
            labels={lifecycleLabels('complete')}
          />
        )}
        {canCancel && (
          <LifecycleActionButton
            action={() => cancelContributionConnectionAction(conn.id)}
            labels={lifecycleLabels('cancelEngagement')}
          />
        )}
      </div>
    );
  };

  const getMessageHref = (connection: Connection) => {
    const messagePartner = connection.offer.offerer.id === connection.currentUserId
      ? connection.request.requester
      : connection.offer.offerer;

    return `/messages?userId=${encodeURIComponent(messagePartner.id)}&name=${encodeURIComponent(messagePartner.name)}`;
  };

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          {t('connections.title')}
        </h1>

        {connections.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-16">
            {t('connections.empty')}
          </p>
        )}

        {STATUS_ORDER.map((status) => {
          const group = grouped[status];
          if (group.length === 0) return null;
          return (
            <section key={status} className="mb-10">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                {t(`connection.status.${status}`)}
              </h2>
              <div className="space-y-3">
                {group.map((conn) => (
                  <div
                    key={conn.id}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {t('connections.offerBy', { name: conn.offer.offerer.name })}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {t('connections.requestedBy', { name: conn.request.requester.name })}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[conn.status] ?? ''}`}
                      >
                        {t(`connection.status.${conn.status}`)}
                      </span>
                    </div>

                    {conn.status === 'ACTIVE' && !conn.feedback?.id && (
                      <div className="mt-3 flex flex-col gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300 sm:flex-row sm:items-center sm:justify-between">
                        <span>{t('connections.addReflection')}</span>
                        <Link
                          href={getMessageHref(conn)}
                          className="inline-flex items-center gap-1 font-medium text-emerald-800 underline-offset-2 hover:underline dark:text-emerald-200"
                        >
                          <MessageCircleIcon className="h-3.5 w-3.5" />
                          {t('connections.messagePartner')}
                        </Link>
                      </div>
                    )}

                    {getConnectionActions(conn, lifecycleLabels)}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
