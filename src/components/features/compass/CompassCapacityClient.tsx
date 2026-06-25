'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Zap, Clock, DollarSign, Heart, Network, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { saveCompassCapacity } from '@/app/actions/compass';
import type { CompassProfileData } from './types';

interface Props {
  compassProfile: CompassProfileData;
  onScopeConfirmed?: () => void;
}

type SupportNet = { mentor?: string; peer?: string; challenger?: string; believer?: string };

function parseSupportNet(raw: unknown): SupportNet {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const r = raw as Record<string, unknown>;
    return {
      mentor: typeof r.mentor === 'string' ? r.mentor : '',
      peer: typeof r.peer === 'string' ? r.peer : '',
      challenger: typeof r.challenger === 'string' ? r.challenger : '',
      believer: typeof r.believer === 'string' ? r.believer : '',
    };
  }
  return { mentor: '', peer: '', challenger: '', believer: '' };
}

function suggestScope(avg: number, t: (key: string) => string): { label: string; value: number; description: string } {
  if (avg <= 2) return { label: t('compass.capacity.suggestScope.narrow.label'), value: 1, description: t('compass.capacity.suggestScope.narrow.desc') };
  if (avg <= 3.5) return { label: t('compass.capacity.suggestScope.moderate.label'), value: 2, description: t('compass.capacity.suggestScope.moderate.desc') };
  return { label: t('compass.capacity.suggestScope.active.label'), value: 3, description: t('compass.capacity.suggestScope.active.desc') };
}

function ScoreSlider({ id, label, description, value, onChange, t }: Readonly<{
  id: string; label: string; description: string;
  value: number; onChange: (v: number) => void;
  t: (key: string) => string;
}>) {
  const SCORE_LABELS: Record<number, string> = {
    1: t('compass.capacity.scoreLabels.1'),
    2: t('compass.capacity.scoreLabels.2'),
    3: t('compass.capacity.scoreLabels.3'),
    4: t('compass.capacity.scoreLabels.4'),
    5: t('compass.capacity.scoreLabels.5'),
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</label>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{value ? SCORE_LABELS[value] : t('compass.capacity.notSet')}</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 italic">{description}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            id={`${id}-${n}`}
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
              value === n
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-600'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CompassCapacityClient({ compassProfile, onScopeConfirmed }: Readonly<Props>) {
  const { t } = useTranslation('growth');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [scopeStep, setScopeStep] = useState<'assessment' | 'confirm'>(
    compassProfile.timeScore && compassProfile.resourceScore && compassProfile.bandwidthScore ? 'confirm' : 'assessment'
  );

  const [timeScore, setTimeScore] = useState(compassProfile.timeScore ?? 0);
  const [resourceScore, setResourceScore] = useState(compassProfile.resourceScore ?? 0);
  const [bandwidthScore, setBandwidthScore] = useState(compassProfile.bandwidthScore ?? 0);
  const [confirmedScope, setConfirmedScope] = useState<number>(compassProfile.confirmedScope ?? 0);
  const [energyPatterns, setEnergyPatterns] = useState(compassProfile.energyPatterns ?? '');
  const [riskFears, setRiskFears] = useState(compassProfile.riskFears ?? '');
  const [emotionalPattern, setEmotionalPattern] = useState(compassProfile.emotionalPattern ?? '');
  const [supportNet, setSupportNet] = useState<SupportNet>(() => parseSupportNet(compassProfile.supportNetwork));

  const allScoresSet = timeScore > 0 && resourceScore > 0 && bandwidthScore > 0;
  const avg = allScoresSet ? (timeScore + resourceScore + bandwidthScore) / 3 : 0;
  const suggestion = allScoresSet ? suggestScope(avg, t) : null;

  const scopeAlreadyConfirmed = (compassProfile.confirmedScope ?? 0) > 0;

  const handleSaveAssessment = () => {
    if (!allScoresSet) return;
    setScopeStep('confirm');
  };

  const handleConfirmScope = () => {
    if (!confirmedScope) return;
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveCompassCapacity({
          timeScore,
          resourceScore,
          bandwidthScore,
          confirmedScope,
          energyPatterns: energyPatterns.trim() || undefined,
          riskFears: riskFears.trim() || undefined,
          emotionalPattern: emotionalPattern.trim() || undefined,
          supportNetwork: {
            mentor: supportNet.mentor?.trim() || undefined,
            peer: supportNet.peer?.trim() || undefined,
            challenger: supportNet.challenger?.trim() || undefined,
            believer: supportNet.believer?.trim() || undefined,
          },
        });
        setSaved(true);
        router.refresh();
        onScopeConfirmed?.();
      } catch {
        setError(t('compass.capacity.error'));
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Pillar Header */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 rounded-2xl border border-amber-100 dark:border-amber-900/50 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500 rounded-xl shadow-md">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">{t('compass.capacity.pillarLabel')}</div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('compass.capacity.title')}</h2>
      <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
        {t('compass.capacity.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Honest Assessment */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
        <h3 className="font-bold text-gray-900 dark:text-white">
          {t('compass.capacity.honestAssessment')}
          <span className="ml-2 text-xs font-medium text-red-500">{t('compass.capacity.required')}</span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('compass.capacity.rateEach')}</p>
          </div>
        </div>

        <div className="space-y-6">
      <ScoreSlider
        id="compass-time-score"
        label={t('compass.capacity.timeLabel')}
        description={t('compass.capacity.timeDescription')}
        value={timeScore}
        onChange={setTimeScore}
        t={t}
      />
      <ScoreSlider
        id="compass-resource-score"
        label={t('compass.capacity.resourcesLabel')}
        description={t('compass.capacity.resourcesDescription')}
        value={resourceScore}
        onChange={setResourceScore}
        t={t}
      />
      <ScoreSlider
        id="compass-bandwidth-score"
        label={t('compass.capacity.bandwidthLabel')}
        description={t('compass.capacity.bandwidthDescription')}
        value={bandwidthScore}
        onChange={setBandwidthScore}
        t={t}
      />
        </div>

        {allScoresSet && scopeStep === 'assessment' && (
          <div className="mt-6 flex justify-end">
            <button
              id="compass-capacity-next"
              onClick={handleSaveAssessment}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-amber-500 text-white hover:bg-amber-600 shadow-sm active:scale-95 transition-all"
            >
              {t('compass.capacity.seeSuggestedScope')} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Scope Setting — shown after assessment */}
      {(scopeStep === 'confirm' || scopeAlreadyConfirmed) && suggestion && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 animate-in fade-in duration-500">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
              <DollarSign className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
        <h3 className="font-bold text-gray-900 dark:text-white">
          {t('compass.capacity.scopeSetting')}
          <span className="ml-2 text-xs font-medium text-red-500">{t('compass.capacity.required')}</span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('compass.capacity.scopeSuggestionIntro', { avg: avg.toFixed(1) })}
              </p>
            </div>
          </div>

          <div className="mb-4 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
            <div className="font-bold text-indigo-700 dark:text-indigo-300">{suggestion.label}</div>
            <div className="text-sm text-indigo-600 dark:text-indigo-400">{suggestion.description}</div>
          </div>

  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 font-medium">{t('compass.capacity.scopeAdjustPrompt')}</p>

  <div className="grid grid-cols-3 gap-3 mb-4">
    {[
      { value: 1, label: t('compass.capacity.scopeOptions.1.label'), desc: t('compass.capacity.scopeOptions.1.desc') },
      { value: 2, label: t('compass.capacity.scopeOptions.2.label'), desc: t('compass.capacity.scopeOptions.2.desc') },
      { value: 3, label: t('compass.capacity.scopeOptions.3.label'), desc: t('compass.capacity.scopeOptions.3.desc') },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                id={`compass-scope-${value}`}
                onClick={() => setConfirmedScope(value)}
                aria-pressed={confirmedScope === value}
                className={`p-3 rounded-xl border text-sm font-medium text-left transition-all ${
                  confirmedScope === value
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-400'
                }`}
              >
                <div className="font-bold">{label}</div>
                <div className={`text-xs mt-0.5 ${confirmedScope === value ? 'text-indigo-200' : 'text-gray-400'}`}>{desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Optional sections */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
    <h3 className="font-bold text-gray-900 dark:text-white mb-4">
      {t('compass.capacity.optionalDepth')} <span className="text-xs font-normal text-gray-400">({t('compass.capacity.anyOrderPrivate')})</span>
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="compass-energy-patterns" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          {t('compass.capacity.energyPatternLabel')}
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 italic">
          {t('compass.capacity.energyPatternHint')}
            </p>
            <textarea
              id="compass-energy-patterns"
              value={energyPatterns}
              onChange={(e) => setEnergyPatterns(e.target.value)}
              maxLength={600}
              rows={2}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none transition-all"
            />
          </div>
          <div>
        <label htmlFor="compass-risk-fears" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          {t('compass.capacity.riskFearsLabel')}
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 italic">
          {t('compass.capacity.riskFearsHint')}
            </p>
            <textarea
              id="compass-risk-fears"
              value={riskFears}
              onChange={(e) => setRiskFears(e.target.value)}
              maxLength={600}
              rows={2}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none transition-all"
            />
          </div>
          <div>
        <label htmlFor="compass-emotional-pattern" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
          {t('compass.capacity.emotionalPatternLabel')}
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 italic">
          {t('compass.capacity.emotionalPatternHint')}
            </p>
            <textarea
              id="compass-emotional-pattern"
              value={emotionalPattern}
              onChange={(e) => setEmotionalPattern(e.target.value)}
              maxLength={400}
              rows={2}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Support Network Map */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
            <Network className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
        <h3 className="font-bold text-gray-900 dark:text-white">
          {t('compass.capacity.supportNetworkMap')}
          <span className="ml-2 text-xs font-normal text-gray-400">({t('compass.capacity.optional')})</span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('compass.capacity.emptyFieldsGaps')}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
    { key: 'mentor' as const, id: 'compass-support-mentor', label: t('compass.capacity.supportNet.mentor') },
    { key: 'peer' as const, id: 'compass-support-peer', label: t('compass.capacity.supportNet.peer') },
    { key: 'challenger' as const, id: 'compass-support-challenger', label: t('compass.capacity.supportNet.challenger') },
    { key: 'believer' as const, id: 'compass-support-believer', label: t('compass.capacity.supportNet.believer') },
          ].map(({ key, id, label }) => (
            <div key={key}>
              <label htmlFor={id} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{label}</label>
              <input
                id={id}
                type="text"
                value={supportNet[key] ?? ''}
                onChange={(e) => setSupportNet(prev => ({ ...prev, [key]: e.target.value }))}
                maxLength={100}
                placeholder={t('compass.capacity.supportNetPlaceholder')}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <Heart className="w-3 h-3" />
          {t('compass.capacity.emptyFieldsNote')}
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
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {t('compass.capacity.savedMessage')}
        </div>
      )}

      {(scopeStep === 'confirm' || scopeAlreadyConfirmed) && (
        <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {confirmedScope > 0 ? t('compass.capacity.planningFor', { count: confirmedScope }) : t('compass.capacity.selectScopeAbove')}
          </p>
          <button
            id="compass-capacity-save"
            onClick={handleConfirmScope}
            disabled={confirmedScope === 0 || isPending}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              confirmedScope === 0 || isPending
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                : 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm hover:shadow active:scale-95'
            }`}
          >
            {(() => {
              if (isPending) return t('compass.capacity.saving');
              if (scopeAlreadyConfirmed) return t('compass.capacity.updateCapacity');
              return t('compass.capacity.confirmScopeUnlock');
            })()}
            {!isPending && <CheckCircle2 className="w-4 h-4" />}
          </button>
        </div>
      )}

    </div>
  );
}
