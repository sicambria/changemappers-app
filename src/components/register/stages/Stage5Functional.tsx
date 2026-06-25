'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@/components/ui';
import { saveFunctionalContextAction } from '@/app/actions/onboarding';
import { RDG_GOALS } from '@/lib/taxonomy';
import { ArrowLeftIcon, ArrowRightIcon, ZapIcon, BatteryLowIcon, MinusIcon } from 'lucide-react';

function toggleStringCapped(prev: string[], value: string, cap: number): string[] {
  if (prev.includes(value)) return prev.filter(x => x !== value);
  if (prev.length < cap) return [...prev, value];
  return prev;
}

function toggleStringItem(prev: string[], value: string): string[] {
  return prev.includes(value) ? prev.filter(r => r !== value) : [...prev, value];
}

function getEnergyButtonClass(state: EnergyState): string {
  if (state === 'energising') return 'bg-emerald-100 border-emerald-500 text-emerald-800';
  if (state === 'draining') return 'bg-red-100 border-red-400 text-red-700';
  return 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100';
}

function getEnergyStateIcon(state: EnergyState): string {
  if (state === 'energising') return '⚡ ';
  if (state === 'draining') return '🪫 ';
  return '';
}

export const FUNCTION_CATEGORIES = [
  {
    key: 'thinking',
    functions: [
      'vision_setting', 'strategic_thinking', 'concept_design',
      'writing', 'research', 'narrative_building',
      'systems_mapping', 'idea_generation', 'critical_analysis', 'learning_synthesis',
    ],
  },
  {
    key: 'connecting',
    functions: [
      'facilitation', 'network_weaving', 'conflict_transformation',
      'relationship_cultivation', 'community_hosting', 'listening',
      'peer_support', 'trust_building', 'onboarding', 'group_culture',
    ],
  },
  {
    key: 'organizing',
    functions: [
      'project_management', 'operations', 'logistics',
      'coordination', 'process_design', 'documentation',
      'budgeting', 'reporting', 'problem_solving', 'quality_assurance',
    ],
  },
  {
    key: 'influencing',
    functions: [
      'public_speaking', 'media_relations', 'fundraising',
      'campaigning', 'advocacy', 'storytelling',
      'translation_bridging', 'teaching', 'mentoring', 'negotiation',
    ],
  },
  {
    key: 'building',
    functions: [
      'design', 'coding', 'fabrication', 'event_production',
      'space_design', 'food_systems', 'arts', 'media_production',
      'data_analysis', 'prototyping',
    ],
  },
  {
    key: 'leading',
    functions: [
      'holding_space', 'decision_making', 'accountability',
      'visionary_leadership', 'servant_leadership', 'culture_setting',
      'regenerative_practice', 'self_care_modelling', 'wisdom_keeping', 'celebration',
    ],
  },
];

const RDG_OPTIONS = RDG_GOALS.map((goal) => ({
  value: goal.id,
  label: `${goal.id}: ${goal.officialTitle}`,
}));

const AVAILABILITY_MODES = [
  { id: 'DELIVERING', emoji: '🚀' },
  { id: 'BETWEEN', emoji: '🌊' },
  { id: 'BUILDING', emoji: '🔨' },
  { id: 'REFLECTING', emoji: '🍃' },
  { id: 'RESTING', emoji: '🌙' },
];

export type EnergyState = 'energising' | 'draining' | 'neutral';
export type AvailabilityMode = 'DELIVERING' | 'BETWEEN' | 'BUILDING' | 'REFLECTING' | 'RESTING';
export type WorkScale = 'COMMUNITY' | 'SECTOR' | 'CROSS_SECTOR' | 'MULTI_SCALE';

interface Props {
    userId: string;
    cmapLevel: number;
    onSuccess: (skipL6?: boolean) => void;
    onBack: () => void;
}

export default function Stage5Functional({ userId, cmapLevel, onSuccess, onBack }: Readonly<Props>) {
    const { t } = useTranslation(['auth', 'common']);
    const [subStep, setSubStep] = useState<1 | 2>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Part 1
    const [energyMap, setEnergyMap] = useState<Record<string, EnergyState>>({});
    const [availabilityMode, setAvailabilityMode] = useState<AvailabilityMode>('DELIVERING');
    const [currentOffer, setCurrentOffer] = useState('');
    const [workContext, setWorkContext] = useState({ lastEffort: '', outsideRole: '', scale: '' as WorkScale });

    // Part 2 (RDG)
    const [rdgMain, setRdgMain] = useState<string[]>([]);
    const [rdgInterested, setRdgInterested] = useState<string[]>([]);
    const [rdgProject, setRdgProject] = useState('');
    const [rdgPartnership, setRdgPartnership] = useState<string | null>(null);
    const [existentialRisks, setExistentialRisks] = useState<string[]>([]);

    const toggleEnergy = (fn: string) => {
        setEnergyMap(prev => {
            const cur = prev[fn] ?? 'neutral';
            let next: EnergyState;
            if (cur === 'neutral') { next = 'energising'; }
            else if (cur === 'energising') { next = 'draining'; }
            else { next = 'neutral'; }
            return { ...prev, [fn]: next };
        });
    };

    const energisingFunctions = Object.entries(energyMap).filter(([, v]) => v === 'energising').map(([k]) => k);
    const drainingFunctions = Object.entries(energyMap).filter(([, v]) => v === 'draining').map(([k]) => k);

    const handlePart1Next = () => {
        // Energy map is optional; RDG context is collected in the next step for every level.
        setError(null);
        setSubStep(2);
    };

    const handleFinalSubmit = async () => {
        if (!rdgMain[0]) {
            setError(t('onboarding.errors.stage5_5_main'));
            return;
        }
        if (cmapLevel >= 5 && (!rdgProject || !rdgPartnership || existentialRisks.length === 0)) {
            setError(t('onboarding.errors.stage5_5_l5'));
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const res = await saveFunctionalContextAction({
                energisingFunctions,
                drainingFunctions,
                availabilityMode,
                currentOffer: currentOffer || undefined,
                workContextLastEffort: workContext.lastEffort || undefined,
                workContextOutsideRole: workContext.outsideRole || undefined,
                workContextScale: workContext.scale || undefined,
                rdgMain,
                rdgInterested,
                rdgProject: rdgProject || undefined,
                rdgPartnership: rdgPartnership || undefined,
                existentialRisks,
            }, userId);

            if (res.success) {
                onSuccess(false);
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
  const modesList: any = t('onboarding.stage5.modes', { returnObjects: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoriesList: any = t('onboarding.stage5.categories', { returnObjects: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const functionsList: any = t('onboarding.stage5.functions', { returnObjects: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const partnershipsList: any = t('onboarding.stage5_5.partnerships', { returnObjects: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const risksList: any = t('onboarding.stage5_5.risks', { returnObjects: true });

    if (subStep === 1) {
        return (
            <div className="space-y-6">
                <div className="text-center mb-2">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('onboarding.stage5.title')}</h2>
                    <p className="text-sm text-gray-500 mt-1">{t('onboarding.stage5.subtitle')}</p>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('onboarding.stage5.q1_lastEffort')}
                        </label>
                        <textarea value={workContext.lastEffort} onChange={(e) => setWorkContext(p => ({ ...p, lastEffort: e.target.value }))}
                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                            rows={2} placeholder={t('onboarding.stage5.q1_placeholder')} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('onboarding.stage5.q2_outsideRole')}
                        </label>
                        <textarea value={workContext.outsideRole} onChange={(e) => setWorkContext(p => ({ ...p, outsideRole: e.target.value }))}
                            className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                            rows={2} placeholder={t('onboarding.stage5.q2_placeholder')} />
                    </div>
                </div>

                <div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('onboarding.stage5.energyTitle')}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1"><ZapIcon className="h-3 w-3 text-emerald-500" /> {t('onboarding.stage5.energyLegendEnergising')}</span>
                        <span className="flex items-center gap-1"><BatteryLowIcon className="h-3 w-3 text-red-400" /> {t('onboarding.stage5.energyLegendDraining')}</span>
                        <span className="flex items-center gap-1"><MinusIcon className="h-3 w-3 text-gray-400" /> {t('onboarding.stage5.energyLegendNeutral')}</span>
                    </div>
  {FUNCTION_CATEGORIES.map((cat) => (
  <div key={cat.key} className="mb-4">
  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
  {categoriesList?.[cat.key]?.emoji || ''} {categoriesList?.[cat.key]?.label || cat.key}
  </div>
  <div className="flex flex-wrap gap-2">
  {cat.functions.map(fn => {
  const state = energyMap[fn] ?? 'neutral';
  return (
  <button key={fn} type="button" onClick={() => toggleEnergy(fn)}
  className={`px-2.5 py-1 rounded-full text-xs border transition-all ${getEnergyButtonClass(state)}`}>
  {getEnergyStateIcon(state)}{functionsList?.[fn] ?? fn}
  </button>
  );
  })}
  </div>
  </div>
  ))}
                </div>

  <div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
  {t('onboarding.stage5.modeTitle')}
  </label>
  <div className="grid grid-cols-1 gap-2">
  {AVAILABILITY_MODES.map(m => (
  <button key={m.id} type="button" onClick={() => setAvailabilityMode(m.id as AvailabilityMode)}
  className={`p-3 rounded-lg border text-left transition-all ${availabilityMode === m.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
  <span className="text-base mr-2">{m.emoji}</span>
  <span className="text-sm font-medium text-gray-900">{modesList[m.id] || m.id}</span>
  <span className="text-xs text-gray-500 ml-2">{modesList[`${m.id}_DESC`] || ''}</span>
  </button>
  ))}
  </div>
  </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('onboarding.stage5.offerTitle')}
                    </label>
                    <Input value={currentOffer} onChange={(e) => setCurrentOffer(e.target.value)} placeholder={t('onboarding.stage5.offerPlaceholder')} maxLength={200} />
                </div>

                {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

                <div className="flex gap-3">
                    <Button variant="outline" onClick={onBack} className="flex-1">
                        <ArrowLeftIcon className="h-4 w-4 mr-2" /> {t('onboarding.stage5.backButton')}
                    </Button>
                    <Button onClick={handlePart1Next} className="flex-1" data-testid="onboarding-stage5-part1-submit">
                        {t('onboarding.stage5.nextButton')} <ArrowRightIcon className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('onboarding.stage5_5.title')}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('onboarding.stage5_5.subtitle')}</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">{t('onboarding.stage5_5.q1_main')}</label>
                    <select data-testid="onboarding-stage5-rdg-main" value={rdgMain[0] || ''} onChange={e => setRdgMain([e.target.value])} className="w-full p-2.5 rounded-lg border border-gray-300 text-sm">
                        <option value="" disabled>{t('onboarding.stage5_5.q1_placeholder')}</option>
                        {RDG_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">{t('onboarding.stage5_5.q2_interested')}</label>
                    <div className="flex flex-col gap-2">
                        {RDG_OPTIONS.map((d) => (
                            <button key={d.value + '_sub'} type="button"
                                onClick={() => setRdgInterested(prev => toggleStringCapped(prev, d.value, 2))}
                                className={`px-3 py-2 text-left rounded-lg text-sm border transition-colors ${rdgInterested.includes(d.value) ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                </div>

                {cmapLevel >= 5 && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">{t('onboarding.stage5_5.q3_project')}</label>
                            <textarea value={rdgProject} onChange={(e) => setRdgProject(e.target.value)} className="w-full p-2.5 rounded-lg border border-gray-300 bg-white text-sm" rows={2} placeholder={t('onboarding.stage5_5.q3_placeholder')} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">{t('onboarding.stage5_5.q4_partnership')}</label>
                            <select value={rdgPartnership || ''} onChange={e => setRdgPartnership(e.target.value)} className="w-full p-2.5 rounded-lg border border-gray-300 text-sm">
                                <option value="" disabled>{t('onboarding.stage5_5.q4_placeholder')}</option>
                                <option value="government">{partnershipsList['government']}</option>
                                <option value="corporate">{partnershipsList['corporate']}</option>
                                <option value="grassroots">{partnershipsList['grassroots']}</option>
                                <option value="academia">{partnershipsList['academia']}</option>
                                <option value="tech">{partnershipsList['tech']}</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">{t('onboarding.stage5_5.q5_risk')}</label>
                            <div className="flex flex-wrap gap-2">
                                {['Climate collapse', 'Synthetic biology', 'AI safety', 'Nuclear threat', 'Social polarization/collapse'].map(risk => (
                                    <button key={risk} type="button"
                                        onClick={() => setExistentialRisks(prev => toggleStringItem(prev, risk))}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${existentialRisks.includes(risk) ? 'bg-red-100 border-red-500 text-red-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        {risksList[risk] || risk}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

            <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setSubStep(1)} className="flex-1">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" /> {t('onboarding.stage5_5.backButton')}
                </Button>
                <Button onClick={handleFinalSubmit} isLoading={isSubmitting} className="flex-1" data-testid="onboarding-stage5-part2-submit">
                    {t('onboarding.stage5_5.nextButton')} <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
