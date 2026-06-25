'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon, CheckIcon, InfoIcon } from 'lucide-react';
import {
  createVolunteerOpportunityAction,
  publishVolunteerOpportunityAction,
} from '@/app/actions/volunteer';
import type { CreateVolunteerOpportunityInput } from '@/lib/validations/volunteer';
import { DomainGoalSelector } from '@/components/shared/DomainGoalSelector';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import type { CityAutocompleteValue } from '@/components/ui/CityAutocomplete';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { Tooltip } from '@/components/ui/Tooltip';
import { ActionRequirements } from '@/components/ui/ActionRequirements';

// ─── Reusable custom controls ──────────────────────────────────────────────────

function SectionHeading({ step, title, subtitle }: Readonly<{ step: number; title: string; subtitle?: string }>) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 mt-0.5">
        {step}
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

interface ComboBoxProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  label: string;
  hint?: string;
  optional?: boolean;
  optionalLabel?: string;
}

function ComboBox({ id, value, onChange, suggestions, placeholder, required, label, hint, optional, optionalLabel }: Readonly<ComboBoxProps>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selected = suggestions.find(s => s.value === value);
    setQuery(selected ? selected.label : value);
  }, [value, suggestions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? suggestions.filter(s => s.label.toLowerCase().includes(query.toLowerCase()))
    : suggestions;

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setOpen(true);
  };

  const select = (v: string, lbl: string) => {
    setQuery(lbl);
    onChange(v);
    setOpen(false);
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {optional && <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">{optionalLabel}</span>}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{hint}</p>}
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
            className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2.5 pr-9 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
          />
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            tabIndex={-1}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        </div>
        {open && filtered.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-52 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
            {filtered.map(s => (
              <button
                key={s.value}
                type="button"
                onMouseDown={() => select(s.value, s.label)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-emerald-50 dark:hover:bg-emerald-900/20 ${
                  s.value === value ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {s.value === value && <CheckIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />}
                {s.value !== value && <span className="h-3.5 w-3.5 shrink-0" />}
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main form ─────────────────────────────────────────────────────────────────

export function VolunteerCreateClient() {
  const { t } = useTranslation('volunteer');
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const { formError, setErrors, clearErrors, getFieldError, clearFieldError } = useValidationErrors();
  const [cityValue, setCityValue] = useState<CityAutocompleteValue>(null);

  const [form, setForm] = useState<Partial<CreateVolunteerOpportunityInput>>({
    title: '',
    summary: '',
    description: '',
    primaryRdgs: [],
    format: 'HYBRID',
    commitmentType: 'ONE_TIME',
    experienceLevel: 'ANY',
    trainingProvided: false,
    volunteersNeeded: 1,
    physicalEffort: 'LIGHT',
    indoorOutdoor: 'BOTH',
    supervisionLevel: 'DIRECT',
    riskLevel: 'LOW',
    requesterType: 'INDIVIDUAL',
    visibility: 'REGISTERED',
    rollingApplications: false,
    moreInfoUrl: '',
  });

  const updateForm = <K extends keyof CreateVolunteerOpportunityInput>(
    key: K,
    value: CreateVolunteerOpportunityInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    clearFieldError(key as string);
  };

  const handleSaveDraft = async () => {
    if (!form.primaryRdgs || form.primaryRdgs.length < 1) {
      setErrors({ success: false, error: t('errors.rdgRequired') });
      return;
    }
    setSaving(true);
    const result = await createVolunteerOpportunityAction(form as CreateVolunteerOpportunityInput);
    setSaving(false);
    if (result.success) {
      setDraftId(result.data.id);
      clearErrors();
    } else {
      setErrors(result);
    }
  };

  const handlePublish = async () => {
    if (!form.primaryRdgs || form.primaryRdgs.length < 1) {
      setErrors({ success: false, error: t('errors.rdgRequired') });
      return;
    }
    setPublishing(true);
    const createResult = await createVolunteerOpportunityAction(form as CreateVolunteerOpportunityInput);
    if (!createResult.success) {
      setErrors(createResult);
      setPublishing(false);
      return;
    }
    const publishResult = await publishVolunteerOpportunityAction(createResult.data.id);
    setPublishing(false);
    if (publishResult.success) {
      router.push(`/volunteer/${createResult.data.id}`);
    } else {
      setErrors(publishResult);
    }
  };

  const isValid = Boolean(form.title && form.summary && (form.primaryRdgs?.length ?? 0) >= 1);
  const publishRequirementsId = 'volunteer-publish-requirements';
  const publishRequirements = [
    !form.title ? t('common:actionRequirements.enterTitle') : null,
    !form.summary ? t('common:actionRequirements.enterSummary') : null,
    (form.primaryRdgs?.length ?? 0) < 1 ? t('common:actionRequirements.chooseRdg') : null,
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {t('request.create')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t('request.description')}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 sm:p-8">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {formError}
          </div>
        )}

            {/* Section 1: Basic Info */}
            <section>
              <SectionHeading
                step={1}
                title={t('request.basicInfo.title')}
                subtitle={t('request.basicInfo.subtitle')}
              />
        <div className="space-y-5">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('request.basicInfo.titleLabel')} <span className="text-red-500 ml-1">*</span>
            </label>
            <Tooltip content={t('request.tooltips.titleLength')}>
              <InfoIcon className="h-3.5 w-3.5 text-gray-400" />
            </Tooltip>
          </div>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateForm('title', e.target.value)}
            className={`w-full rounded-lg border bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition ${getFieldError('title') ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'}`}
            required
          />
          {getFieldError('title') && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('title')}</p>}
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('request.basicInfo.summaryLabel')} <span className="text-red-500 ml-1">*</span>
            </label>
            <Tooltip content={t('request.tooltips.summaryLength')}>
              <InfoIcon className="h-3.5 w-3.5 text-gray-400" />
            </Tooltip>
          </div>
          <textarea
            value={form.summary}
            onChange={(e) => updateForm('summary', e.target.value)}
            rows={2}
            className={`w-full rounded-lg border bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition resize-none ${getFieldError('summary') ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'}`}
            required
          />
          {getFieldError('summary') && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('summary')}</p>}
        </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('request.basicInfo.descriptionLabel')} <span className="text-gray-400 font-normal ml-1">{t('request.optional')}</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition resize-none"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <ComboBox
                    id="requesterType"
                    label={t('request.basicInfo.requesterTypeLabel')}
                    value={form.requesterType || 'INDIVIDUAL'}
                    onChange={(v) => updateForm('requesterType', v as CreateVolunteerOpportunityInput['requesterType'])}
                    suggestions={[
                      { value: 'INDIVIDUAL', label: t('requesterType.INDIVIDUAL') },
                      { value: 'NGO', label: t('requesterType.NGO') },
                      { value: 'SCHOOL', label: t('requesterType.SCHOOL') },
                      { value: 'COMMUNITY_GROUP', label: t('requesterType.COMMUNITY_GROUP') },
                      { value: 'PUBLIC_INSTITUTION', label: t('requesterType.PUBLIC_INSTITUTION') },
                    ]}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('request.basicInfo.organizationLabel')} <span className="text-gray-400 font-normal ml-1">{t('request.optional')}</span>
                    </label>
                    <input
                      type="text"
                      value={form.organizationName || ''}
                      onChange={(e) => updateForm('organizationName', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                    />
                  </div>
                </div>
                
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('request.time.moreInfoUrlLabel')} <span className="text-gray-400 font-normal ml-1">{t('request.optional')}</span>
            </label>
            <Tooltip content={t('request.tooltips.validUrl')}>
              <InfoIcon className="h-3.5 w-3.5 text-gray-400" />
            </Tooltip>
          </div>
          <input
            type="url"
            value={form.moreInfoUrl || ''}
            onChange={(e) => updateForm('moreInfoUrl', e.target.value)}
            className={`w-full rounded-lg border bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition ${getFieldError('moreInfoUrl') ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'}`}
            placeholder="https://..."
          />
          {getFieldError('moreInfoUrl') && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('moreInfoUrl')}</p>}
        </div>
              </div>
            </section>

            <hr className="border-gray-100 dark:border-gray-800" />

      {/* Section 2: RDGs */}
      <section>
        <SectionHeading
          step={2}
          title={t('request.rdg.title')}
          subtitle={t('request.rdg.required')}
        />
        <DomainGoalSelector
          selectedGoals={form.primaryRdgs || []}
          onChange={(goals) => updateForm('primaryRdgs', goals)}
          maxGoals={3}
          namespace="volunteer"
            error={formError && !form.primaryRdgs?.length ? t('errors.rdgRequired') : undefined}
        />
      </section>

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* Section 3: Logistics */}
            <section>
              <SectionHeading
                step={3}
                title={t('request.location.title')}
                subtitle={t('request.location.subtitle')}
              />
              <div className="grid sm:grid-cols-2 gap-5">
                <ComboBox
                  id="format"
                  label={t('request.location.formatLabel')}
                  value={form.format || 'HYBRID'}
                  onChange={(v) => updateForm('format', v as CreateVolunteerOpportunityInput['format'])}
                  suggestions={[
                    { value: 'ONLINE', label: t('format.ONLINE') },
                    { value: 'OFFLINE', label: t('format.OFFLINE') },
                    { value: 'HYBRID', label: t('format.HYBRID') },
                  ]}
                />

<div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('request.location.locationLabel')}
          </label>
          <CityAutocomplete
            value={cityValue}
            onChange={(val) => {
              setCityValue(val);
              updateForm('location', val?.name || '');
              updateForm('latitude', val?.lat);
              updateForm('longitude', val?.lng);
            }}
            placeholder={t('request.location.searchPlaceholder')}
          />
        </div>
              </div>
            </section>

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* Section 4: Time Commitment */}
            <section>
              <SectionHeading
                step={4}
                title={t('request.time.title')}
                subtitle={t('request.time.subtitle')}
              />
              <div className="grid sm:grid-cols-2 gap-5">
                <ComboBox
                  id="commitmentType"
                  label={t('request.time.commitmentTypeLabel')}
                  value={form.commitmentType || 'ONE_TIME'}
                  onChange={(v) => updateForm('commitmentType', v as CreateVolunteerOpportunityInput['commitmentType'])}
                  suggestions={[
                    { value: 'ONE_TIME', label: t('commitmentType.ONE_TIME') },
                    { value: 'RECURRING', label: t('commitmentType.RECURRING') },
                    { value: 'ONGOING', label: t('commitmentType.ONGOING') },
                  ]}
                />

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('request.requirements.volunteersNeededLabel')}
            </label>
            <Tooltip content={t('request.tooltips.volunteerCount')}>
              <InfoIcon className="h-3.5 w-3.5 text-gray-400" />
            </Tooltip>
          </div>
          <input
            type="number"
            min={1}
            max={1000}
            value={form.volunteersNeeded}
            onChange={(e) => updateForm('volunteersNeeded', Number.parseInt(e.target.value, 10))}
            className={`w-full rounded-lg border bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition ${getFieldError('volunteersNeeded') ? 'border-red-500' : 'border-gray-200 dark:border-gray-800'}`}
          />
          {getFieldError('volunteersNeeded') && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('volunteersNeeded')}</p>}
        </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('request.time.deadlineLabel')} <span className="text-gray-400 font-normal ml-1">{t('request.optional')}</span>
                  </label>
                  <input
                    type="date"
                    value={form.applicationDeadline ? new Date(form.applicationDeadline).toISOString().split('T')[0] : ''}
                    onChange={(e) => updateForm('applicationDeadline', e.target.value ? new Date(e.target.value) : undefined)}
                    disabled={form.rollingApplications}
                    className={`w-full rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition ${
                      form.rollingApplications ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                
                <div className="flex items-center pt-2 sm:pt-7">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.rollingApplications}
                      onChange={(e) => updateForm('rollingApplications', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 transition"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition">
                      {t('request.time.rollingApplicationsLabel')}
                    </span>
                  </label>
                </div>
              </div>
            </section>

            <hr className="border-gray-100 dark:border-gray-800" />

            {/* Section 5: Requirements */}
            <section>
              <SectionHeading
                step={5}
                title={t('request.requirements.title')}
                subtitle={t('request.requirements.subtitle')}
              />
              <div className="grid sm:grid-cols-2 gap-5">
                <ComboBox
                  id="experienceLevel"
                  label={t('request.requirements.experienceLevelLabel')}
                  value={form.experienceLevel || 'ANY'}
                  onChange={(v) => updateForm('experienceLevel', v as CreateVolunteerOpportunityInput['experienceLevel'])}
                  suggestions={[
                    { value: 'ANY', label: t('experienceLevel.ANY') },
                    { value: 'BEGINNER', label: t('experienceLevel.BEGINNER') },
                    { value: 'INTERMEDIATE', label: t('experienceLevel.INTERMEDIATE') },
                    { value: 'ADVANCED', label: t('experienceLevel.ADVANCED') },
                  ]}
                />

                <ComboBox
                  id="physicalEffort"
                  label={t('request.physical.effortLevelLabel')}
                  value={form.physicalEffort || 'LIGHT'}
                  onChange={(v) => updateForm('physicalEffort', v as CreateVolunteerOpportunityInput['physicalEffort'])}
                  suggestions={[
                    { value: 'LIGHT', label: t('physicalEffort.LIGHT') },
                    { value: 'MODERATE', label: t('physicalEffort.MODERATE') },
                    { value: 'HEAVY', label: t('physicalEffort.HEAVY') },
                  ]}
                />
              </div>

              <div className="mt-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.trainingProvided}
                    onChange={(e) => updateForm('trainingProvided', e.target.checked)}
                    className="rounded border-gray-300 h-4 w-4 text-emerald-600 focus:ring-emerald-500 transition"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition">
                    {t('request.requirements.trainingProvidedLabel')}
                  </span>
                </label>
              </div>
            </section>

            {/* Submit */}
            <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex gap-3 w-full sm:w-auto order-2 sm:order-1">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition"
                >
                  {saving ? t('request.actions.saving') : t('request.actions.saveDraft')}
                </button>
                {draftId && (
                  <span className="hidden sm:inline-block text-sm text-gray-500 dark:text-gray-400 max-w-[120px] truncate self-center">
                    {t('request.actions.draftId', { id: draftId })}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handlePublish}
                aria-describedby={!isValid ? publishRequirementsId : undefined}
                disabled={publishing || !isValid}
                className="w-full sm:w-auto order-1 sm:order-2 px-8 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-sm transition"
              >
                {publishing ? t('request.actions.publishing') : t('request.actions.publishRequest')}
              </button>
            </div>
            <ActionRequirements id={publishRequirementsId} requirements={publishRequirements} />
          </form>
        </div>
      </div>
    </div>
  );
}
