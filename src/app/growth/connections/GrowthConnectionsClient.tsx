'use client';

import { useTranslation } from 'react-i18next';
import type { GrowthModality } from '@/types/growth-hub';

interface GrowthConnectionsClientProps {
  initialConnections: Record<GrowthModality, unknown[]> | [];
}

export function GrowthConnectionsClient({ initialConnections }: Readonly<GrowthConnectionsClientProps>) {
  const { t } = useTranslation('growth');

  const connections = Array.isArray(initialConnections) 
    ? { TRAINING: [], MENTOR: [], COACH: [], PEER: [] } 
    : initialConnections;
  
  const hasConnections = Object.values(connections).some((arr) => arr.length > 0);

  if (!hasConnections) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          {t('tabs.connections')}
        </h1>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {t('empty.noConnections')}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        {t('tabs.connections')}
      </h1>

      <div className="space-y-6">
        {(Object.keys(connections) as GrowthModality[]).map((modality) => {
          const items = connections[modality];
          if (items.length === 0) return null;

          return (
            <div key={modality} className="space-y-2">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {t(`modality.${modality.toLowerCase()}`)}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {items.length} active connection(s)
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
