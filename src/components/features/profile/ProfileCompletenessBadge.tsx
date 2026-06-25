'use client';

import { useTranslation } from 'react-i18next';

interface ProfileCompletenessBadgeProps {
  percentage: number;
  onClick: () => void;
}

export function ProfileCompletenessBadge({ percentage, onClick }: Readonly<ProfileCompletenessBadgeProps>) {
  const { t } = useTranslation(['profiles']);

  if (percentage >= 100) return null;

  return (
    <button
      onClick={onClick}
      className="text-xs font-medium text-slate-400 hover:text-slate-300 transition-colors cursor-pointer"
      title={t('completenessBadge.clickHint')}
    >
      {t('completenessBadge.label', { percent: percentage })}
    </button>
  );
}
