'use client';

import { useTranslation } from 'react-i18next';

export function RequestCoachingClient() {
  const { t } = useTranslation('coaching');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('request.pageTitle')}</h1>
          <p className="text-slate-400">
            {t('request.pageDescription')}
          </p>
        </div>
      </div>
    </div>
  );
}
