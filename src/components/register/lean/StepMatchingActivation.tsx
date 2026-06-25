'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ActionRequirements } from '@/components/ui/ActionRequirements';
import { Button, Input } from '@/components/ui';
import {
  ArrowRightIcon,
  CircleIcon,
  HandshakeIcon,
  MapPinIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from 'lucide-react';
import {
  saveFunctionalContextAction,
  saveFunctionalDepthAction,
  saveSkillsLearningAction,
} from '@/app/actions/onboarding';
import { completeMatchingActivationAction } from '@/app/actions/lean-register';
import { RDG_GOALS } from '@/lib/taxonomy';
import { cn } from '@/lib/utils';

interface CauseOption {
  id: string;
  title: string;
}

interface Props {
  userId: string;
  causesList: CauseOption[];
}

type AvailabilityMode = 'DELIVERING' | 'BETWEEN' | 'BUILDING' | 'REFLECTING' | 'RESTING';

const BASE_ARCHETYPE_OPTIONS = [
  { id: 'LOCAL_PRACTITIONER', icon: 'LP' },
  { id: 'NETWORK_WEAVER', icon: 'NW' },
  { id: 'INSTITUTIONAL_CHANGEMAKER', icon: 'IC' },
  { id: 'GLOBAL_AMPLIFIER', icon: 'GA' },
  { id: 'RESOURCE_MOBILIZER', icon: 'RM' },
  { id: 'INNOVATION_CATALYST', icon: 'IN' },
  { id: 'SYSTEM_DISRUPTOR', icon: 'SD' },
  { id: 'STRATEGIC_ADVISOR', icon: 'SA' },
] as const;

const SKILL_KEYS = [
  'facilitation',
  'projectManagement',
  'permaculture',
  'coding',
  'cooking',
  'design',
  'marketing',
  'mentoring',
  'translation',
  'eventPlanning',
  'research',
  'writing',
  'photography',
  'video',
  'communityDevelopment',
  'dataAnalysis',
] as const;

const CONTRIBUTION_SEED_TYPE_VALUES = [
  { value: 'QUESTION', labelKey: 'onboarding.lean.step6.seedTypes.question' },
  { value: 'PERSPECTIVE', labelKey: 'onboarding.lean.step6.seedTypes.perspective' },
  { value: 'SKILL', labelKey: 'onboarding.lean.step6.seedTypes.skill' },
  { value: 'LOCAL_PATTERN', labelKey: 'onboarding.lean.step6.seedTypes.localPattern' },
  { value: 'RESOURCE', labelKey: 'onboarding.lean.step6.seedTypes.resource' },
  { value: 'OFFER', labelKey: 'onboarding.lean.step6.seedTypes.offer' },
] as const;

const AVAILABILITY_MODES: Array<{ id: AvailabilityMode; icon: string }> = [
  { id: 'BETWEEN', icon: 'BT' },
  { id: 'BUILDING', icon: 'BU' },
  { id: 'DELIVERING', icon: 'DL' },
  { id: 'REFLECTING', icon: 'RF' },
  { id: 'RESTING', icon: 'RS' },
];

const RDG_OPTIONS = RDG_GOALS.map((goal) => ({
  value: goal.id,
  label: `${goal.id}: ${goal.officialTitle}`,
}));

function requiredSectionClass(invalid: boolean): string {
  return cn(
    'space-y-3 border-t pt-5 transition-colors',
    invalid ? 'border-red-300 dark:border-red-800' : 'border-gray-100 dark:border-gray-800',
  );
}

function requiredGroupClass(invalid: boolean, baseClass: string): string {
  return cn(
    baseClass,
    'rounded-lg border p-2 transition-colors',
    invalid
      ? 'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20'
      : 'border-transparent',
  );
}

function fieldClass(invalid: boolean): string {
  return cn(
    'w-full rounded-lg border bg-white p-2.5 text-sm text-gray-900 transition-colors dark:bg-gray-800 dark:text-white',
    invalid ? 'border-red-400 ring-1 ring-red-300 dark:border-red-700 dark:ring-red-900/70' : 'border-gray-300 dark:border-gray-700',
  );
}

function toggleLimited(value: string, current: string[], max: number): string[] {
  if (current.includes(value)) {
    return current.filter((item) => item !== value);
  }
  if (current.length >= max) {
    return current;
  }
  return [...current, value];
}

function addCustomValue(value: string, current: string[], max: number): string[] {
  const trimmed = value.trim();
  if (!trimmed || current.includes(trimmed) || current.length >= max) {
    return current;
  }
  return [...current, trimmed];
}

export default function StepMatchingActivation({ userId, causesList }: Readonly<Props>) {
  const { t } = useTranslation(['auth']);
  const router = useRouter();
  const [baseArchetypes, setBaseArchetypes] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [learningNeeds, setLearningNeeds] = useState<string[]>([]);
  const [mainCauses, setMainCauses] = useState<string[]>([]);
  const [rdgMain, setRdgMain] = useState<string[]>([]);
  const [availabilityMode, setAvailabilityMode] = useState<AvailabilityMode>('BETWEEN');
  const [currentOffer, setCurrentOffer] = useState('');
  const [currentNeed, setCurrentNeed] = useState('');
  const [contributionSeedType, setContributionSeedType] = useState('QUESTION');
  const [contributionSeedText, setContributionSeedText] = useState('');
  const [specialCategoryConsent, setSpecialCategoryConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCauseSignal = mainCauses.length > 0 || rdgMain.length > 0;
  const validationState = {
    roles: baseArchetypes.length < 1,
    offers: skills.length < 2,
    needs: learningNeeds.length < 2,
    cause: !hasCauseSignal,
    seed: contributionSeedText.trim().length < 10,
    consent: !specialCategoryConsent,
  };
  const canSubmit = !Object.values(validationState).some(Boolean);
  const submitRequirementsId = 'matching-activation-submit-requirements';
  const submitRequirements = [
    validationState.roles ? t('common:actionRequirements.chooseRole') : null,
    validationState.offers ? t('common:actionRequirements.chooseSkills', { count: 2 }) : null,
    validationState.needs ? t('common:actionRequirements.chooseNeeds', { count: 2 }) : null,
    validationState.cause ? t('common:actionRequirements.chooseCause') : null,
    validationState.seed ? t('common:actionRequirements.enterContributionSeed', { count: 10 }) : null,
    validationState.consent ? t('common:actionRequirements.acceptSensitiveMatching') : null,
  ];

  const contributionSeedTypes = CONTRIBUTION_SEED_TYPE_VALUES.map((type) => ({
    value: type.value,
    label: t(type.labelKey),
  }));

  const customSkills = useMemo(
    () => skills.filter((skill) => !SKILL_KEYS.includes(skill as (typeof SKILL_KEYS)[number])),
    [skills],
  );
  const customNeeds = useMemo(
    () => learningNeeds.filter((need) => !SKILL_KEYS.includes(need as (typeof SKILL_KEYS)[number])),
    [learningNeeds],
  );

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError(t('onboarding.lean.step6.validation'));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    let shouldResetSubmitting = true;

    try {
      const skillsResult = await saveSkillsLearningAction(
        {
          baseArchetypes,
          skills,
          learning: learningNeeds,
          mainCauses,
          interestedCauses: [],
          protectionNeeds: [],
        },
        userId,
      );

      if (!skillsResult.success) {
        setError(skillsResult.error ?? t('onboarding.errors.saveFailed'));
        return;
      }

      const functionalResult = await saveFunctionalContextAction(
        {
          energisingFunctions: [],
          drainingFunctions: [],
          availabilityMode,
          currentOffer: currentOffer.trim() || skills.slice(0, 3).join(', '),
          contributionSeedType: contributionSeedType as 'QUESTION' | 'PERSPECTIVE' | 'SKILL' | 'LOCAL_PATTERN' | 'RESOURCE' | 'OFFER',
          contributionSeedText: contributionSeedText.trim(),
          rdgMain,
          rdgInterested: [],
        },
        userId,
      );

      if (!functionalResult.success) {
        setError(functionalResult.error ?? t('onboarding.errors.saveFailed'));
        return;
      }

      const depthResult = await saveFunctionalDepthAction(
        {
          momentNeeds: learningNeeds,
          currentProjectDescription: currentNeed.trim() || undefined,
        },
        userId,
      );

      if (!depthResult.success) {
        setError(depthResult.error ?? t('onboarding.errors.saveFailed'));
        return;
      }

      const completionResult = await completeMatchingActivationAction(userId, specialCategoryConsent);
      if (!completionResult.success) {
        setError(completionResult.error ?? t('onboarding.errors.saveFailed'));
        return;
      }

      shouldResetSubmitting = false;
      router.push('/dashboard');
      return;
    } catch {
      setError(t('onboarding.errors.generic'));
    } finally {
      if (shouldResetSubmitting) setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          <SparklesIcon className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('onboarding.lean.step6.title')}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('onboarding.lean.step6.subtitle')}
        </p>
      </div>

      <section className={requiredSectionClass(validationState.roles)}>
        <SectionTitle icon={<HandshakeIcon className="h-4 w-4" />} title={t('onboarding.lean.step6.roleTitle')} count={`${baseArchetypes.length}/3`} required invalid={validationState.roles} />
        <div data-testid="matching-role-group" aria-invalid={validationState.roles} className={requiredGroupClass(validationState.roles, 'grid grid-cols-1 gap-2 sm:grid-cols-2')}>
          {BASE_ARCHETYPE_OPTIONS.map((arch) => {
            const selected = baseArchetypes.includes(arch.id);
            return (
              <button
                key={arch.id}
                type="button"
                data-testid={`matching-role-${arch.id}`}
                aria-pressed={selected}
                onClick={() => setBaseArchetypes((prev) => toggleLimited(arch.id, prev, 3))}
                className={`flex min-h-16 items-start gap-2 rounded-lg border p-3 text-left text-xs transition-all ${
                  selected
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-200'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-[10px] font-bold text-emerald-700 dark:bg-gray-900">
                  {arch.icon}
                </span>
                <span>
                  <span className="block font-medium">{t(`onboarding.stage4.archetypes.${arch.id}.name`)}</span>
                  <span className="mt-0.5 block text-[10px] text-gray-500 dark:text-gray-400">
                    {t(`onboarding.stage4.archetypes.${arch.id}.desc`)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={requiredSectionClass(validationState.offers)}>
        <SectionTitle icon={<SparklesIcon className="h-4 w-4" />} title={t('onboarding.lean.step6.offerTitle')} count={`${skills.length}/5`} required invalid={validationState.offers} />
        <SelectableChips selected={skills} customSelected={customSkills} max={5} onToggle={(value) => setSkills((prev) => toggleLimited(value, prev, 5))} onRemoveCustom={(value) => setSkills((prev) => prev.filter((item) => item !== value))} t={t} testPrefix="matching-offer" invalid={validationState.offers} />
        <CustomAdder value={currentOffer} onChange={setCurrentOffer} onAdd={() => { setSkills((prev) => addCustomValue(currentOffer, prev, 5)); setCurrentOffer(''); }} placeholder={t('onboarding.lean.step6.offerPlaceholder')} addLabel={t('onboarding.stage4.addButton')} />
      </section>

      <section className={requiredSectionClass(validationState.needs)}>
        <SectionTitle icon={<MapPinIcon className="h-4 w-4" />} title={t('onboarding.lean.step6.needTitle')} count={`${learningNeeds.length}/5`} required invalid={validationState.needs} />
        <SelectableChips selected={learningNeeds} customSelected={customNeeds} max={5} onToggle={(value) => setLearningNeeds((prev) => toggleLimited(value, prev, 5))} onRemoveCustom={(value) => setLearningNeeds((prev) => prev.filter((item) => item !== value))} t={t} testPrefix="matching-need" invalid={validationState.needs} />
        <CustomAdder value={currentNeed} onChange={setCurrentNeed} onAdd={() => { setLearningNeeds((prev) => addCustomValue(currentNeed, prev, 5)); setCurrentNeed(''); }} placeholder={t('onboarding.lean.step6.needPlaceholder')} addLabel={t('onboarding.stage4.addButton')} />
      </section>

      <section className={requiredSectionClass(validationState.seed)}>
        <SectionTitle icon={<HandshakeIcon className="h-4 w-4" />} title={t('onboarding.lean.step6.seedTitle')} required invalid={validationState.seed} />
        <select
          value={contributionSeedType}
          onChange={(event) => setContributionSeedType(event.target.value)}
          data-testid="matching-contribution-seed-type"
          className={fieldClass(false)}
        >
          {contributionSeedTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
        <textarea
          value={contributionSeedText}
          onChange={(event) => setContributionSeedText(event.target.value)}
          data-testid="matching-contribution-seed-text"
          rows={3}
          maxLength={300}
          placeholder={t('onboarding.lean.step6.seedPlaceholder')}
          aria-invalid={validationState.seed}
          className={fieldClass(validationState.seed)}
        />
        <p className={cn('text-xs', validationState.seed ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400')} data-testid="matching-contribution-seed-progress">
          {Math.min(contributionSeedText.trim().length, 10)}/10
        </p>
      </section>

      <section className={requiredSectionClass(validationState.cause)}>
        <SectionTitle icon={<CircleIcon className="h-4 w-4" />} title={t('onboarding.lean.step6.causeTitle')} required invalid={validationState.cause} />
        {causesList.length > 0 ? (
          <div data-testid="matching-cause-group" aria-invalid={validationState.cause} className={requiredGroupClass(validationState.cause, 'flex flex-wrap gap-2')}>
            {causesList.map((cause) => {
              const selected = mainCauses.includes(cause.id);
              return (
                <button key={cause.id} type="button" data-testid={`matching-cause-${cause.id}`} aria-pressed={selected} onClick={() => setMainCauses((prev) => toggleLimited(cause.id, prev, 3))} className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${selected ? 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200' : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                  {cause.title}
                </button>
              );
            })}
          </div>
        ) : (
          <select data-testid="matching-rdg-domain" value={rdgMain[0] ?? ''} onChange={(event) => setRdgMain(event.target.value ? [event.target.value] : [])} aria-invalid={validationState.cause} className={fieldClass(validationState.cause)}>
            <option value="" disabled>{t('onboarding.lean.step6.rdgPlaceholder')}</option>
            {RDG_OPTIONS.map((rdg) => <option key={rdg.value} value={rdg.value}>{rdg.label}</option>)}
          </select>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-sm text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100">
        <SectionTitle icon={<ShieldCheckIcon className="h-4 w-4" />} title={t('onboarding.lean.step6.informedChoiceTitle')} />
        <p className="leading-6">{t('onboarding.lean.step6.informedChoiceBody')}</p>
        <ul className="space-y-2 leading-6">
          <li className="flex gap-2"><span aria-hidden="true">•</span><span>{t('onboarding.lean.step6.informedChoiceMatching')}</span></li>
          <li className="flex gap-2"><span aria-hidden="true">•</span><span>{t('onboarding.lean.step6.informedChoiceProfile')}</span></li>
          <li className="flex gap-2"><span aria-hidden="true">•</span><span>{t('onboarding.lean.step6.informedChoicePrivacy')}</span></li>
        </ul>
        <Link href="/help" target="_blank" rel="noopener noreferrer" className="inline-flex font-semibold text-emerald-800 underline underline-offset-4 hover:text-emerald-950 dark:text-emerald-200 dark:hover:text-emerald-100">
          {t('onboarding.lean.step6.helpLink')}
        </Link>
      </section>

      <section className="space-y-3 border-t border-gray-100 pt-5 dark:border-gray-800">
        <SectionTitle icon={<ShieldCheckIcon className="h-4 w-4" />} title={t('onboarding.lean.step6.availabilityTitle')} required />
        <div className="grid grid-cols-1 gap-2">
          {AVAILABILITY_MODES.map((mode) => {
            const selected = availabilityMode === mode.id;
            return (
              <button key={mode.id} type="button" data-testid={`matching-availability-${mode.id}`} aria-pressed={selected} onClick={() => setAvailabilityMode(mode.id)} className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${selected ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'}`}>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-white text-[10px] font-bold text-emerald-700 dark:bg-gray-900">{mode.icon}</span>
                <span>
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">{t(`onboarding.stage5.modes.${mode.id}`)}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">{t(`onboarding.stage5.modes.${mode.id}_DESC`)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={requiredSectionClass(validationState.consent)}>
        <label className={cn('flex items-start gap-3 rounded-lg border p-4 text-sm transition-colors', validationState.consent ? 'border-red-300 bg-red-50 text-red-950 dark:border-red-800 dark:bg-red-950/20 dark:text-red-100' : 'border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100')}>
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-amber-400 text-emerald-600 focus:ring-emerald-500"
            checked={specialCategoryConsent}
            onChange={(event) => setSpecialCategoryConsent(event.target.checked)}
            data-testid="matching-special-category-consent"
            aria-invalid={validationState.consent}
          />
          <span>{t('onboarding.lean.step6.specialCategoryConsent')}</span>
        </label>
      </section>

      {error && <div data-testid="matching-activation-error" className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>}

      <ActionRequirements id={submitRequirementsId} requirements={submitRequirements} />
      <Button type="button" onClick={handleSubmit} isLoading={isSubmitting} disabled={!canSubmit} disabledReasonId={submitRequirements.some(Boolean) ? submitRequirementsId : undefined} className="w-full" size="lg">
        {t('onboarding.lean.step6.submitButton')}
        <ArrowRightIcon className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

function SectionTitle({ icon, title, count, required, invalid }: Readonly<{ icon: ReactNode; title: string; count?: string; required?: boolean; invalid?: boolean }>) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className={cn('flex items-center gap-2 text-sm font-semibold uppercase tracking-wide', invalid ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300')}>
        <span className={invalid ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}>{icon}</span>
        {title}
        {required && <span className="text-red-500">*</span>}
      </h3>
      {count && <span className={cn('text-xs font-medium', invalid ? 'text-red-600 dark:text-red-400' : 'text-gray-500')}>{count}</span>}
    </div>
  );
}

function SelectableChips({
  selected,
  customSelected,
  max,
  invalid,
  onToggle,
  onRemoveCustom,
  t,
  testPrefix,
}: Readonly<{
  selected: string[];
  customSelected: string[];
  max: number;
  invalid: boolean;
  onToggle: (value: string) => void;
  onRemoveCustom: (value: string) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
  testPrefix: string;
}>) {
  const limitRequirementsId = `${testPrefix}-limit-requirements`;
  const limitRequirements = [selected.length >= max ? t('common:actionRequirements.removeSelectionBeforeChoosingAnother') : null];

  return (
    <div className="space-y-2">
      <div data-testid={`${testPrefix}-group`} aria-invalid={invalid} className={requiredGroupClass(invalid, 'flex flex-wrap gap-2')}>
        {SKILL_KEYS.map((skill) => {
        const isSelected = selected.includes(skill);
        const disabled = !isSelected && selected.length >= max;
        return (
          <button
            key={skill}
            type="button"
            data-testid={`${testPrefix}-${skill}`}
            aria-pressed={isSelected}
            disabled={disabled}
            aria-describedby={disabled ? limitRequirementsId : undefined}
            onClick={() => onToggle(skill)}
            className={`rounded-full border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              isSelected
                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {t(`onboarding.stage4.skillsList.${skill}`)}
          </button>
        );
      })}
      {customSelected.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onRemoveCustom(value)}
          className="rounded-full border border-emerald-500 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
        >
          {value}
        </button>
      ))}
      </div>
      <ActionRequirements id={limitRequirementsId} requirements={limitRequirements} />
    </div>
  );
}

function CustomAdder({
  value,
  onChange,
  onAdd,
  placeholder,
  addLabel,
}: Readonly<{
  value: string;
  onChange: (value: string) => void;
  onAdd: () => void;
  placeholder: string;
  addLabel: string;
}>) {
  return (
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onAdd();
          }
        }}
        placeholder={placeholder}
      />
      <Button type="button" variant="outline" onClick={onAdd}>
        {addLabel}
      </Button>
    </div>
  );
}
