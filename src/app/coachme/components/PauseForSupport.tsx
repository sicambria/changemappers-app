'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { XIcon } from 'lucide-react';
import { getSupportResources } from '@/app/actions/coachme';

interface PauseForSupportProps {
  isOpen: boolean;
  onClose: () => void;
  onEndSession: () => void;
}

interface SupportResource {
  id: string;
  name: string;
  type: string;
  contact: string;
  description: string | null;
}

export function PauseForSupport({ isOpen, onClose, onEndSession }: Readonly<PauseForSupportProps>) {
  const { t } = useTranslation('coachme');
  const [resources, setResources] = useState<SupportResource[]>([]);

  useEffect(() => {
    if (isOpen) {
      getSupportResources().then((result) => {
        if (result.success && result.data) {
          setResources(result.data);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
      <div className="p-6 flex justify-end">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label={t('safety.close')}
        >
          <XIcon className="h-6 w-6 text-gray-500" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          {t('safety.pauseMessage')}
        </h1>

        <div className="mt-8 space-y-4 max-w-md">
          <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {t('safety.supportResources')}
          </h2>
          {resources.length > 0 ? (
            <div className="space-y-3">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-left"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {resource.name}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {resource.type}: {resource.contact}
                  </div>
                  {resource.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                      {resource.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400">
              <p className="font-medium">{t('safety.crisisLines')}</p>
              <p className="mt-2">116-123 (24/7, free)</p>
              <p>{t('safety.emergency')}</p>
            </div>
          )}
        </div>

        <div className="mt-12 flex gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            {t('safety.returnButton')}
          </button>
          <button
            onClick={onEndSession}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {t('safety.endSession')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PauseButton({ onClick }: Readonly<{ onClick: () => void }>) {
  const { t } = useTranslation('coachme');

  return (
    <>
      <button
        onClick={onClick}
        className="fixed bottom-4 left-4 z-40 px-4 py-3 bg-rose-600 text-white rounded-lg shadow-lg font-medium hover:bg-rose-700 transition-colors"
      >
        {t('safety.pauseButton')}
      </button>
      <div className="fixed bottom-4 left-4 right-4 z-30 mt-16 text-center text-xs text-gray-500 dark:text-gray-400 pointer-events-none">
        <span className="bg-white dark:bg-gray-900 px-2 py-1 rounded shadow-sm">
          {t('safety.disclosure')}
        </span>
      </div>
    </>
  );
}
