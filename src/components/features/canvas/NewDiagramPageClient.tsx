'use client';

import { useTranslation } from 'react-i18next';
import DrawingBoardFormClient from './DrawingBoardFormClient';

export default function NewDiagramPageClient() {
  const { t } = useTranslation('canvas');

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('form.newDiagram')}</h1>
          <p className="text-sm text-gray-500">
            {t('form.subtitle')}
          </p>
        </div>
        <DrawingBoardFormClient />
      </div>
    </main>
  );
}
