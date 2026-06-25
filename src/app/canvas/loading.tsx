'use client';

import { useTranslation } from 'react-i18next';

export default function CanvasLoading() {
  const { t } = useTranslation('common');
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('canvasPage.loading', 'Loading canvas...')}</p>
      </div>
    </div>
  );
}
