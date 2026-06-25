'use client';

import { useTranslation } from 'react-i18next';
import type { GrowthModality } from '@/types/growth-hub';

interface GrowthFilterClientProps {
  selectedModality?: GrowthModality;
  onModalityChange: (modality: GrowthModality | undefined) => void;
  domainFilter?: string;
  onDomainChange: (domain: string) => void;
}

export function GrowthFilterClient({
  selectedModality,
  onModalityChange,
  domainFilter,
  onDomainChange,
}: Readonly<GrowthFilterClientProps>) {
  const { t } = useTranslation('growth');

  const modalities: (GrowthModality | undefined)[] = [
    undefined,
    'MENTOR',
    'COACH',
    'TRAINING',
    'PEER',
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('filter.all')}
        </label>
        <div className="flex flex-wrap gap-2">
          {modalities.map((m) => (
            <button
              key={m ?? 'all'}
              onClick={() => onModalityChange(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedModality === m
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {m ? t(`modality.${m.toLowerCase()}`) : t('filter.all')}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('filter.domain')}
        </label>
        <input
          type="text"
          value={domainFilter ?? ''}
          onChange={(e) => onDomainChange(e.target.value)}
          placeholder={t('filter.domain')}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>
    </div>
  );
}
