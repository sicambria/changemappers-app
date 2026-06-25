'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  const { t } = useTranslation('common');

  useEffect(() => {
    // AUDIT-20260612-011: the root catch-all boundary now reports to Sentry.
    Sentry.captureException(error);
    console.error('Global error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {t('errors.generic')}
      </h1>
      <p className="max-w-md text-gray-500 dark:text-gray-400">
        {t('errors.unexpectedDescription', 'An unexpected error occurred. Please try again, or go back to the main page.')}
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          {t('actions.retry')}
        </button>
        <Link
          href="/"
          className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {t('nav.home', 'Home')}
        </Link>
      </div>
    </div>
  );
}
