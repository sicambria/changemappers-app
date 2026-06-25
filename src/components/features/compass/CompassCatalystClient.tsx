'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Beaker, Plus, Trash2, CheckCircle2, AlertCircle, BarChart2, BookOpen } from 'lucide-react';
import { saveCompassCatalyst } from '@/app/actions/compass';
import type { CompassProfileData } from './types';

interface Experiment {
  action: string;
  people: string;
  hypothesis: string;
  impactCheck: string;
  outcome?: string;
}

type DomainStatus = 'building' | 'holding' | 'eroding' | '';

interface DomainBalance {
  relationships: DomainStatus;
  resources: DomainStatus;
  knowledge: DomainStatus;
  influence: DomainStatus;
  wellbeing: DomainStatus;
  integrity: DomainStatus;
}

function parseExperiments(raw: unknown, maxSlots: number): Experiment[] {
  const empty: Experiment = { action: '', people: '', hypothesis: '', impactCheck: '' };
  if (!Array.isArray(raw)) {
    return Array.from({ length: maxSlots }, () => ({ ...empty }));
  }
  const filled = (raw as unknown[]).map(e => {
    if (e && typeof e === 'object' && !Array.isArray(e)) {
      const r = e as Record<string, unknown>;
      return {
        action: typeof r.action === 'string' ? r.action : '',
        people: typeof r.people === 'string' ? r.people : '',
        hypothesis: typeof r.hypothesis === 'string' ? r.hypothesis : '',
        impactCheck: typeof r.impactCheck === 'string' ? r.impactCheck : '',
        outcome: typeof r.outcome === 'string' ? r.outcome : undefined,
      };
    }
    return { ...empty };
  });
  // Pad or trim to maxSlots
  while (filled.length < maxSlots) filled.push({ ...empty });
  return filled.slice(0, maxSlots);
}

function parseDomainBalance(raw: unknown): DomainBalance {
  const def: DomainBalance = { relationships: '', resources: '', knowledge: '', influence: '', wellbeing: '', integrity: '' };
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const r = raw as Record<string, unknown>;
    const valid = (v: unknown): DomainStatus => (['building', 'holding', 'eroding'].includes(v as string) ? v as DomainStatus : '');
    return {
      relationships: valid(r.relationships),
      resources: valid(r.resources),
      knowledge: valid(r.knowledge),
      influence: valid(r.influence),
      wellbeing: valid(r.wellbeing),
      integrity: valid(r.integrity),
    };
  }
  return def;
}

const DOMAIN_KEYS: { key: keyof DomainBalance }[] = [
  { key: 'relationships' },
  { key: 'resources' },
  { key: 'knowledge' },
  { key: 'influence' },
  { key: 'wellbeing' },
  { key: 'integrity' },
];

const STATUS_STYLES: Record<DomainStatus, string> = {
  building: 'bg-emerald-600 text-white border-emerald-600',
  holding: 'bg-amber-500 text-white border-amber-500',
  eroding: 'bg-red-500 text-white border-red-500',
  '': 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-400',
};

interface Props {
  compassProfile: CompassProfileData;
}

export function CompassCatalystClient({ compassProfile }: Readonly<Props>) {
  const { t } = useTranslation('growth');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const maxSlots = compassProfile.confirmedScope ?? 1;
  const [experiments, setExperiments] = useState<Experiment[]>(() =>
    parseExperiments(compassProfile.experiments, maxSlots)
  );
  const [domainBalance, setDomainBalance] = useState<DomainBalance>(() =>
    parseDomainBalance(compassProfile.domainBalance)
  );
  const [storyWhy, setStoryWhy] = useState(compassProfile.storyWhy ?? '');
  const [storyVision, setStoryVision] = useState(compassProfile.storyVision ?? '');
  const [storyShift, setStoryShift] = useState(compassProfile.storyShift ?? '');

  const updateExperiment = (index: number, field: keyof Experiment, value: string) => {
    setExperiments(prev => prev.map((exp, i) => i === index ? { ...exp, [field]: value } : exp));
  };

  const clearExperiment = (index: number) => {
    setExperiments(prev => prev.map((exp, i) => i === index ? { action: '', people: '', hypothesis: '', impactCheck: '' } : exp));
  };

  const setDomain = (key: keyof DomainBalance, status: DomainStatus) => {
    setDomainBalance(prev => ({ ...prev, [key]: prev[key] === status ? '' : status }));
  };

  const integrityEroding = domainBalance.integrity === 'eroding';

  const canSave = experiments.some(e => e.action.trim() && e.people.trim() && e.hypothesis.trim() && e.impactCheck.trim());

  const handleSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveCompassCatalyst({
          experiments: experiments.filter(e => e.action.trim() || e.hypothesis.trim()),
          domainBalance,
          storyWhy: storyWhy.trim() || undefined,
          storyVision: storyVision.trim() || undefined,
          storyShift: storyShift.trim() || undefined,
        });
        setSaved(true);
        router.refresh();
      } catch {
        setError(t('compass.catalyst.error'));
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Pillar Header */}
      <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/40 rounded-2xl border border-violet-100 dark:border-violet-900/50 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-violet-600 rounded-xl shadow-md">
            <Beaker className="w-6 h-6 text-white" />
          </div>
          <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-violet-500 dark:text-violet-400 mb-1">{t('compass.catalyst.pillarLabel')}</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('compass.catalyst.title')}</h2>
      <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
        {t('compass.catalyst.description', { count: maxSlots })}
            </p>
          </div>
        </div>
      </div>

      {/* Experiment Design */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-50 dark:bg-violet-900/30 rounded-lg">
            <Beaker className="w-5 h-5 text-violet-600" />
          </div>
          <div>
        <h3 className="font-bold text-gray-900 dark:text-white">
          {t('compass.catalyst.experimentDesign')}
          <span className="ml-2 text-xs font-medium text-red-500">{t('compass.catalyst.atLeast1Required')}</span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('compass.catalyst.hypothesisPrompt')}
            </p>
          </div>
        </div>

        {experiments.map((exp, index) => (
          <div
            key={`experiment-slot-${index}` /* NOSONAR(S6479) — fixed positional slots; clearExperiment empties a slot in place and slots are never reordered/removed, so the index is the stable slot identity */}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/50 text-xs font-bold text-violet-700 dark:text-violet-300">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('compass.catalyst.experimentNum', { num: index + 1 })}</span>
              </div>
              {(exp.action || exp.hypothesis) && (
                <button
                  onClick={() => clearExperiment(index)}
                  aria-label={t('compass.catalyst.clearExperiment', { num: index + 1 })}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`compass-exp-${index}-action`} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    {t('compass.catalyst.ifIDo')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    id={`compass-exp-${index}-action`}
                    type="text"
                    value={exp.action}
                    onChange={(e) => updateExperiment(index, 'action', e.target.value)}
                    maxLength={200}
                    placeholder={t('compass.catalyst.actionPlaceholder')}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor={`compass-exp-${index}-people`} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    {t('compass.catalyst.with')} <span className="text-red-400">*</span>
                  </label>
                  <input
                    id={`compass-exp-${index}-people`}
                    type="text"
                    value={exp.people}
                    onChange={(e) => updateExperiment(index, 'people', e.target.value)}
                    maxLength={150}
                    placeholder={t('compass.catalyst.peoplePlaceholder')}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                  />
                </div>
              </div>
              <div>
                <label htmlFor={`compass-exp-${index}-hypothesis`} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  {t('compass.catalyst.thenSomethingShifts')} <span className="text-red-400">*</span>
                </label>
                <textarea
                  id={`compass-exp-${index}-hypothesis`}
                  value={exp.hypothesis}
                  onChange={(e) => updateExperiment(index, 'hypothesis', e.target.value)}
                  maxLength={300}
                  rows={2}
                  placeholder={t('compass.catalyst.hypothesisPlaceholder')}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none transition-all"
                />
              </div>
              <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
                <label htmlFor={`compass-exp-${index}-impact`} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  {t('compass.catalyst.impactCheck')} <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5 italic">
                  {t('compass.catalyst.impactCheckHint')}
                </p>
                <textarea
                  id={`compass-exp-${index}-impact`}
                  value={exp.impactCheck}
                  onChange={(e) => updateExperiment(index, 'impactCheck', e.target.value)}
                  maxLength={300}
                  rows={2}
                  placeholder={t('compass.catalyst.impactPlaceholder')}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none transition-all"
                />
              </div>
              {exp.outcome !== undefined && (
                <div className="pt-1 border-t border-gray-100 dark:border-gray-800">
                  <label htmlFor={`compass-exp-${index}-outcome`} className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                    {t('compass.catalyst.whatHappened')}
                  </label>
                  <textarea
                    id={`compass-exp-${index}-outcome`}
                    value={exp.outcome ?? ''}
                    onChange={(e) => updateExperiment(index, 'outcome', e.target.value)}
                    maxLength={500}
                    rows={2}
                    placeholder={t('compass.catalyst.outcomePlaceholder')}
                    className="w-full rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-all"
                  />
                </div>
              )}
              {exp.outcome === undefined && (exp.action || exp.hypothesis) && (
                <button
                  onClick={() => updateExperiment(index, 'outcome', '')}
                  className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors mt-1"
                >
                  <Plus className="w-3 h-3" /> {t('compass.catalyst.recordWhatHappened')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Domain Balance Tracker */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <BarChart2 className="w-5 h-5 text-blue-500" />
          </div>
          <div>
        <h3 className="font-bold text-gray-900 dark:text-white">
          {t('compass.catalyst.domainBalanceTracker')}
          <span className="ml-2 text-xs font-normal text-gray-400">({t('compass.catalyst.optional')})</span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('compass.catalyst.imbalanceInfo')}
            </p>
          </div>
        </div>

        <div className="space-y-3">
    {DOMAIN_KEYS.map(({ key }) => (
    <div key={key} className="flex items-center gap-3">
      <div className="w-28 shrink-0">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t(`compass.catalyst.domains.${key}.label`)}</div>
        <div className="text-xs text-gray-400">{t(`compass.catalyst.domains.${key}.hint`)}</div>
              </div>
              <div className="flex gap-2 flex-1">
                {(['building', 'holding', 'eroding'] as DomainStatus[]).map(status => (
                  <button
                    key={status}
                    id={`compass-domain-${key}-${status}`}
                    aria-pressed={domainBalance[key] === status}
                    onClick={() => setDomain(key, status)}
          className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    domainBalance[key] === status ? STATUS_STYLES[status] : STATUS_STYLES['']
                  }`}
                >
                  {t(`compass.catalyst.statuses.${status}`)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {integrityEroding && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">{t('compass.catalyst.integritySignal')}</p>
            <ul className="space-y-1">
              {compassProfile.nonNegotiables.map((nn) => (
                <li key={nn} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">•</span> {nn}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-red-500 dark:text-red-400 italic">{t('compass.catalyst.integrityPrompt')}</p>
          </div>
        )}
      </div>

      {/* Storytelling */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg">
            <BookOpen className="w-5 h-5 text-rose-500" />
          </div>
          <div>
        <h3 className="font-bold text-gray-900 dark:text-white">
          {t('compass.catalyst.storytelling')}
          <span className="ml-2 text-xs font-normal text-gray-400">({t('compass.catalyst.optionalPrivate')})</span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('compass.catalyst.honestNotPolished')}</p>
          </div>
        </div>
        <div className="space-y-4">
          {[
      { id: 'compass-story-why', label: t('compass.catalyst.story.whyLabel'), value: storyWhy, setter: setStoryWhy, placeholder: t('compass.catalyst.story.whyPlaceholder') },
      { id: 'compass-story-vision', label: t('compass.catalyst.story.visionLabel'), value: storyVision, setter: setStoryVision, placeholder: t('compass.catalyst.story.visionPlaceholder') },
      { id: 'compass-story-shift', label: t('compass.catalyst.story.shiftLabel'), value: storyShift, setter: setStoryShift, placeholder: t('compass.catalyst.story.shiftPlaceholder') },
          ].map(({ id, label, value, setter, placeholder }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</label>
              <textarea
                id={id}
                value={value}
                onChange={(e) => setter(e.target.value)}
                maxLength={600}
                rows={2}
                placeholder={placeholder}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none transition-all"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Feedback & CTA */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />       {t('compass.catalyst.saved')}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {canSave ? t('compass.catalyst.experimentComplete') : t('compass.catalyst.completeOneToSave')}
        </p>
        <button
          id="compass-catalyst-save"
          onClick={handleSave}
          disabled={!canSave || isPending}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            !canSave || isPending
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
              : 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm hover:shadow active:scale-95'
          }`}
        >
          {isPending ? t('compass.catalyst.saving') : t('compass.catalyst.saveExperiments')}
          {!isPending && <CheckCircle2 className="w-4 h-4" />}
        </button>
      </div>

    </div>
  );
}
