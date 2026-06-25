'use client';

import { useTranslation } from 'react-i18next';
import { RequestCard } from '@/components/features/growth-hub/RequestCard';
import { RequestList } from '@/components/features/growth-hub/RequestList';
import { LifecycleActionButton } from '@/components/features/growth-hub/LifecycleActionButton';
import { withdrawCoachingRequestAction } from '@/app/actions/coaching';

type Request = {
  id: string;
  stuckOn: string;
  shiftsWanted: string;
  formatPreference: string | null;
  createdAt: Date;
};

export function MyCoachingRequestsClient({ requests }: Readonly<{ requests: Request[] }>) {
  const { t } = useTranslation('coaching');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{t('myRequests.title')}</h1>
          <p className="text-slate-400 text-sm">{t('myRequests.subtitle')}</p>
        </div>

        <RequestList isEmpty={requests.length === 0} emptyMessage={t('myRequests.empty')}>
          {requests.map((r) => (
            <RequestCard
              key={r.id}
              title={t('myRequests.cardTitle')}
              fields={[
                { label: t('request.stuckOnLabel'), value: r.stuckOn },
                { label: t('request.shiftsWantedLabel'), value: r.shiftsWanted },
                { label: t('request.formatPreferenceLabel'), value: r.formatPreference },
              ]}
              createdAt={r.createdAt}
              actions={
                <LifecycleActionButton
                  action={() => withdrawCoachingRequestAction(r.id)}
                  tone="danger"
                  labels={{
                    label: t('myRequests.withdraw'),
                    confirmPrompt: t('myRequests.withdrawConfirm'),
                    confirmYes: t('myRequests.withdrawYes'),
                    pendingLabel: t('myRequests.withdrawPending'),
                    cancelLabel: t('common.cancel', { ns: 'common' }),
                    errorFallback: t('myRequests.withdrawError'),
                  }}
                />
              }
            />
          ))}
        </RequestList>
      </div>
    </main>
  );
}
