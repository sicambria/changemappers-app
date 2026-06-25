'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RequestCard } from '@/components/features/growth-hub/RequestCard';
import { RequestList } from '@/components/features/growth-hub/RequestList';
import { CoachingAcceptForm } from './CoachingAcceptForm';
import type { getOpenCoachingRequestsAction, getMyCoachingOffersAction } from '@/app/actions/coaching';

type OpenRequest = Awaited<ReturnType<typeof getOpenCoachingRequestsAction>>[number];
type Offer = Awaited<ReturnType<typeof getMyCoachingOffersAction>>[number];

export function IncomingCoachingRequestsClient({
  requests,
  myOffers,
}: Readonly<{
  requests: OpenRequest[];
  myOffers: Offer[];
}>) {
  const { t } = useTranslation('coaching');
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
                { label: t('request.stuckOnLabel'), value: r.stuckOn },
                { label: t('request.shiftsWantedLabel'), value: r.shiftsWanted },
                { label: t('request.formatPreferenceLabel'), value: r.formatPreference },
              ]}
              createdAt={r.createdAt}
              requester={r.requester}
              actions={
                <div>
                  {expanded === r.id ? (
                    <>
                      <CoachingAcceptForm
                        requestId={r.id}
                        offers={myOffers}
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
