'use client';

import { useTranslation } from 'react-i18next';

export default function GlobalLoading() {
  const { t } = useTranslation('common');
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('actions.loading')}</p>
      </div>
    </div>
  );
}
