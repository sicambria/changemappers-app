'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, ChevronDownIcon } from 'lucide-react';
import { RDG_DOMAINS, RDG_GOALS, getRdgById } from '@/lib/taxonomy';
import type { RdgId } from '@/lib/taxonomy';

interface IdeaRdgPickerProps {
  value: string[];
  onChange: (next: string[]) => void;
  max: number;
}

function RdgOptionRow({ id, title, selected, disabled, onToggle }: Readonly<{
  id: RdgId; title: string; selected: boolean; disabled: boolean; onToggle: () => void;
}>) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-sm transition-colors ${(() => {
        if (selected) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
        if (disabled) return 'cursor-not-allowed opacity-50';
        return 'hover:bg-gray-100 dark:hover:bg-gray-800';
      })()}`}
    >
      <span><span className="font-mono text-xs text-gray-400">{id}</span> {title}</span>
      {selected && <CheckIcon className="h-4 w-4 shrink-0 text-emerald-600" />}
    </button>
  );
}

export function IdeaRdgPicker({ value, onChange, max }: Readonly<IdeaRdgPickerProps>) {
  const { t } = useTranslation('roadmap');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else if (value.length < max) onChange([...value, id]);
  };

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2.5 text-left text-sm"
      >
        <span className={value.length ? '' : 'text-gray-400'}>
          {value.length ? value.join(', ') : t('ideas.rdgPlaceholder')}
        </span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1 shadow-lg">
          {RDG_DOMAINS.map((domain) => (
            <div key={domain.id}>
              <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t(`ideas.rdgDomains.${domain.id}`, domain.name)}
              </div>
              {RDG_GOALS.filter((g) => g.domainId === domain.id).map((goal) => (
                <RdgOptionRow
                  key={goal.id}
                  id={goal.id}
                  title={getRdgById(goal.id)?.officialTitle ?? goal.officialTitle}
                  selected={value.includes(goal.id)}
                  disabled={!value.includes(goal.id) && value.length >= max}
                  onToggle={() => toggle(goal.id)}
                />
              ))}
            </div>
          ))}
          <div className="border-t border-gray-100 dark:border-gray-800 px-3 py-1.5 text-xs text-gray-400">
            {value.length}/{max}
          </div>
        </div>
      )}
    </div>
  );
}
