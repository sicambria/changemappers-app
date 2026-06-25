'use client';

import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';
import { RDG_DOMAINS, RDG_GOALS, normalizeRdgId, formatRdgLabel } from '@/lib/taxonomy';

export interface DomainGoalSelectorProps {
  selectedGoals: string[];
  onChange: (goals: string[]) => void;
  maxGoals?: number;
  namespace?: 'volunteer' | 'common';
  error?: string;
  disabled?: boolean;
}

const RDG_DOMAIN_TO_GOALS = Object.fromEntries(
  RDG_DOMAINS.map((domain) => [
    domain.id,
    RDG_GOALS.filter((goal) => goal.domainId === domain.id).map((goal) => goal.id),
  ]),
) as Record<string, string[]>;

const GOAL_TO_DOMAIN = Object.fromEntries(
  RDG_GOALS.map((goal) => [goal.id, goal.domainId]),
) as Record<string, string>;

export function DomainGoalSelector({
  selectedGoals,
  onChange,
  maxGoals = 3,
  namespace = 'volunteer',
  error,
  disabled,
}: Readonly<DomainGoalSelectorProps>) {
  const { i18n } = useTranslation(namespace);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const stableLanguage = hasHydrated ? i18n.resolvedLanguage ?? i18n.language : 'en';
  const normalizedSelectedGoals = selectedGoals.map((goal) => normalizeRdgId(goal) ?? goal);

  const toggleGoal = (goalId: string) => {
    const exists = normalizedSelectedGoals.includes(goalId);
    if (exists) {
      onChange(normalizedSelectedGoals.filter((goal) => goal !== goalId));
    } else if (normalizedSelectedGoals.length < maxGoals) {
      onChange([...normalizedSelectedGoals, goalId]);
    }
  };

  const getDomainLabel = (domainId: string) => {
    const domain = RDG_DOMAINS.find((item) => item.id === domainId);
    return domain?.name ?? i18n.t(`causes.domains.${domainId.replace('D', '')}.title`, { ns: 'common', lng: stableLanguage });
  };

  const getGoalLabel = (goalId: string) => {
    return i18n.t(`rdgs.${goalId}`, { ns: 'volunteer', lng: stableLanguage, defaultValue: formatRdgLabel(goalId) });
  };

  const getSelectedCountInDomain = (domainId: string) => {
    return normalizedSelectedGoals.filter((goalId) => GOAL_TO_DOMAIN[goalId] === domainId).length;
  };

  return (
    <div ref={containerRef} className="space-y-3">
      <div className="grid gap-2">
        {RDG_DOMAINS.map((domain) => {
          const domainId = domain.id;
          const isExpanded = expandedDomain === domainId;
          const selectedInDomain = getSelectedCountInDomain(domainId);
          const domainGoals = RDG_DOMAIN_TO_GOALS[domainId];

          return (
            <div key={domainId} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedDomain(isExpanded ? null : domainId)}
                disabled={disabled}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                  isExpanded
                    ? 'bg-emerald-50 dark:bg-emerald-900/20'
                    : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {getDomainLabel(domainId)}
                  </span>
                  {selectedInDomain > 0 && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                      {selectedInDomain}
                    </span>
                  )}
                </div>
                <ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {isExpanded && (
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-1.5">
                    {domainGoals.map((goalId) => {
                      const isSelected = normalizedSelectedGoals.includes(goalId);
                      const canSelect = normalizedSelectedGoals.length < maxGoals || isSelected;

                      return (
                        <button
                          key={goalId}
                          type="button"
                          onClick={() => toggleGoal(goalId)}
                          disabled={disabled || !canSelect}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${(() => {
                            if (isSelected) return 'bg-emerald-500 text-white';
                            if (canSelect) return 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-emerald-400 dark:hover:border-emerald-500';
                            return 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed';
                          })()} ${disabled ? 'opacity-50' : ''}`}
                        >
                          {isSelected && <CheckIcon className="h-3 w-3" />}
                          {getGoalLabel(goalId)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {i18n.t('request.rdg.selected', { ns: namespace, lng: stableLanguage, defaultValue: 'Selected' })}: {normalizedSelectedGoals.length}/{maxGoals}
        </span>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

export function getDomainIdFromGoal(goalId: string): string | undefined {
  const normalized = normalizeRdgId(goalId);
  return normalized ? GOAL_TO_DOMAIN[normalized] : undefined;
}

export { RDG_DOMAIN_TO_GOALS, GOAL_TO_DOMAIN };
