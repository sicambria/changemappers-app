'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import InitiativeFormClient from '@/components/features/coordinate/InitiativeFormClient';

export default function NewInitiativeClient() {
  const { t } = useTranslation('kanban');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2">
          <Link href="/kanban" className="text-sm text-slate-400 hover:text-slate-200">
            ← {t('backlog')}
          </Link>
          <h1 className="text-3xl font-bold">{t('startAnInitiative')}</h1>
          <p className="text-slate-400">
            {t('nameTheChange')}. {t('initiativeIntro')}
          </p>
        </div>

        <InitiativeFormClient />
      </div>
    </main>
  );
}
