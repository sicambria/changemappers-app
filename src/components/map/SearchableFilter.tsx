'use client';

import { useState, useRef, useEffect } from 'react';
import { SearchIcon, CheckIcon, ChevronDownIcon, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Z_CLASS } from '@/lib/z-index';

export interface FilterOption {
  value: string;
  label: string;
  labelHu?: string;
  labelEs?: string;
}

interface SearchableFilterProps {
  label: string;
  options: FilterOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  language?: 'en' | 'hu' | 'es';
}

export function SearchableFilter({
  label,
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  language: languageProp,
}: Readonly<SearchableFilterProps>) {
  const { t } = useTranslation('map');
  const { language } = useLanguage();
  const activeLang = languageProp ?? language;
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

  const getLabel = (opt: FilterOption) => {
    if (activeLang === 'hu' && opt.labelHu) return opt.labelHu;
    if (activeLang === 'es' && opt.labelEs) return opt.labelEs;
    return opt.label;
  };

  const filteredOptions = options.filter((opt) => {
    const searchText = search.toLowerCase();
    const label = getLabel(opt).toLowerCase();
    return label.includes(searchText) || opt.value.toLowerCase().includes(searchText);
  });

  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  const handleToggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const handleRemove = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== val));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const toggleOpen = () => {
    setOpen((current) => !current);
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleOpen();
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
      </label>
      <div // NOSONAR(S6819) — role="button" trigger with nested button children (button-in-button blocked); a native button wrapper would be invalid button-in-button — role=button + tabIndex + keyboard handlers cover interaction
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={toggleOpen}
        onKeyDown={handleTriggerKeyDown}
        className={`w-full rounded-lg border bg-white p-2 text-left text-sm dark:bg-gray-800 ${
          open
            ? 'ring-2 ring-emerald-500 border-transparent'
            : 'border-gray-300 dark:border-gray-700'
        }`}
      >
        <div className="flex flex-wrap gap-1 min-h-[20px]">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-500 dark:text-gray-400">{placeholder ?? t('searchableFilter.selectPlaceholder')}</span>
          ) : (
            selectedOptions.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
              >
                {getLabel(opt)}
                <button
                  type="button"
                  onClick={(e) => handleRemove(opt.value, e)}
                  className="hover:text-emerald-600"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDownIcon className="absolute right-3 top-[38px] h-4 w-4 text-gray-400" />
      </div>

      {open && (
        <div className={`absolute ${Z_CLASS.mapDropdown} mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800`}>
          <div className="border-b border-gray-100 p-2 dark:border-gray-700">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={searchPlaceholder ?? t('searchableFilter.searchPlaceholder')}
                className="w-full rounded-md border-none bg-gray-50 py-1.5 pl-9 pr-3 text-sm focus:ring-1 focus:ring-emerald-500 dark:bg-gray-900"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.map((opt) => (
              <button // NOSONAR(S6819) — role="option" inside a custom ARIA listbox (aria-haspopup="listbox"); a native option element only works inside a select/datalist
                key={opt.value}
                type="button"
                onClick={() => handleToggle(opt.value)}
                role="option"
                aria-selected={value.includes(opt.value)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                  value.includes(opt.value)
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>{getLabel(opt)}</span>
                {value.includes(opt.value) && <CheckIcon className="h-4 w-4 text-emerald-600" />}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <div className="p-3 text-center text-sm text-gray-500">{t('searchableFilter.noResults')}</div>
            )}
          </div>

          {selectedOptions.length > 0 && (
            <div className="border-t border-gray-100 px-3 py-2 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XIcon className="h-3 w-3" />
            {t('searchableFilter.clearAll')} ({selectedOptions.length})
          </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
