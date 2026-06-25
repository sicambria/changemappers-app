'use client';

import { useState } from 'react';
import { InitiativeState } from '@/lib/prisma-shared';
import { useTranslation } from 'react-i18next';

type Props = {
  boardId: string;
  currentLimits: Record<string, number | null> | null;
  onUpdate: (limits: Record<string, number | null>) => void;
  onClose: () => void;
};

const STATES: InitiativeState[] = [
  'IMAGINED',
  'EXPLORING',
  'PLANNED',
  'IN_PROGRESS',
  'INTEGRATING',
  'COMPLETED',
  'ARCHIVED',
];

export function WipLimitConfigModal({ currentLimits, onUpdate, onClose }: Readonly<Props>) {
  const { t } = useTranslation('coordinate');
  const [limits, setLimits] = useState<Record<string, number | null>>(() => {
    const initial: Record<string, number | null> = {};
    for (const state of STATES) {
      initial[state] = currentLimits?.[state] ?? null;
    }
    return initial;
  });

  const handleChange = (state: string, value: string) => {
    if (value === '' || value === 'unlimited') {
      setLimits((prev) => ({ ...prev, [state]: null }));
    } else {
      const num = Number.parseInt(value, 10);
      if (!Number.isNaN(num) && num > 0) {
        setLimits((prev) => ({ ...prev, [state]: num }));
      }
    }
  };

  const handleSave = () => {
    onUpdate(limits);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          {t('wip.configure')}
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          {t('wip.description')}
        </p>

        <div className="space-y-3 mb-6">
          {STATES.filter((s) => s !== 'COMPLETED' && s !== 'ARCHIVED').map((state) => (
            <div key={state} className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{t(`states.${state}`)}</span>
              <input
                type="number"
                min="1"
                placeholder={t('wip.noLimit')}
                value={limits[state] ?? ''}
                onChange={(e) => handleChange(state, e.target.value)}
                className="w-24 rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3">
      <button
        onClick={onClose}
        className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition"
      >
        {t('common:actions.cancel')}
      </button>
      <button
        onClick={handleSave}
        className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-500 transition"
      >
        {t('wip.saveLimits')}
      </button>
        </div>
      </div>
    </div>
  );
}
