'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createContributionOfferAction, editContributionOfferAction } from '@/app/actions/contribute';
import type { CreateContributionOfferInput } from '@/lib/validations/contribute';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { TargetAudienceCombobox } from '@/components/shared/TargetAudienceCombobox';
import { ImpactTypeCombobox } from '@/components/shared/ImpactTypeCombobox';
import { ActionRequirements } from '@/components/ui/ActionRequirements';

// ─── Static options ────────────────────────────────────────────────────────────

const TYPE_OPTIONS: CreateContributionOfferInput['type'][] = [
  'SKILL_OFFERING',
  'ACCOMPANIMENT',
  'KNOWLEDGE_COMMONS',
  'HOLDING_SPACE',
];

const DOMAIN_OPTIONS = [
  { id: '1', labelKey: 'causes.domains.1.title' },
  { id: '2', labelKey: 'causes.domains.2.title' },
  { id: '3', labelKey: 'causes.domains.3.title' },
  { id: '4', labelKey: 'causes.domains.4.title' },
  { id: '5', labelKey: 'causes.domains.5.title' },
];

// ─── Reusable searchable combo-box ─────────────────────────────────────────────

interface ComboBoxProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
  label: string;
  hint?: string;
  optional?: boolean;
}

function ComboBox({ id, value, onChange, suggestions, placeholder, required, label, hint, optional }: Readonly<ComboBoxProps>) {
  const { t } = useTranslation('contribute');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    : suggestions;

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  const select = (s: string) => {
    setQuery(s);
    onChange(s);
    setOpen(false);
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {optional && <span className="text-gray-400 font-normal ml-1">({t('common.optional')})</span>}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-500 mb-2">{hint}</p>}
      <div ref={wrapperRef} className="relative">
        <div className="relative">
          <input
            id={id}
            type="text"
            value={query}
            onChange={handleInput}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            required={required}
            autoComplete="off"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-9 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          />
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            tabIndex={-1}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        </div>
        {open && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {filtered.map(s => (
              <button
                key={s}
                type="button"
                onMouseDown={() => select(s)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-emerald-50 ${
                  s === value ? 'text-emerald-700 font-medium' : 'text-gray-700'
                }`}
              >
                {s === value && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
                {s !== value && <span className="h-3.5 w-3.5 shrink-0" />}
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Type card selector ────────────────────────────────────────────────────────

interface TypeSelectorProps {
  value: CreateContributionOfferInput['type'];
  onChange: (v: CreateContributionOfferInput['type']) => void;
}

function TypeSelector({ value, onChange }: Readonly<TypeSelectorProps>) {
  const { t } = useTranslation('contribute');

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {TYPE_OPTIONS.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`text-left rounded-xl border-2 p-4 transition ${
              selected
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className={`text-sm font-semibold mb-1 ${selected ? 'text-emerald-700' : 'text-gray-800'}`}>
              {t(`form.typeOptions.${option}.label`)}
            </div>
            <div className="text-xs text-gray-500 leading-snug">
              {t(`form.typeOptions.${option}.description`)}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ step, title, subtitle }: Readonly<{ step: number; title: string; subtitle?: string }>) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 mt-0.5">
        {step}
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Domain Combobox (RDG Domains) ─────────────────────────────────────────────

interface DomainComboboxProps {
  value: string;
  onChange: (v: string) => void;
}

function DomainCombobox({ value, onChange }: Readonly<DomainComboboxProps>) {
  const { t, i18n } = useTranslation(['common', 'contribute']);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const getLabel = (opt: typeof DOMAIN_OPTIONS[0]) => {
    return i18n.t(opt.labelKey, { ns: 'common', defaultValue: opt.id });
  };

  const filtered = search.trim()
    ? DOMAIN_OPTIONS.filter(opt => getLabel(opt).toLowerCase().includes(search.toLowerCase()))
    : DOMAIN_OPTIONS;

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setOpen(true);
  };

  const select = (id: string, lbl: string) => {
    setSearch(lbl);
    onChange(id);
    setOpen(false);
  };

  const selectedOption = DOMAIN_OPTIONS.find(opt => opt.id === value);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {t('form.domainLabel', { ns: 'contribute' })}{' '}
        <span className="text-gray-400 font-normal ml-1">({t('common.optional', { ns: 'contribute' })})</span>
      </label>
      <div className="relative">
        <input
          type="text"
          value={selectedOption ? getLabel(selectedOption) : search}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          placeholder={t('form.domainPlaceholder', { ns: 'contribute' })}
          autoComplete="off"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 pr-9 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
        />
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          tabIndex={-1}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <ChevronDownIcon className="h-4 w-4" />
        </button>
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filtered.map(opt => (
            <button
              key={opt.id}
              type="button"
              onMouseDown={() => select(opt.id, getLabel(opt))}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-emerald-50 ${
                opt.id === value ? 'text-emerald-700 font-medium' : 'text-gray-700'
              }`}
            >
              {opt.id === value && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />}
              {opt.id !== value && <span className="h-3.5 w-3.5 shrink-0" />}
              {getLabel(opt)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main form ─────────────────────────────────────────────────────────────────

interface Props {
  isEdit?: boolean;
  id?: string;
  initialData?: Partial<CreateContributionOfferInput>;
}

export default function ContributionOfferFormClient({ isEdit = false, id, initialData = {} }: Readonly<Props>) {
  const { t } = useTranslation('contribute');
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }); // §1B: mirror latest t for effects/callbacks below; no deps array on purpose
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { setErrors, getFieldError } = useValidationErrors();
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  const [type, setType] = useState<CreateContributionOfferInput['type']>(
    initialData.type ?? 'SKILL_OFFERING'
  );
  const [domain, setDomain] = useState(initialData.domain ?? '');
  const [targetAudience, setTargetAudience] = useState<string | null>(initialData.targetAudience ?? null);
  const [impactType, setImpactType] = useState<string | null>(initialData.impactType ?? null);
  const [timeCommitment, setTimeCommitment] = useState(initialData.timeCommitment ?? '');
  const [format, setFormat] = useState(initialData.format ?? '');
  const [availability, setAvailability] = useState(initialData.availability ?? '');
  const [prerequisites, setPrerequisites] = useState(initialData.prerequisites ?? '');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    const input: CreateContributionOfferInput = {
      type,
      domain: domain.trim() || undefined,
      targetAudience: targetAudience as CreateContributionOfferInput['targetAudience'],
      impactType: impactType as CreateContributionOfferInput['impactType'],
      timeCommitment: timeCommitment.trim(),
      format: format.trim(),
      availability: availability.trim(),
      prerequisites: prerequisites.trim() || undefined,
    };

    const result = isEdit && id
      ? await editContributionOfferAction(id, input)
      : await createContributionOfferAction(input);
    setPending(false);

    if (result.success) {
      setSuccess(true);
      router.push('/contribute/connections');
    } else {
      setErrors(result);
      setError(result.error ?? tRef.current('form.genericError'));
    }
  }, [availability, domain, format, id, impactType, isEdit, prerequisites, router, setErrors, targetAudience, timeCommitment, type]);

  if (success) {
    return (
      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-6 text-center">
        <div className="text-2xl mb-2">✓</div>
        <p className="font-semibold text-emerald-800">
          {isEdit ? t('form.successUpdated') : t('form.successCreated')}
        </p>
        <p className="text-sm text-emerald-600 mt-1">{t('form.redirecting')}</p>
      </div>
    );
  }

  const isValid = timeCommitment.trim().length >= 2 && format.trim().length >= 2 && availability.trim().length >= 2;
  const submitRequirementsId = 'contribution-offer-submit-requirements';
  const submitRequirements = [
    timeCommitment.trim().length < 2 ? t('common:actionRequirements.enterTimeCommitment') : null,
    format.trim().length < 2 ? t('common:actionRequirements.enterFormat') : null,
    availability.trim().length < 2 ? t('common:actionRequirements.enterAvailability') : null,
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {getFieldError('type') && (
        <p className="text-xs text-red-500">{getFieldError('type')}</p>
      )}

      {/* Section 1: Type */}
      <section>
        <SectionHeading
          step={1}
          title={t('form.typeQuestion')}
          subtitle={t('form.typeHint')}
        />
        <TypeSelector value={type} onChange={setType} />
      </section>

      <hr className="border-gray-100" />

      {/* Section 2: Domain */}
      <section>
        <SectionHeading
          step={2}
          title={t('form.domainQuestion')}
          subtitle={t('form.domainHint')}
        />
        <DomainCombobox value={domain} onChange={setDomain} />
      </section>

      <hr className="border-gray-100" />

      {/* Section 2.5: Target Audience & Impact Type */}
      <section>
        <SectionHeading
          step={3}
          title={t('form.whoServesQuestion')}
          subtitle={t('form.whoServesHint')}
        />
        <div className="grid sm:grid-cols-2 gap-5">
          <TargetAudienceCombobox
            value={targetAudience}
            onChange={setTargetAudience}
            optional
          />
          <ImpactTypeCombobox
            value={impactType}
            onChange={setImpactType}
            optional
          />
        </div>
      </section>

      <hr className="border-gray-100" />

      {/* Section 3: Logistics */}
      <section>
        <SectionHeading
          step={4}
          title={t('form.logisticsQuestion')}
          subtitle={t('form.logisticsHint')}
        />
        <div className="space-y-5">
          <ComboBox
            id="timeCommitment"
            label={t('offer.timeCommitment')}
            required
            value={timeCommitment}
            onChange={setTimeCommitment}
            suggestions={t('form.timeCommitmentSuggestions', { returnObjects: true }) as string[]}
            placeholder={t('form.timeCommitmentPlaceholder')}
            hint={t('form.timeCommitmentHint')}
          />

          <ComboBox
            id="format"
            label={t('offer.format')}
            required
            value={format}
            onChange={setFormat}
            suggestions={t('form.formatSuggestions', { returnObjects: true }) as string[]}
            placeholder={t('form.formatPlaceholder')}
            hint={t('form.formatHint')}
          />

          <ComboBox
            id="availability"
            label={t('form.availabilityLabel')}
            required
            value={availability}
            onChange={setAvailability}
            suggestions={t('form.availabilitySuggestions', { returnObjects: true }) as string[]}
            placeholder={t('form.availabilityPlaceholder')}
            hint={t('form.availabilityHint')}
          />
        </div>
      </section>

      <hr className="border-gray-100" />

      {/* Section 4: Prerequisites */}
      <section>
        <SectionHeading
          step={5}
          title={t('form.prereqsQuestion')}
          subtitle={t('form.prereqsHint')}
        />
        <div>
          <label htmlFor="prerequisites" className="block text-sm font-medium text-gray-700 mb-1">
            {t('form.prereqsLabel')} <span className="text-gray-400 font-normal">({t('common.optional')})</span>
          </label>
          <textarea
            id="prerequisites"
            rows={3}
            value={prerequisites}
            onChange={e => setPrerequisites(e.target.value)}
            placeholder={t('form.prerequisitesPlaceholder')}
            maxLength={500}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{prerequisites.length}/500</p>
        </div>
      </section>

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          aria-describedby={!isValid ? submitRequirementsId : undefined}
          disabled={pending || !isValid}
          className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {(() => {
            if (pending) return t('form.saving');
            if (isEdit) return t('form.updateOffer');
            return t('form.postOffer');
          })()}
        </button>
        <ActionRequirements id={submitRequirementsId} requirements={submitRequirements} />
      </div>
    </form>
  );
}
