'use client';

import { InfoIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CommonsLicenseNoticeProps {
  className?: string;
}

export function CommonsLicenseNotice({ className = '' }: Readonly<CommonsLicenseNoticeProps>) {
  const { t } = useTranslation('common');

  return (
    <div className={`rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-100 ${className}`}>
      <div className="flex items-start gap-2">
        <InfoIcon className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
        <div>
          <p className="font-medium">{t('commonsLicenseNotice.title')}</p>
          <p className="mt-1 text-xs leading-5">{t('commonsLicenseNotice.body')}</p>
        </div>
      </div>
    </div>
  );
}