'use client';

import { useTranslation } from 'react-i18next';
import { RequestCard } from '@/components/features/growth-hub/RequestCard';
import { RequestList } from '@/components/features/growth-hub/RequestList';
import { LifecycleActionButton } from '@/components/features/growth-hub/LifecycleActionButton';
import { withdrawMentoringRequestAction } from '@/app/actions/mentoring';

type Request = {
  id: string;
  domain: string;
  inflectionPoint: string;
  guidanceSought: string;
  createdAt: Date;
};

export function MyMentoringRequestsClient({ requests }: Readonly<{ requests: Request[] }>) {
  const { t } = useTranslation('mentor');

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
                { label: t('myRequests.domainLabel'), value: r.domain },
                { label: t('myRequests.inflectionPointLabel'), value: r.inflectionPoint },
                { label: t('myRequests.guidanceSoughtLabel'), value: r.guidanceSought },
              ]}
              createdAt={r.createdAt}
              actions={
                <LifecycleActionButton
                  action={() => withdrawMentoringRequestAction(r.id)}
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
