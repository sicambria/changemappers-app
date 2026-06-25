'use client';

import { useTranslation } from 'react-i18next';
import TrainingRequestFormClient from '@/components/features/training/TrainingRequestFormClient';

export default function NewTrainingRequestClient() {
  const { t } = useTranslation('training');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('postRequest')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('describeSkillsToDevelop')}</p>
        </div>
        <TrainingRequestFormClient />
      </div>
    </div>
  );
}
