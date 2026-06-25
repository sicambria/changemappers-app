'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import { saveSkillsLearningAction } from '@/app/actions/onboarding';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';

const BASE_ARCHETYPE_OPTIONS = [
  { id: 'LOCAL_PRACTITIONER', icon: '🏡' },
  { id: 'NETWORK_WEAVER', icon: '🕸️' },
  { id: 'INSTITUTIONAL_CHANGEMAKER', icon: '🏛️' },
  { id: 'GLOBAL_AMPLIFIER', icon: '📢' },
  { id: 'RESOURCE_MOBILIZER', icon: '💰' },
  { id: 'INNOVATION_CATALYST', icon: '💡' },
  { id: 'SYSTEM_DISRUPTOR', icon: '⚡' },
  { id: 'STRATEGIC_ADVISOR', icon: '🎯' },
];

interface CauseProps {
    id: string;
    title: string;
}

interface Props {
    userId: string;
    cmapLevel: number;
    causesList: CauseProps[];
    onSuccess: () => void;
    onBack: () => void;
    onSkip: () => void;
}

const SKILL_KEYS = [
  'facilitation', 'projectManagement', 'permaculture', 'coding',
  'cooking', 'design', 'marketing', 'mentoring', 'translation', 'eventPlanning',
  'research', 'writing', 'photography', 'video', 'communityDevelopment', 'dataAnalysis',
];

const PROTECTION_NEEDS_KEYS = [
  'legalProtection', 'financialBridge', 'emotionalSafety',
  'technicalInfra', 'organizationalBacking', 'prVisibility', 'burnoutPrevention',
];

function toggleArchetype(prev: string[], id: string): string[] {
  if (prev.includes(id)) return prev.filter(x => x !== id);
  if (prev.length < 3) return [...prev, id];
  return prev;
}

function toggleStringItem(prev: string[], item: string): string[] {
  return prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item];
}

function filterOutItem(prev: string[], item: string): string[] {
  return prev.filter(x => x !== item);
}

function toggleCapped(prev: string[], id: string, cap: number): string[] {
  if (prev.includes(id)) return filterOutItem(prev, id);
  if (prev.length < cap) return [...prev, id];
  return prev;
}

function addCustomItem(
  prev: string[],
  value: string,
  setText: (v: string) => void,
): string[] {
  const trimmed = value.trim();
  if (trimmed && !prev.includes(trimmed)) {
    setText('');
    return [...prev, trimmed];
  }
  return prev;
}

export default function Stage4Skills({ userId, cmapLevel: _cmapLevel, causesList, onSuccess, onBack, onSkip }: Readonly<Props>) {
    const { t } = useTranslation(['auth', 'common']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

  const [skills, setSkills] = useState<string[]>([]);
  const [learning, setLearning] = useState<string[]>([]);
  const [baseArchetypes, setBaseArchetypes] = useState<string[]>([]);
  const [mainCauses, setMainCauses] = useState<string[]>([]);
  const [interestedCauses, setInterestedCauses] = useState<string[]>([]);
  const [protectionNeeds, setProtectionNeeds] = useState<string[]>([]);

    const [newSkillText, setNewSkillText] = useState('');
    const [newLearningText, setNewLearningText] = useState('');

  const handleStage4 = async () => {
  if (baseArchetypes.length === 0) {
  setError(t('onboarding.stage4.archetypesMinError'));
  return;
  }
  if (skills.length === 0) {
  setError(t('onboarding.errors.stage4_skills'));
  return;
  }
  if (learning.length === 0) {
  setError(t('onboarding.errors.stage4_learning'));
  return;
  }
  if (mainCauses.length === 0) {
  setError(t('onboarding.errors.stage4_causes'));
  return;
  }

        setIsSubmitting(true);
        setError(null);
        try {
            const res = await saveSkillsLearningAction(
                { baseArchetypes, skills, learning, mainCauses, interestedCauses, protectionNeeds },
                userId
            );
            if (res.success) {
                onSuccess();
            } else {
                setError(res.error || t('onboarding.errors.saveFailed'));
            }
        } catch {
            setError(t('onboarding.errors.generic'));
        } finally {
            setIsSubmitting(false);
        }
    };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const skillsList: any = t('onboarding.stage4.skillsList', { returnObjects: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const archetypesList: any = t('onboarding.stage4.archetypes', { returnObjects: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const protectionNeedsList: any = t('onboarding.stage4.protectionNeeds', { returnObjects: true });

    return (
        <div className="space-y-5">
            <div className="text-center mb-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('onboarding.stage4.title')}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('onboarding.stage4.subtitle')}</p>
            </div>

  {/* ── BASE Archetypes (mandatory) ──────────────────────────── */}
  <div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
  {t('onboarding.stage4.archetypesTitle')} <span className="text-red-500">*</span>
  </label>
  <p className="text-xs text-gray-500 mb-3">{t('onboarding.stage4.archetypesHint')}</p>
  <div className="grid grid-cols-2 gap-2">
  {BASE_ARCHETYPE_OPTIONS.map(arch => (
  <button
  key={arch.id}
  type="button"
  data-testid={`onboarding-stage4-archetype-${arch.id}`}
  onClick={() => setBaseArchetypes(prev => toggleArchetype(prev, arch.id))}
  className={`p-3 rounded-lg border text-left transition-all text-xs flex items-start gap-2 ${
  baseArchetypes.includes(arch.id)
  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300'
  : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
  }`}
  >
  <span className="text-lg leading-none mt-0.5 shrink-0">{arch.icon}</span>
  <span>
  <span className="font-medium block">{archetypesList?.[arch.id]?.name || arch.id}</span>
  <span className="text-[10px] text-gray-400 dark:text-gray-500 block mt-0.5">{archetypesList?.[arch.id]?.desc || ''}</span>
  </span>
  </button>
  ))}
  </div>
  {baseArchetypes.length === 0 && (
  <p className="text-xs text-red-500 mt-1">{t('onboarding.stage4.archetypesMinError')}</p>
  )}
  </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('onboarding.stage4.skillsLabel')}
                </label>
  <div className="flex flex-wrap gap-2 mb-3">
  {SKILL_KEYS.map(s => (
  <button key={s} type="button"
  onClick={() => setSkills(prev => toggleStringItem(prev, s))}
  className={`px-3 py-1 rounded-full text-xs border transition-colors ${skills.includes(s) ? 'bg-emerald-100 border-emerald-500 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
  }`}>
  {skillsList[s] || s}
  </button>
  ))}
  {skills.filter(s => !SKILL_KEYS.includes(s)).map(s => (
  <button key={s} type="button"
  onClick={() => setSkills(prev => filterOutItem(prev, s))}
  className="px-3 py-1 rounded-full text-xs border bg-emerald-100 border-emerald-500 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
  >
  {s} ✕
  </button>
  ))}
  </div>
  <div className="flex gap-2">
  <input
  data-testid="onboarding-stage4-custom-skill"
  type="text"
  value={newSkillText}
  onChange={e => setNewSkillText(e.target.value)}
  placeholder={t('onboarding.stage4.customSkillPlaceholder')}
  className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-sm"
  onKeyDown={e => {
  if (e.key === 'Enter') {
  e.preventDefault();
  setSkills(prev => addCustomItem(prev, newSkillText, setNewSkillText));
  }
  }}
  />
  <Button type="button" variant="outline" data-testid="onboarding-stage4-add-skill" onClick={() => {
  setSkills(prev => addCustomItem(prev, newSkillText, setNewSkillText));
  }}>{t('onboarding.stage4.addButton')}</Button>
  </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('onboarding.stage4.learningLabel')}
                </label>
  <div className="flex flex-wrap gap-2 mb-3">
  {SKILL_KEYS.map(s => (
  <button key={s} type="button"
  onClick={() => setLearning(prev => toggleStringItem(prev, s))}
  className={`px-3 py-1 rounded-full text-xs border transition-colors ${learning.includes(s) ? 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
  }`}>
  {skillsList[s] || s}
  </button>
  ))}
  {learning.filter(s => !SKILL_KEYS.includes(s)).map(s => (
  <button key={s} type="button"
  onClick={() => setLearning(prev => filterOutItem(prev, s))}
  className="px-3 py-1 rounded-full text-xs border bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
  >
  {s} ✕
  </button>
  ))}
  </div>
  <div className="flex gap-2">
  <input
  data-testid="onboarding-stage4-custom-learning"
  type="text"
  value={newLearningText}
  onChange={e => setNewLearningText(e.target.value)}
  placeholder={t('onboarding.stage4.customSkillPlaceholder')}
  className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-sm"
  onKeyDown={e => {
  if (e.key === 'Enter') {
  e.preventDefault();
  setLearning(prev => addCustomItem(prev, newLearningText, setNewLearningText));
  }
  }}
  />
  <Button type="button" variant="outline" data-testid="onboarding-stage4-add-learning" onClick={() => {
  setLearning(prev => addCustomItem(prev, newLearningText, setNewLearningText));
  }}>{t('onboarding.stage4.addButton')}</Button>
  </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('onboarding.stage4.mainCausesLabel')}
                </label>
                <div className="flex flex-wrap gap-2">
                    {causesList.map(c => (
                        <button key={c.id} type="button"
                            data-testid={`onboarding-stage4-main-cause-${c.id}`}
                            onClick={() => setMainCauses(prev => toggleCapped(prev, c.id, 3))}
                            className={`px-3 py-1 rounded-full text-xs border transition-colors ${mainCauses.includes(c.id) ? 'bg-rose-100 border-rose-500 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                                }`}>
                            {c.title}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('onboarding.stage4.interestedCausesLabel')}
                </label>
                <div className="flex flex-wrap gap-2">
                    {causesList.map(c => (
                        <button key={c.id} type="button"
                            onClick={() => setInterestedCauses(prev => toggleCapped(prev, c.id, 10))}
                            className={`px-3 py-1 rounded-full text-xs border transition-colors ${interestedCauses.includes(c.id) ? 'bg-purple-100 border-purple-500 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                                }`}>
                            {c.title}
                        </button>
                    ))}
                </div>
  </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
  {t('onboarding.stage4.protectionNeedsTitle')}
  </label>
  <p className="text-xs text-gray-500 mb-3 block">
  {t('onboarding.stage4.protectionNeedsHint')}
  </p>
  <div className="flex flex-wrap gap-2">
  {PROTECTION_NEEDS_KEYS.map(key => (
  <button key={key} type="button"
  onClick={() => setProtectionNeeds(prev => toggleStringItem(prev, key))}
  className={`px-3 py-1 rounded-full text-xs border transition-colors ${protectionNeeds.includes(key) ? 'bg-amber-100 border-amber-500 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
  }`}>
  {protectionNeedsList[key] || key}
  </button>
  ))}
  </div>
  </div>

  {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

  <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={onBack} className="flex-1">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" /> {t('onboarding.stage4.backButton')}
                </Button>
                <Button onClick={handleStage4} isLoading={isSubmitting} className="flex-1" data-testid="onboarding-stage4-submit">
                    {t('onboarding.stage4.nextButton')} <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
            </div>

            <button type="button" onClick={onSkip} className="w-full text-center text-xs text-gray-400 hover:text-emerald-500">
                {t('onboarding.stage4.skipButton')}
            </button>
        </div>
    );
}
