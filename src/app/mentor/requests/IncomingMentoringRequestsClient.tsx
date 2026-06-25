'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RequestCard } from '@/components/features/growth-hub/RequestCard';
import { RequestList } from '@/components/features/growth-hub/RequestList';
import { MentoringAcceptForm } from './MentoringAcceptForm';
import type { getOpenMentoringRequestsAction } from '@/app/actions/mentoring';

type OpenRequest = Awaited<ReturnType<typeof getOpenMentoringRequestsAction>>[number];

export function IncomingMentoringRequestsClient({ requests }: Readonly<{ requests: OpenRequest[] }>) {
  const { t } = useTranslation('mentor');
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{t('requests.incomingTitle')}</h1>
          <p className="text-slate-400 text-sm">{t('requests.incomingSubtitle')}</p>
        </div>

        <RequestList isEmpty={requests.length === 0} emptyMessage={t('requests.incomingEmpty')}>
          {requests.map((r) => (
            <RequestCard
              key={r.id}
              title={t('requests.cardTitle')}
              fields={[
                { label: t('myRequests.domainLabel'), value: r.domain },
                { label: t('myRequests.inflectionPointLabel'), value: r.inflectionPoint },
                { label: t('myRequests.guidanceSoughtLabel'), value: r.guidanceSought },
              ]}
              createdAt={r.createdAt}
              requester={r.requester}
              actions={
                <div>
                  {expanded === r.id ? (
                    <>
                      <MentoringAcceptForm
                        requestId={r.id}
                        onDone={() => { globalThis.location.reload(); }}
                      />
                      <button
                        type="button"
                        onClick={() => setExpanded(null)}
                        className="mt-2 text-sm text-slate-500 hover:underline"
                      >
                        {t('requests.cancelAccept')}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setExpanded(r.id)}
                      className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                    >
                      {t('requests.acceptButton')}
                    </button>
                  )}
                </div>
              }
            />
          ))}
        </RequestList>
      </div>
    </main>
  );
}
