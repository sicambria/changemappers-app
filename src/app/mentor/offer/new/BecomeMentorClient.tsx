'use client';

import { useTranslation } from 'react-i18next';
import MentorProfileFormClient from '@/components/features/mentor/MentorProfileFormClient';

export default function BecomeMentorClient() {
  const { t } = useTranslation('mentor');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('becomeMentor')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('shareExpertise')}</p>
        </div>
        <MentorProfileFormClient />
      </div>
    </div>
  );
}
