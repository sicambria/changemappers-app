'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import * as Sentry from '@sentry/nextjs';

export default function CommunitiesError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  const { t } = useTranslation('common');
  // AUDIT-20260612-011: report boundary-caught render errors to Sentry.
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="text-gray-500 dark:text-gray-400">{t('communitiesPage.loadFailed')}</p>
      <button
        onClick={reset}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
      >
        {t('communitiesPage.retry')}
      </button>
    </div>
  );
}
