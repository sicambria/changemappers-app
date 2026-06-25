'use client';

import { useTranslation } from 'react-i18next';
import {
  acceptPeerSupportConnectionAction,
  cancelPeerSupportConnectionAction,
} from '@/app/actions/peer';
import {
  LifecycleActionButton,
  type LifecycleActionLabels,
} from '@/components/features/growth-hub/LifecycleActionButton';

const STATUS_ORDER = ['PENDING', 'ACTIVE', 'CLOSED', 'CANCELLED'] as const;
type ConnectionStatus = (typeof STATUS_ORDER)[number];

interface PeerConnection {
  id: string;
  status: string;
  format: string | null;
  currentUserId: string;
  offer: {
    offerer: {
      id: string;
      name: string | null;
    };
  };
}

interface PeerConnectionsClientProps {
  connections: PeerConnection[];
}

export default function PeerConnectionsClient({ connections }: Readonly<PeerConnectionsClientProps>) {
  const { t } = useTranslation(['peer', 'growth']);

  const lifecycleLabels = (key: 'accept' | 'cancelEngagement'): LifecycleActionLabels => ({
    label: t(`growth:lifecycle.${key}.label`),
    confirmPrompt: t(`growth:lifecycle.${key}.confirmPrompt`),
    confirmYes: t(`growth:lifecycle.${key}.confirmYes`),
    pendingLabel: t(`growth:lifecycle.${key}.pending`),
    cancelLabel: t('growth:lifecycle.cancelEngagement.label'),
    errorFallback: t(`growth:lifecycle.${key}.failed`),
  });

  const grouped = STATUS_ORDER.reduce<Record<ConnectionStatus, PeerConnection[]>>(
    (acc, status) => {
      acc[status] = connections.filter((c) => c.status === status);
      return acc;
    },
    { PENDING: [], ACTIVE: [], CLOSED: [], CANCELLED: [] },
  );

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 mt-6">
        {t('peer:connections.title')}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">{t('peer:connections.subtitle')}</p>

      {connections.length === 0 && (
        <p className="text-gray-400 dark:text-gray-500 text-center py-16">
          {t('peer:connections.empty')}
        </p>
      )}

      {STATUS_ORDER.map((status) => {
        const items = grouped[status];
        if (items.length === 0) return null;
        return (
          <section key={status} className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
              {t(`peer:connections.status.${status}`)}
            </h2>
            <div className="space-y-3">
              {items.map((conn) => {
                const offererName = conn.offer.offerer.name ?? t('peer:connections.unknownSupporter');
                // accept: supporter (offerer) only on PENDING. cancel: either party while PENDING/ACTIVE.
                const isSupporter = conn.offer.offerer.id === conn.currentUserId;
                const canAccept = conn.status === 'PENDING' && isSupporter;
                const canCancel = conn.status === 'PENDING' || conn.status === 'ACTIVE';
                return (
                  <div
                    key={conn.id}
                    className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <span className="text-gray-900 dark:text-gray-100 font-medium">
                      {offererName}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {conn.format && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {conn.format}
                        </span>
                      )}
                      {canAccept && (
                        <LifecycleActionButton
                          tone="primary"
                          action={() => acceptPeerSupportConnectionAction(conn.id)}
                          labels={lifecycleLabels('accept')}
                        />
                      )}
                      {canCancel && (
                        <LifecycleActionButton
                          action={() => cancelPeerSupportConnectionAction(conn.id)}
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
  );
}
