'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { saveAvailabilityUpdate } from '@/app/actions/reflection';
import { Button, Input } from '@/components/ui';
import { ArrowLeftIcon, LockIcon } from 'lucide-react';

export default function AvailabilityPage() {
  const { t } = useTranslation('reflect');

  const AVAILABILITY_MODES: Array<{ id: 'DELIVERING' | 'BETWEEN' | 'BUILDING' | 'REFLECTING' | 'RESTING'; label: string }> = [
    { id: 'DELIVERING', label: t('availability.delivering') },
    { id: 'BETWEEN', label: t('availability.between') },
    { id: 'BUILDING', label: t('availability.building') },
    { id: 'REFLECTING', label: t('availability.reflecting') },
    { id: 'RESTING', label: t('availability.resting') },
  ];

  const ALL_FUNCTIONS = [
    { key: 'vision_setting', labelKey: 'availability.functionLabels.vision_setting' },
    { key: 'facilitation', labelKey: 'availability.functionLabels.facilitation' },
    { key: 'project_management', labelKey: 'availability.functionLabels.project_management' },
    { key: 'writing', labelKey: 'availability.functionLabels.writing' },
    { key: 'research', labelKey: 'availability.functionLabels.research' },
    { key: 'coding', labelKey: 'availability.functionLabels.coding' },
    { key: 'design', labelKey: 'availability.functionLabels.design' },
    { key: 'mentoring', labelKey: 'availability.functionLabels.mentoring' },
    { key: 'fundraising', labelKey: 'availability.functionLabels.fundraising' },
    { key: 'teaching', labelKey: 'availability.functionLabels.teaching' },
    { key: 'network_weaving', labelKey: 'availability.functionLabels.network_weaving' },
    { key: 'strategic_thinking', labelKey: 'availability.functionLabels.strategic_thinking' },
    { key: 'storytelling', labelKey: 'availability.functionLabels.storytelling' },
    { key: 'coordination', labelKey: 'availability.functionLabels.coordination' },
    { key: 'listening', labelKey: 'availability.functionLabels.listening' },
    { key: 'data_analysis', labelKey: 'availability.functionLabels.data_analysis' },
    { key: 'community_hosting', labelKey: 'availability.functionLabels.community_hosting' },
    { key: 'advocacy', labelKey: 'availability.functionLabels.advocacy' },
    { key: 'logistics', labelKey: 'availability.functionLabels.logistics' },
    { key: 'holding_space', labelKey: 'availability.functionLabels.holding_space' },
  ];

  const [mode, setMode] = useState<'DELIVERING' | 'BETWEEN' | 'BUILDING' | 'REFLECTING' | 'RESTING'>('BETWEEN');
  const [active, setActive] = useState<string[]>([]);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [offerSentence, setOfferSentence] = useState('');
  const [privateContext, setPrivateContext] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleActive = (key: string) => {
    setActive(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]);
    setUnavailable(prev => prev.filter(x => x !== key));
  };

  const toggleUnavailable = (key: string) => {
    setUnavailable(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]);
    setActive(prev => prev.filter(x => x !== key));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await saveAvailabilityUpdate({
        activeFunctions: active,
        unavailableFunctions: unavailable,
        availabilityMode: mode,
        updatedOfferSentence: offerSentence || undefined,
        privateContext: privateContext || undefined,
      });
      if (res.success) { globalThis.location.assign('/reflect'); }
      else { setError(res.error ?? t('errors.saveFailed')); }
    } finally { setIsSubmitting(false); }
  };

  return (
    <main className="max-w-xl mx-auto p-6 space-y-7">
      <div className="flex items-center gap-2">
        <Link href="/reflect" className="text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('availability.title')}</h1>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('availability.whereAreYou')}</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY_MODES.map(m => (
            <button key={m.id} type="button" onClick={() => setMode(m.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${mode === m.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 hover:border-gray-300'
            }`}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('availability.markFunctions')}
        </label>
        <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" /> = {t('availability.activeNow')}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" /> = {t('availability.notAvailableNow')}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {ALL_FUNCTIONS.map(f => {
            const isActive = active.includes(f.key);
            const isUnavail = unavailable.includes(f.key);
            return (
              <div key={f.key} className="flex items-center gap-1 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                <span className="text-xs text-gray-700 dark:text-gray-300 flex-1 min-w-0 truncate">{t(f.labelKey)}</span>
                <button type="button" onClick={() => toggleActive(f.key)}
                  className={`w-5 h-5 rounded-full border-2 transition-colors flex-shrink-0 ${isActive ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 hover:border-emerald-400'
                  }`} title={t('availability.activeNow')} />
                <button type="button" onClick={() => toggleUnavailable(f.key)}
                  className={`w-5 h-5 rounded-full border-2 transition-colors flex-shrink-0 ${isUnavail ? 'bg-gray-400 border-gray-400' : 'border-gray-300 hover:border-gray-400'
                  }`} title={t('availability.notAvailableNow')} />
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('availability.updateOffer')} <span className="font-normal text-gray-400">{t('availability.updateOfferHint')}</span>
        </label>
        <Input value={offerSentence} onChange={(e) => setOfferSentence(e.target.value)}
          placeholder={t('availability.offerPlaceholder')} maxLength={200} />
      </div>

      <div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <LockIcon className="h-3 w-3" /> {t('availability.privateContext')}
        </div>
        <textarea value={privateContext} onChange={(e) => setPrivateContext(e.target.value)}
          className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          rows={2} placeholder={t('availability.privateContextPlaceholder')} />
      </div>

      {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

      <Button onClick={handleSubmit} isLoading={isSubmitting} className="w-full">{t('availability.saveUpdate')}</Button>
    </main>
  );
}
