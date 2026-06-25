'use client';

import { useEffect, useState } from 'react';
import { Star, Map, Zap, Beaker, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CompassClarityClient } from './CompassClarityClient';
import { CompassContextClient } from './CompassContextClient';
import { CompassCapacityClient } from './CompassCapacityClient';
import { CompassCatalystClient } from './CompassCatalystClient';
import type { CompassProfileData } from './types';

type PillarId = 'clarity' | 'context' | 'capacity' | 'catalyst';

const PILLARS: {
  id: PillarId;
  labelKey: string;
  subtitleKey: string;
  icon: React.ElementType;
  lockKey: string;
}[] = [
  {
    id: 'clarity',
    labelKey: 'compass.clarity.pillarLabel',
    subtitleKey: 'compass.clarity.title',
    icon: Star,
    lockKey: 'PILLAR_I',
  },
  {
    id: 'context',
    labelKey: 'compass.context.pillarLabel',
    subtitleKey: 'compass.context.title',
    icon: Map,
    lockKey: 'PILLAR_II',
  },
  {
    id: 'capacity',
    labelKey: 'compass.capacity.pillarLabel',
    subtitleKey: 'compass.capacity.title',
    icon: Zap,
    lockKey: 'PILLAR_II',
  },
  {
    id: 'catalyst',
    labelKey: 'compass.catalyst.pillarLabel',
    subtitleKey: 'compass.catalyst.title',
    icon: Beaker,
    lockKey: 'PILLAR_IV',
  },
];

interface Props {
  compassProfile: CompassProfileData;
}

function mergeUnlockedPillars(current: string[], next: string[]) {
  return Array.from(new Set([...current, ...next]));
}

export function CompassShell({ compassProfile }: Readonly<Props>) {
  const { t } = useTranslation('growth');
  const [localUnlockedPillars, setLocalUnlockedPillars] = useState<string[]>(
    () => compassProfile.unlockedPillars,
  );

  useEffect(() => {
    setLocalUnlockedPillars((current) => mergeUnlockedPillars(current, compassProfile.unlockedPillars));
  }, [compassProfile.unlockedPillars]);

  const unlockPillars = (...pillars: string[]) => {
    setLocalUnlockedPillars((current) => mergeUnlockedPillars(current, pillars));
  };

  const compassProfileWithLocalUnlocks = {
    ...compassProfile,
    unlockedPillars: localUnlockedPillars,
  };

  // Default to the first incomplete required pillar
  let defaultPillar: PillarId;
  if (!compassProfile.northStar) {
    defaultPillar = 'clarity';
  } else if (localUnlockedPillars.includes('PILLAR_IV')) {
    defaultPillar = 'catalyst';
  } else if (localUnlockedPillars.includes('PILLAR_II') && !compassProfile.confirmedScope) {
    defaultPillar = 'capacity';
  } else {
    defaultPillar = 'clarity';
  }

  const [activePillar, setActivePillar] = useState<PillarId>(defaultPillar);

  const isUnlocked = (lockKey: string) => localUnlockedPillars.includes(lockKey);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Page header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-0">
          <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
            {t('compass.shell.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('compass.shell.subtitle')}
          </p>
          </div>

          {/* Pillar tabs */}
          <nav className="flex gap-1 -mb-px" aria-label={t('compass.shell.navAriaLabel')}>
            {PILLARS.map((pillar) => {
              const unlocked = isUnlocked(pillar.lockKey);
              const isActive = activePillar === pillar.id;
              const Icon = pillar.icon;

              return (
                <button
                  key={pillar.id}
                  id={`compass-tab-${pillar.id}`}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    if (unlocked) setActivePillar(pillar.id);
                  }}
                  disabled={!unlocked}
                  className={`
                    group relative flex flex-col items-center gap-0.5 px-4 py-3 text-sm font-medium
                    border-b-2 transition-all duration-150 min-w-[80px]
                    ${(() => {
                      if (isActive) return 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400';
                      if (unlocked) return 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200';
                      return 'border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed';
                    })()}
                  `}
                >
                  <div className="flex items-center gap-1.5">
                    {unlocked ? (
                      <Icon className="w-4 h-4" />
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                  <span className="hidden sm:inline text-xs text-current opacity-70">{t(pillar.labelKey)}</span>
                </div>
                <span className="font-semibold">{t(pillar.subtitleKey)}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Pillar content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activePillar === 'clarity' && (
          <CompassClarityClient
            compassProfile={compassProfileWithLocalUnlocks}
            onClaritySaved={() => unlockPillars('PILLAR_II')}
          />
        )}
        {activePillar === 'context' && isUnlocked('PILLAR_II') && (
          <CompassContextClient compassProfile={compassProfileWithLocalUnlocks} />
        )}
        {activePillar === 'capacity' && isUnlocked('PILLAR_II') && (
          <CompassCapacityClient
            compassProfile={compassProfileWithLocalUnlocks}
            onScopeConfirmed={() => {
              unlockPillars('PILLAR_IV');
              setActivePillar('catalyst');
            }}
          />
        )}
        {activePillar === 'catalyst' && isUnlocked('PILLAR_IV') && (
          <CompassCatalystClient compassProfile={compassProfileWithLocalUnlocks} />
        )}
      </div>
    </div>
  );
}
