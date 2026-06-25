'use client';

import { useTranslation } from 'react-i18next';

export default function NewMentoringRequestClient() {
  const { t } = useTranslation('mentor');

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {t('requestMentor')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Mentoring request form {t('comingSoon')}.
        </p>
      </div>
    </main>
  );
}
