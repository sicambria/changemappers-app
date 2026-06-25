'use client';

import { useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { Compass, User, Users, Globe, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { saveCompassPlacement } from '@/app/actions/compass';

type Phase = 'I' | 'II' | 'III';

const PHASE_CONFIG = [
  {
    id: 'I' as Phase,
    focus: 'myself',
    icon: User,
    colorText: 'text-amber-600 dark:text-amber-400',
    colorBg: 'bg-amber-50 dark:bg-amber-900/20',
    colorBorder: 'border-amber-200 dark:border-amber-800/50',
  },
  {
    id: 'II' as Phase,
    focus: 'my community',
    icon: Users,
    colorText: 'text-emerald-600 dark:text-emerald-400',
    colorBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    colorBorder: 'border-emerald-200 dark:border-emerald-800/50',
  },
  {
    id: 'III' as Phase,
    focus: 'the journey itself',
    icon: Globe,
    colorText: 'text-blue-600 dark:text-blue-400',
    colorBg: 'bg-blue-50 dark:bg-blue-900/20',
    colorBorder: 'border-blue-200 dark:border-blue-800/50',
  },
];

const PHASE_IDS: Phase[] = ['I', 'II', 'III'];

export function CompassEntryClient() {
  const { t } = useTranslation('growth');
  const [isPending, startTransition] = useTransition();
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activePhase = PHASE_IDS.find(p => p === selectedPhase);
  const activeConfig = PHASE_CONFIG.find(p => p.id === selectedPhase);

  const handleContinue = () => {
    if (selectedLevelId === null) return;
    setError(null);
    startTransition(async () => {
      try {
        await saveCompassPlacement(selectedLevelId);
        globalThis.location.assign('/compass');
      } catch {
        setError(t('compass.entry.error'));
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Intro Card */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl">
            <Compass className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('compass.entry.introTitle')}</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {t('compass.entry.introDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Phase Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white px-2">{t('compass.entry.selectPhase')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PHASE_CONFIG.map((phase) => {
            const isSelected = selectedPhase === phase.id;
            const Icon = phase.icon;

            return (
              <button
                key={phase.id}
                onClick={() => {
                  setSelectedPhase(phase.id);
                  setSelectedLevelId(null);
                }}
                className={`text-left p-6 rounded-2xl border transition-all duration-200 group ${
                  isSelected
                    ? `${phase.colorBg} ${phase.colorBorder} ring-2 ring-emerald-500 shadow-md`
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 transition-colors ${
                  isSelected ? 'bg-white dark:bg-gray-800 shadow-sm' : phase.colorBg
                }`}>
                  <Icon className={`w-5 h-5 ${phase.colorText}`} />
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1">{t('compass.entry.phaseNum', { num: phase.id })}</h4>
                <div className={`text-sm font-medium mb-3 ${phase.colorText}`}>{t('compass.entry.focusLabel')} {t(`compass.entry.phases.${phase.id}.focus`)}</div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 group-hover:line-clamp-none transition-all">
                  {t(`compass.entry.phases.${phase.id}.description`)}
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-500 italic border-l-2 border-gray-300 dark:border-gray-700 pl-2">
                  {t(`compass.entry.phases.${phase.id}.markers`)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Level Selection */}
      {activePhase && activeConfig && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500 pt-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white px-2">
            {t('compass.entry.whereExactly', { phase: activePhase })}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 px-2 mb-2">
            {t('compass.entry.placementOptionalHint')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(id => {
              if (activePhase === 'I') return id <= 3;
              if (activePhase === 'II') return id >= 4 && id <= 5;
              return id >= 6;
            }).map((levelId) => {
              const isSelected = selectedLevelId === levelId;
              return (
                <button
                  key={levelId}
                  onClick={() => setSelectedLevelId(levelId)}
                  className={`relative p-4 text-left rounded-xl border transition-all duration-200 ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/20 dark:border-emerald-500 shadow-sm'
                      : 'bg-white border-gray-200 hover:border-emerald-300 dark:bg-gray-900 dark:border-gray-800 dark:hover:border-emerald-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300">
                      L{levelId}
                    </span>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">{t(`compass.entry.levels.${levelId}.archetype`)}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('compass.entry.sphereLabel')} {t(`compass.entry.levels.${levelId}.sphere`)}</p>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 px-2 pt-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="pt-6 flex justify-end">
            <button
              onClick={handleContinue}
              disabled={selectedLevelId === null || isPending}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                selectedLevelId === null || isPending
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow active:scale-95'
              }`}
            >
              {isPending ? t('compass.entry.saving') : t('compass.entry.confirmSelfPlacement')}
              {!isPending && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
