'use client';

import { useTranslation } from 'react-i18next';

export default function ProfessionalSupportBanner() {
  const { t } = useTranslation('peer');

  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200"
    >
      <strong className="font-semibold">{t('professionalSupportBanner.important')} </strong>
      {t('professionalSupportBanner.body')}
    </div>
  );
}
