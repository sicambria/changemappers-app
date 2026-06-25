'use client';

import { useState, useRef, useCallback } from 'react';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { SearchIcon, CheckIcon, ChevronDownIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface RDGOption {
  id: string;
  name: string;
  code: string;
}

export const RDG_OPTIONS: RDGOption[] = [
  { id: 'RDG1', name: 'Human Development & Inner Capacity', code: 'RDG1' },
  { id: 'RDG2', name: 'Living Systems Regeneration', code: 'RDG2' },
  { id: 'RDG3', name: 'Regenerative Economy & Infrastructure', code: 'RDG3' },
  { id: 'RDG4', name: 'Governance & Collective Intelligence', code: 'RDG4' },
  { id: 'RDG5', name: 'Long-term Stewardship & Civilizational Resilience', code: 'RDG5' },
  { id: 'OTHER', name: 'Other (I don\'t know yet)', code: 'OTHER' },
];

interface RDGComboboxProps {
  value: RDGOption | null;
  onChange: (val: RDGOption | null) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export function RDGCombobox({
  value,
  onChange,
  placeholder,
  error,
  disabled,
}: Readonly<RDGComboboxProps>) {
  const { t } = useTranslation('coordinate');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setOpen(false), []);
  useOnClickOutside(containerRef, closeDropdown);

  const filteredOptions = RDG_OPTIONS.filter((rdg) =>
    rdg.name.toLowerCase().includes(search.toLowerCase()) ||
    rdg.code.toLowerCase().includes(search.toLowerCase())
  );

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
          {value ? `${value.code}: ${value.name}` : (placeholder || t('form.rdgPlaceholder'))}
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
              placeholder={t('form.rdgSearchPlaceholder')}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border-none rounded focus:ring-1 focus:ring-emerald-500 outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-80 overflow-y-auto p-1">
            {filteredOptions.map((opt) => (
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
                <span>
                  <span className="font-medium">{opt.code}</span>: {opt.name}
                </span>
                {value?.id === opt.id && <CheckIcon className="h-4 w-4 text-emerald-600" />}
              </button>
            ))}

            {filteredOptions.length === 0 && (
            <div className="p-3 text-center text-sm text-gray-500">
                {t('form.rdgNoResults')}
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

export interface InitiativeTypeOption {
  id: string;
  name: string;
}

export const INITIATIVE_TYPE_OPTIONS: InitiativeTypeOption[] = [
  { id: 'COMMUNITY_BUILDING', name: 'Community Building' },
  { id: 'RESEARCH_DEVELOPMENT', name: 'Research & Development' },
  { id: 'ADVOCACY_CAMPAIGN', name: 'Advocacy Campaign' },
  { id: 'EDUCATION_TRAINING', name: 'Education & Training' },
  { id: 'SYSTEMS_CHANGE', name: 'Systems Change' },
  { id: 'ECOLOGICAL_RESTORATION', name: 'Ecological Restoration' },
  { id: 'ECONOMIC_INNOVATION', name: 'Economic Innovation' },
  { id: 'CULTURAL_ARTS', name: 'Cultural & Arts' },
  { id: 'HEALTH_WELLBEING', name: 'Health & Wellbeing' },
  { id: 'GOVERNANCE_POLITICS', name: 'Governance & Politics' },
  { id: 'TECHNOLOGY_INFRASTRUCTURE', name: 'Technology & Infrastructure' },
  { id: 'OTHER', name: 'Other' },
];

interface InitiativeTypeComboboxProps {
  value: InitiativeTypeOption | null;
  onChange: (val: InitiativeTypeOption | null) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export function InitiativeTypeCombobox({
  value,
  onChange,
  placeholder,
  error,
  disabled,
}: Readonly<InitiativeTypeComboboxProps>) {
  const { t } = useTranslation('coordinate');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setOpen(false), []);
  useOnClickOutside(containerRef, closeDropdown);

  const filteredOptions = INITIATIVE_TYPE_OPTIONS.filter((type) =>
    type.name.toLowerCase().includes(search.toLowerCase()) ||
    type.id.toLowerCase().includes(search.toLowerCase())
  );

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
          {value ? value.name : (placeholder || t('form.typePlaceholder'))}
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
              placeholder={t('form.typeSearchPlaceholder')}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border-none rounded focus:ring-1 focus:ring-emerald-500 outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-80 overflow-y-auto p-1">
            {filteredOptions.map((opt) => (
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

            {filteredOptions.length === 0 && (
            <div className="p-3 text-center text-sm text-gray-500">
                {t('form.typeNoResults')}
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
