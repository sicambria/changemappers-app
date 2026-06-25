'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Map, Users, ArrowRightLeft, Swords, MessageSquare, AlertCircle, CheckCircle2, Plus, X } from 'lucide-react';
import { saveCompassContext } from '@/app/actions/compass';
import type { CompassProfileData } from './types';

interface Props {
  compassProfile: CompassProfileData;
}

type Ring = 'sharers' | 'gatekeepers' | 'affected';
type EcoMap = { sharers: string[]; gatekeepers: string[]; affected: string[]; gapReflection?: string };
type TransMap = { myFraming: string; alliesFraming: string; powerFraming: string };

function parseEcoMap(raw: unknown): EcoMap {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const r = raw as Record<string, unknown>;
    return {
      sharers: Array.isArray(r.sharers) ? (r.sharers as string[]) : [''],
      gatekeepers: Array.isArray(r.gatekeepers) ? (r.gatekeepers as string[]) : [''],
      affected: Array.isArray(r.affected) ? (r.affected as string[]) : [''],
      gapReflection: typeof r.gapReflection === 'string' ? r.gapReflection : '',
    };
  }
  return { sharers: [''], gatekeepers: [''], affected: [''], gapReflection: '' };
}

function parseTransMap(raw: unknown): TransMap {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const r = raw as Record<string, unknown>;
    return {
      myFraming: typeof r.myFraming === 'string' ? r.myFraming : '',
      alliesFraming: typeof r.alliesFraming === 'string' ? r.alliesFraming : '',
      powerFraming: typeof r.powerFraming === 'string' ? r.powerFraming : '',
    };
  }
  return { myFraming: '', alliesFraming: '', powerFraming: '' };
}

const RING_IDS: { id: Ring }[] = [
  { id: 'sharers' },
  { id: 'gatekeepers' },
  { id: 'affected' },
];

export function CompassContextClient({ compassProfile }: Readonly<Props>) {
  const { t } = useTranslation('growth');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Ecosystem map
  const [ecoMap, setEcoMap] = useState<EcoMap>(() => parseEcoMap(compassProfile.ecosystemMap));

  // Translation map
  const [transMap, setTransMap] = useState<TransMap>(() => parseTransMap(compassProfile.translationMap));

  // Optional reflective fields
  const [conflictStyle, setConflictStyle] = useState(compassProfile.conflictStyleNote ?? '');
  const [commNote, setCommNote] = useState(compassProfile.communicationNote ?? '');

  const updateRing = (ring: Ring, index: number, value: string) => {
    setEcoMap(prev => {
      const updated = [...prev[ring]];
      updated[index] = value;
      return { ...prev, [ring]: updated };
    });
  };

  const addToRing = (ring: Ring) => {
    setEcoMap(prev => {
      if (prev[ring].length >= 8) return prev;
      return { ...prev, [ring]: [...prev[ring], ''] };
    });
  };

  const removeFromRing = (ring: Ring, index: number) => {
    setEcoMap(prev => {
      if (prev[ring].length <= 1) return prev;
      return { ...prev, [ring]: prev[ring].filter((_, i) => i !== index) };
    });
  };

  const handleSave = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await saveCompassContext({
          ecosystemMap: {
            sharers: ecoMap.sharers.filter(s => s.trim()),
            gatekeepers: ecoMap.gatekeepers.filter(s => s.trim()),
            affected: ecoMap.affected.filter(s => s.trim()),
            gapReflection: ecoMap.gapReflection?.trim() || undefined,
          },
          translationMap: {
            myFraming: transMap.myFraming.trim(),
            alliesFraming: transMap.alliesFraming.trim(),
            powerFraming: transMap.powerFraming.trim(),
          },
          conflictStyleNote: conflictStyle.trim() || undefined,
          communicationNote: commNote.trim() || undefined,
        });
        setSaved(true);
        router.refresh();
      } catch {
        setError(t('compass.context.error'));
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Pillar Header */}
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 rounded-2xl border border-teal-100 dark:border-teal-900/50 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-teal-600 rounded-xl shadow-md">
            <Map className="w-6 h-6 text-white" />
          </div>
          <div>
      <div className="text-xs font-semibold uppercase tracking-widest text-teal-500 dark:text-teal-400 mb-1">
        {t('compass.context.pillarLabel')}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('compass.context.title')}</h2>
      <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
        {t('compass.context.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Ecosystem Map */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
            <Users className="w-5 h-5 text-teal-600" />
          </div>
          <div>
        <h3 className="font-bold text-gray-900 dark:text-white">
          {t('compass.context.ecosystemMap')}
          <span className="ml-2 text-xs font-normal text-gray-400">({t('compass.context.optional')})</span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('compass.context.ecosystemHint')}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-4">
    {RING_IDS.map(({ id }) => (
    <div key={id}>
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t(`compass.context.rings.${id}.label`)}</label>
      <div className="space-y-2">
        {ecoMap[id].map((entry, i) => (
          <div key={`eco-${id}-slot-${i}`} className="flex items-center gap-2">
            <input
              id={`compass-eco-${id}-${i}`}
              type="text"
              value={entry}
              onChange={(e) => updateRing(id, i, e.target.value)}
              maxLength={200}
              placeholder={i === 0 ? t(`compass.context.rings.${id}.placeholder`) : t('compass.context.addAnother')}
                      className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                    />
                    {ecoMap[id].length > 1 && (
                      <button
                        onClick={() => removeFromRing(id, i)}
                        aria-label={t('compass.context.removeEntry', { num: i + 1, ring: t(`compass.context.rings.${id}.label`) })}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {ecoMap[id].length < 8 && (
                <button
                  onClick={() => addToRing(id)}
                  className="mt-1.5 flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:text-teal-700 transition-colors"
                >
                  <Plus className="w-3 h-3" /> {t('compass.context.add')}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
          <label htmlFor="compass-eco-gap" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('compass.context.gapPrompt')} <span className="text-xs text-gray-400">({t('compass.context.optionalReflection')})</span>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 italic">
            {t('compass.context.gapHint')}
          </p>
          <textarea
            id="compass-eco-gap"
            value={ecoMap.gapReflection}
            onChange={(e) => setEcoMap(prev => ({ ...prev, gapReflection: e.target.value }))}
            maxLength={500}
            rows={2}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none transition-all"
          />
        </div>
      </div>

      {/* Translation Map */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <ArrowRightLeft className="w-5 h-5 text-blue-500" />
          </div>
          <div>
        <h3 className="font-bold text-gray-900 dark:text-white">
          {t('compass.context.translationMap')}
          <span className="ml-2 text-xs font-normal text-gray-400">({t('compass.context.optional')})</span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('compass.context.translationHint')}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
      { id: 'compass-trans-mine', key: 'myFraming' as const, label: t('compass.context.trans.mine'), placeholder: t('compass.context.trans.minePlaceholder') },
      { id: 'compass-trans-allies', key: 'alliesFraming' as const, label: t('compass.context.trans.allies'), placeholder: t('compass.context.trans.alliesPlaceholder') },
      { id: 'compass-trans-power', key: 'powerFraming' as const, label: t('compass.context.trans.power'), placeholder: t('compass.context.trans.powerPlaceholder') },
          ].map(({ id, key, label, placeholder }) => (
            <div key={id}>
              <label htmlFor={id} className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{label}</label>
              <textarea
                id={id}
                value={transMap[key]}
                onChange={(e) => setTransMap(prev => ({ ...prev, [key]: e.target.value }))}
                maxLength={300}
                rows={3}
                placeholder={placeholder}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Conflict Style */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
            <Swords className="w-5 h-5 text-orange-500" />
          </div>
          <div>
        <h3 className="font-bold text-gray-900 dark:text-white">
          {t('compass.context.conflictStyle')}
          <span className="ml-2 text-xs font-normal text-gray-400">({t('compass.context.optional')})</span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          {t('compass.context.conflictHint')}
            </p>
          </div>
        </div>
        <textarea
          id="compass-conflict-style"
          value={conflictStyle}
          onChange={(e) => setConflictStyle(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder={t('compass.context.conflictPlaceholder')}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none transition-all"
        />
      </div>

      {/* Communication Reflection */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
            <MessageSquare className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">
          {t('compass.context.commReflection')}
          <span className="ml-2 text-xs font-normal text-gray-400">({t('compass.context.optional')})</span>
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          {t('compass.context.commHint')}
        </p>
          </div>
        </div>
        <textarea
          id="compass-communication-note"
          value={commNote}
          onChange={(e) => setCommNote(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder={t('compass.context.commPlaceholder')}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-all"
        />
      </div>

      {/* Feedback & CTA */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {t('compass.context.savedMessage')}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          id="compass-context-save"
          onClick={handleSave}
          disabled={isPending}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
            isPending
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
              : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm hover:shadow active:scale-95'
          }`}
        >
          {isPending ? t('compass.context.saving') : t('compass.context.saveButton')}
          {!isPending && <CheckCircle2 className="w-4 h-4" />}
        </button>
      </div>

    </div>
  );
}
