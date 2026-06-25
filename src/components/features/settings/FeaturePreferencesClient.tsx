'use client';

import { useState, useTransition } from 'react';
import { saveFeaturePreferencesAction, resetFeaturePreferencesAction } from '@/app/actions/feature-preferences';

export interface FeatureItem { id: string; label: string }
export interface FeatureGroup { key: string; label: string; features: FeatureItem[] }

interface Props {
  groups: FeatureGroup[];
  initialPrefs: Record<string, boolean> | null;
  levelDefault: string[];
  labels: { save: string; saving: string; reset: string; saved: string };
}

function Toggle({ checked, onChange }: Readonly<{ checked: boolean; onChange: (v: boolean) => void }>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${checked ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
    </button>
  );
}

function GroupSection({ group, prefs, onChange }: Readonly<{
  group: FeatureGroup;
  prefs: Record<string, boolean>;
  onChange: (id: string, v: boolean) => void;
}>) {
  return (
    <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {group.label}
      </h3>
      <ul className="space-y-3">
        {group.features.map(f => (
          <li key={f.id} className="flex items-center justify-between gap-4">
            <span className="text-sm text-gray-700 dark:text-gray-300">{f.label}</span>
            <Toggle checked={prefs[f.id] ?? false} onChange={(v) => onChange(f.id, v)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FeaturePreferencesClient({ groups, initialPrefs, levelDefault, labels }: Readonly<Props>) {
  const defaultSet = new Set(levelDefault);
  const resolveInitial = () => {
    const all: Record<string, boolean> = {};
    for (const g of groups) for (const f of g.features) {
      all[f.id] = initialPrefs ? (initialPrefs[f.id] ?? defaultSet.has(f.id)) : defaultSet.has(f.id);
    }
    return all;
  };
  const [prefs, setPrefs] = useState<Record<string, boolean>>(resolveInitial);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleChange(id: string, value: boolean) {
    setSaved(false);
    setPrefs(prev => ({ ...prev, [id]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      await saveFeaturePreferencesAction(prefs);
      setSaved(true);
    });
  }

  function handleReset() {
    startTransition(async () => {
      await resetFeaturePreferencesAction();
      const reset: Record<string, boolean> = {};
      for (const g of groups) for (const f of g.features) reset[f.id] = defaultSet.has(f.id);
      setPrefs(reset);
      setSaved(false);
    });
  }

  return (
    <div className="space-y-0">
      {groups.map(g => (
        <GroupSection key={g.key} group={g} prefs={prefs} onChange={handleChange} />
      ))}
      <div className="border-t border-gray-200 pt-6 dark:border-gray-700 flex flex-wrap gap-3 items-center">
        <button type="button" onClick={handleSave} disabled={isPending}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
          {isPending ? labels.saving : labels.save}
        </button>
        <button type="button" onClick={handleReset} disabled={isPending}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
          {labels.reset}
        </button>
        {saved && <p className="text-sm text-emerald-600 dark:text-emerald-400">{labels.saved}</p>}
      </div>
    </div>
  );
}
