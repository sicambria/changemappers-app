'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Star, Shield, Sprout, BookOpen, Lock, AlertCircle, CheckCircle2, Plus, X, ChevronDown } from 'lucide-react';
import { saveCompassClarity } from '@/app/actions/compass';
import type { CompassProfileData } from './types';

interface Props {
  compassProfile: CompassProfileData;
  onClaritySaved?: () => void;
}

export function CompassClarityClient({ compassProfile, onClaritySaved }: Readonly<Props>) {
  const { t } = useTranslation('growth');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Pillar I state — seed with existing data
  const [northStar, setNorthStar] = useState(compassProfile.northStar ?? '');
  const [originQuestion, setOriginQuestion] = useState(compassProfile.originQuestion ?? '');
  const [nonNegotiables, setNonNegotiables] = useState<string[]>(
    compassProfile.nonNegotiables.length > 0 ? compassProfile.nonNegotiables : ['']
  );

  const hasLockedClarity = compassProfile.unlockedPillars.includes('PILLAR_II');

  const addNonNegotiable = () => {
    if (nonNegotiables.length < 5) setNonNegotiables([...nonNegotiables, '']);
  };
  const updateNonNegotiable = (index: number, value: string) => {
    const updated = [...nonNegotiables];
    updated[index] = value;
    setNonNegotiables(updated);
  };
  const removeNonNegotiable = (index: number) => {
    if (nonNegotiables.length <= 1) return;
    setNonNegotiables(nonNegotiables.filter((_, i) => i !== index));
  };

  const filledNonNegotiables = nonNegotiables.filter(n => n.trim().length > 0);
  const canSave = northStar.trim().length > 0 && filledNonNegotiables.length >= 1;

  const handleSave = () => {
    if (!canSave) return;
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveCompassClarity({
          northStar: northStar.trim(),
          nonNegotiables: filledNonNegotiables,
          originQuestion: originQuestion.trim() || undefined,
        });
        setSaved(true);
        onClaritySaved?.();
        router.refresh();
      } catch {
        setError(t('compass.clarity.error'));
      }
    });
  };

  return (
    <div
      className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
      data-testid="compass-clarity-form"
      data-hydrated={hydrated ? 'true' : 'false'}
    >

      {/* Pillar Header */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-600 rounded-xl shadow-md">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1">
        {t('compass.clarity.pillarLabel')}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('compass.clarity.title')}</h2>
      <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
        {t('compass.clarity.description')}
            </p>
          </div>
        </div>
      </div>

      {/* North Star — Required */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
            <Star className="w-5 h-5 text-amber-500" />
          </div>
          <div>
        <h3 className="font-bold text-gray-900 dark:text-white">
          {t('compass.clarity.northStarDraft')}
          <span className="ml-2 text-xs font-medium text-red-500">{t('compass.clarity.required')}</span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('compass.clarity.northStarPrompt')}
            </p>
          </div>
        </div>
        <textarea
          id="compass-north-star"
          value={northStar}
          onChange={(e) => setNorthStar(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder={t('compass.clarity.northStarPlaceholder')}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
        />
        <div className="mt-1 text-right text-xs text-gray-400 dark:text-gray-500">
          {northStar.length} / 1000
        </div>
      </div>

      {/* Non-Negotiables — Required (min 1) */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg">
            <Shield className="w-5 h-5 text-red-500" />
          </div>
          <div>
        <h3 className="font-bold text-gray-900 dark:text-white">
          {t('compass.clarity.valuesNonNegotiables')}
          <span className="ml-2 text-xs font-medium text-red-500">{t('compass.clarity.requiredMin1')}</span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('compass.clarity.valuesPrompt')}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {nonNegotiables.map((item, index) => (
            // NOSONAR(S6479): nonNegotiables is a persisted string[] with a removeNonNegotiable path, so index keys are not ideal here.
            // A stable-id fix requires reshaping the persisted compassProfile.nonNegotiables contract — deferred as a follow-up (see plan).
            <div key={`non-negotiable-slot-${index}` /* NOSONAR */} className="flex items-center gap-2">
              <span className="text-xs font-medium w-5 text-center text-gray-400 shrink-0">{index + 1}</span>
              <input
                id={`compass-non-negotiable-${index}`}
                type="text"
                value={item}
                onChange={(e) => updateNonNegotiable(index, e.target.value)}
                maxLength={200}
                placeholder={t('compass.clarity.nonNegotiablePlaceholder')}
                className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              {nonNegotiables.length > 1 && (
                <button
                  onClick={() => removeNonNegotiable(index)}
                  aria-label={t('compass.clarity.removeNonNegotiable', { num: index + 1 })}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {nonNegotiables.length < 5 && (
          <button
            onClick={addNonNegotiable}
            className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
        <Plus className="w-4 h-4" />
        {t('compass.clarity.addAnother')}
          </button>
        )}
      </div>

      {/* Origin Question — Optional */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
            <Sprout className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
        <h3 className="font-bold text-gray-900 dark:text-white">
          {t('compass.clarity.originQuestion')}
          <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">({t('compass.clarity.optional')})</span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('compass.clarity.originPrompt')}
            </p>
          </div>
        </div>
        <textarea
          id="compass-origin-question"
          value={originQuestion}
          onChange={(e) => setOriginQuestion(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder={t('compass.clarity.originPlaceholder')}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
        />
        <div className="mt-1 text-right text-xs text-gray-400 dark:text-gray-500">
          {originQuestion.length} / 500
        </div>
      </div>

      {/* Biographical Inventory — Optional, collapsible */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setBioOpen(o => !o)}
          className="w-full flex items-center justify-between p-6 text-left"
          aria-expanded={bioOpen}
          id="compass-bio-toggle"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 dark:bg-violet-900/30 rounded-lg">
              <BookOpen className="w-5 h-5 text-violet-500" />
            </div>
            <div>
        <h3 className="font-bold text-gray-900 dark:text-white">
          {t('compass.clarity.bioInventory')}
          <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">({t('compass.clarity.optional')})</span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('compass.clarity.bioDescription')}
              </p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${bioOpen ? 'rotate-180' : ''}`} />
        </button>
        {bioOpen && (
          <div className="px-6 pb-6 space-y-4 border-t border-gray-100 dark:border-gray-800 pt-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
          {t('compass.clarity.bioChoosePrompts')}
            </p>
            {[
    { id: 'comma-bio-turning', label: t('compass.clarity.bioPrompts.turning') },
    { id: 'compass-bio-proud', label: t('compass.clarity.bioPrompts.proud') },
    { id: 'compass-bio-failures', label: t('compass.clarity.bioPrompts.failures') },
    { id: 'compass-bio-shapers', label: t('compass.clarity.bioPrompts.shapers') },
    { id: 'compass-bio-themes', label: t('compass.clarity.bioPrompts.themes') },
            ].map(({ id, label }) => (
              <div key={id}>
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                <textarea
                  id={id}
                  rows={2}
                  maxLength={800}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
                />
              </div>
            ))}
            <p className="text-xs text-gray-400 dark:text-gray-500 italic border-l-2 border-violet-300 pl-3">
              {t('compass.clarity.bioThreadPrompt')}
            </p>
          </div>
        )}
      </div>

      {/* Locked Pillar II preview, only shown before clarity is locked */}
      {!hasLockedClarity && (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-6 flex items-center gap-4 opacity-60">
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <Lock className="w-5 h-5 text-gray-400" />
          </div>
          <div>
      <div className="font-semibold text-gray-700 dark:text-gray-300">{t('compass.clarity.lockedPillarsTitle')}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {t('compass.clarity.lockedPillarsHint')}
            </div>
          </div>
        </div>
      )}

      {/* Feedback */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {hasLockedClarity ? t('compass.clarity.updated') : t('compass.clarity.savedUnlock')}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-gray-400 dark:text-gray-500">
      {canSave
        ? t('compass.clarity.readyToSave')
        : t('compass.clarity.addNorthStarAndNonNegotiable')}
        </p>
        <button
          id="compass-clarity-save"
          onClick={handleSave}
          disabled={!canSave || isPending}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            !canSave || isPending
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow active:scale-95'
          }`}
        >
          {(() => {
            if (isPending) return t('compass.clarity.saving');
            if (hasLockedClarity) return t('compass.clarity.updateClarity');
            return t('compass.clarity.saveAndUnlock');
          })()}
          {!isPending && <CheckCircle2 className="w-4 h-4" />}
        </button>
      </div>

    </div>
  );
}
