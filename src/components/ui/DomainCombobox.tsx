'use client';

import { useState, useRef, useEffect } from 'react';
import { SearchIcon, CheckIcon, ChevronDownIcon, PlusIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface DomainOption {
  id: string;
  name: string;
  category?: string;
  isNew?: boolean;
}

const PREDEFINED_DOMAINS: DomainOption[] = [
  { id: 'permaculture', name: 'Permaculture Design', category: 'skills' },
  { id: 'community', name: 'Community Building', category: 'skills' },
  { id: 'psychology', name: 'Psychological Resilience', category: 'skills' },
  { id: 'facilitation', name: 'Facilitation', category: 'skills' },
  { id: 'regen-ag', name: 'Regenerative Agriculture', category: 'skills' },
  { id: 'systems', name: 'Systems Thinking', category: 'skills' },
  { id: 'ecology', name: 'Ecological Restoration', category: 'skills' },
  { id: 'architecture', name: 'Sustainable Architecture', category: 'skills' },
  { id: 'economics', name: 'Local Economics', category: 'skills' },
  { id: 'climate', name: 'Climate Adaptation', category: 'skills' },
  { id: 'conflict', name: 'Conflict Resolution', category: 'skills' },
  { id: 'leadership', name: 'Collaborative Leadership', category: 'skills' },
  { id: 'communication', name: 'Nonviolent Communication', category: 'skills' },
  { id: 'education', name: 'Transformative Education', category: 'skills' },
  { id: 'wellbeing', name: 'Holistic Wellbeing', category: 'skills' },
  { id: 'rdg-1', name: 'Human Development & Inner Capacity', category: 'rdg' },
  { id: 'rdg-2', name: 'Living Systems Regeneration', category: 'rdg' },
  { id: 'rdg-3', name: 'Regenerative Economy & Infrastructure', category: 'rdg' },
  { id: 'rdg-4', name: 'Governance & Collective Intelligence', category: 'rdg' },
  { id: 'rdg-5', name: 'Long-term Stewardship & Civilizational Resilience', category: 'rdg' },
];

interface DomainComboboxProps {
  value: DomainOption | null;
  onChange: (val: DomainOption | null) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export function DomainCombobox({
  value,
  onChange,
  placeholder,
  error,
  disabled,
}: Readonly<DomainComboboxProps>) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  const filteredOptions = PREDEFINED_DOMAINS.filter((domain) =>
    domain.name.toLowerCase().includes(search.toLowerCase())
  );

  const exactMatch = filteredOptions.some(
    (o) => o.name.toLowerCase() === search.trim().toLowerCase()
  );

  if (search.trim().length > 1 && !exactMatch) {
    filteredOptions.push({
      id: 'NEW',
      name: search.trim(),
      isNew: true,
    });
  }

  const regenerativeSkills = filteredOptions.filter((d) => d.category === 'skills');
  const rdgDomains = filteredOptions.filter((d) => d.category === 'rdg');
  const customOption = filteredOptions.find((d) => d.isNew);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={`w-full flex items-center justify-between p-2.5 rounded-lg border bg-white dark:bg-gray-800 text-sm ${
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
        } ${open ? 'ring-2 ring-emerald-500 border-transparent' : ''} ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <span
          className={
            value
              ? 'text-gray-900 dark:text-white line-clamp-1 text-left'
              : 'text-gray-500 dark:text-gray-400 line-clamp-1 text-left'
          }
        >
          {value ? value.name : (placeholder ?? t('domainCombobox.placeholder'))}
        </span>
        <ChevronDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder={t('domainCombobox.searchPlaceholder')}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border-none rounded focus:ring-1 focus:ring-emerald-500 outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-80 overflow-y-auto p-1">
            {customOption && (
              <button
                type="button"
                key="custom"
                onClick={() => {
                  onChange(customOption);
                  setOpen(false);
                  setSearch('');
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                <span className="flex items-center gap-2">
                  <PlusIcon className="h-3 w-3 text-emerald-600" />
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {t('domainCombobox.addCustom', { name: customOption.name })}
                </span>
                </span>
              </button>
            )}

            {rdgDomains.length > 0 && (
              <div className="px-2 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mt-2 flex items-center gap-1">
                <span>🌍</span>
                <span>{t('domainCombobox.rdgDomains')}</span>
              </div>
            )}
            {rdgDomains.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                  setSearch('');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                  value?.id === opt.id
                    ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>{opt.name}</span>
                {value?.id === opt.id && <CheckIcon className="h-4 w-4 text-amber-600" />}
              </button>
            ))}

            {regenerativeSkills.length > 0 && (
              <div className="px-2 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mt-2 flex items-center gap-1">
                <span>🌱</span>
                <span>{t('domainCombobox.skillsPractices')}</span>
              </div>
            )}
            {regenerativeSkills.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                  setSearch('');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                  value?.id === opt.id
                    ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>{opt.name}</span>
                {value?.id === opt.id && <CheckIcon className="h-4 w-4 text-emerald-600" />}
              </button>
            ))}

            {filteredOptions.length === 0 && !customOption && (
        <div className="p-3 text-center text-sm text-gray-500">
          {t('domainCombobox.noResults')}
        </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
