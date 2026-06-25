'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';
import { createInitiativeAction } from '@/app/actions/coordinate';
import { DomainGoalSelector } from '@/components/shared/DomainGoalSelector';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { InitiativeTypeCombobox, type InitiativeTypeOption } from '@/components/ui/RDGCombobox';

const RDG_DOMAINS = [
  { id: '1', labelKey: 'domains.1' },
  { id: '2', labelKey: 'domains.2' },
  { id: '3', labelKey: 'domains.3' },
  { id: '4', labelKey: 'domains.4' },
  { id: '5', labelKey: 'domains.5' },
];

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

function DomainCombobox({
  value,
  onChange,
  error,
}: Readonly<{
  value: string | null;
  onChange: (v: string) => void;
  error?: string;
}>) {
  const { t, i18n } = useTranslation('coordinate');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const getLabel = (domainId: string) => {
    return i18n.t(`domains.${domainId}`, { ns: 'coordinate' });
  };

  const selectedDomain = RDG_DOMAINS.find(d => d.id === value);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {t('initiative.rdgDomain')} <span className="text-red-500">*</span>
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between p-2.5 rounded-lg border bg-white text-sm ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${open ? 'ring-2 ring-emerald-500 border-transparent' : ''}`}
      >
        <span className={value ? 'text-gray-900 text-left line-clamp-1' : 'text-gray-500 text-left line-clamp-1'}>
          {selectedDomain ? getLabel(selectedDomain.id) : t('form.selectDomain')}
        </span>
        <ChevronDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto p-1">
            {RDG_DOMAINS.map(domain => (
              <button
                key={domain.id}
                type="button"
                onClick={() => {
                  onChange(domain.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                  value === domain.id
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span>{getLabel(domain.id)}</span>
                {value === domain.id && <CheckIcon className="h-4 w-4 text-emerald-600" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      <p className="mt-1 text-xs text-gray-500">{t('initiative.rdgDomainHint')}</p>
    </div>
  );
}

function extractInitiativeErrorMessage(result: { errors?: Record<string, string[]>; error?: string }, fallback: string): string {
  if (result.errors) {
    const messages = Object.values(result.errors).flat().join(' ');
    return messages || fallback;
  }
  return result.error ?? fallback;
}

// Required textarea with the shared "min 20 chars" touched-state validation UI.
// Extracted module-scope so its three repeated `touched && length < 20` conditionals
// don't count toward InitiativeFormClient's cognitive complexity (S3776).
function ValidatedTextarea({ id, label, value, onChange, onBlur, touched, placeholder, t }: Readonly<{
    id: string; label: string; value: string; onChange: (v: string) => void; onBlur: () => void;
    touched: boolean; placeholder: string; t: (key: string, options?: Record<string, unknown>) => string;
}>) {
    const invalid = touched && value.length < 20;
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                {label} <span className="text-red-500">*</span>
            </label>
            <textarea
                id={id}
                required
                rows={3}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:ring-1 outline-none transition resize-y ${
                    invalid
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-200 focus:border-emerald-500 focus:ring-emerald-500'
                }`}
                placeholder={placeholder}
            />
            <div className="flex justify-between mt-1">
                {invalid ? (
                    <p className="text-xs text-red-500">{t('form.minChars')}</p>
                ) : (
                    <span />
                )}
                <p className={`text-xs ml-auto ${invalid ? 'text-red-400' : 'text-gray-400'}`}>
                    {t('form.minCharsShort', { length: value.length })}
                </p>
            </div>
        </div>
    );
}

export default function InitiativeFormClient({ boardId }: Readonly<{ boardId?: string }>) {
  const { t } = useTranslation(['coordinate', 'common']);
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [why, setWhy] = useState('');
  const [initiativeType, setInitiativeType] = useState<InitiativeTypeOption | null>(null);
  const [domain, setDomain] = useState<string | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setErrors, getFieldError } = useValidationErrors();
  const [descriptionTouched, setDescriptionTouched] = useState(false);
  const [whyTouched, setWhyTouched] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!initiativeType) {
      setError(t('form.errorType'));
      setLoading(false);
      return;
    }

    if (!domain) {
      setError(t('form.errorDomain'));
      setLoading(false);
      return;
    }

    const result = await createInitiativeAction({
      title,
      description,
      why,
      initiativeType: initiativeType.id as 'COMMUNITY_BUILDING' | 'RESEARCH_DEVELOPMENT' | 'ADVOCACY_CAMPAIGN' | 'EDUCATION_TRAINING' | 'SYSTEMS_CHANGE' | 'ECOLOGICAL_RESTORATION' | 'ECONOMIC_INNOVATION' | 'CULTURAL_ARTS' | 'HEALTH_WELLBEING' | 'GOVERNANCE_POLITICS' | 'TECHNOLOGY_INFRASTRUCTURE' | 'OTHER',
      rdgAlignment: selectedGoals.length > 0 ? selectedGoals : [`domain-${domain}`],
      boardId: boardId ?? undefined,
    });

    setLoading(false);

    if (!result.success) {
      setErrors(result);
      setError(extractInitiativeErrorMessage(result, t('form.errorGeneric')));
      return;
    }

    // Navigate directly to the board (or /tasks redirect) — avoids the
    // /tasks server redirect loop that previously triggered a tracking loop.
    router.push(boardId ? `/tasks/${boardId}` : '/tasks');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm"
    >
      {/* Section 1: Basic Info */}
      <section>
        <SectionHeading
          step={1}
          title={t('form.section1Title')}
          subtitle={t('form.section1Subtitle')}
        />
        <div className="space-y-4">
          <div>
            <label htmlFor="initiative-title" className="block text-sm font-medium text-gray-700 mb-1">
              {t('form.titleLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              id="initiative-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              placeholder={t('form.titlePlaceholder')}
            />
          </div>

          <ValidatedTextarea
            id="initiative-description"
            label={t('form.descriptionLabel')}
            value={description}
            onChange={setDescription}
            onBlur={() => setDescriptionTouched(true)}
            touched={descriptionTouched}
            placeholder={t('form.descriptionPlaceholder')}
            t={t}
          />

          <ValidatedTextarea
            id="initiative-why"
            label={t('form.whyLabel')}
            value={why}
            onChange={setWhy}
            onBlur={() => setWhyTouched(true)}
            touched={whyTouched}
            placeholder={t('form.whyPlaceholder')}
            t={t}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('form.typeLabel')} <span className="text-red-500">*</span>
            </label>
            <InitiativeTypeCombobox
              value={initiativeType}
              onChange={setInitiativeType}
              placeholder={t('form.typePlaceholder')}
              error={!initiativeType && error?.includes('initiative type') ? t('common:required') : undefined}
            />
          </div>
        </div>
      </section>

      <hr className="border-gray-100" />

      {/* Section 2: Domain & Goals */}
      <section>
        <SectionHeading
          step={2}
          title={t('form.section2Title')}
          subtitle={t('form.section2Subtitle')}
        />
        <div className="space-y-5">
          <DomainCombobox
            value={domain}
            onChange={(v) => {
              setDomain(v);
              setSelectedGoals([]);
            }}
            error={!domain && error?.includes('domain') ? t('common:required') : undefined}
          />

          {domain && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('initiative.rdgAlignmentOptional')}
              </label>
              <DomainGoalSelector
                selectedGoals={selectedGoals}
                onChange={setSelectedGoals}
                maxGoals={3}
                namespace="volunteer"
              />
              <p className="mt-1 text-xs text-gray-500">{t('initiative.rdgGoalHint')}</p>
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {getFieldError('title') && (
        <p className="text-xs text-red-500">{getFieldError('title')}</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? t('form.creating') : t('form.createCta')}
        </button>
      </div>
    </form>
  );
}
