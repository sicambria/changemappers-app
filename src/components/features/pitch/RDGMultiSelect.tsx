'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, SearchIcon, ChevronDownIcon } from 'lucide-react';

interface RDGOption {
  id: string;
  key: string;
  label: string;
  labelHu: string | null;
  category: string;
}

interface RDGMultiSelectProps {
  options: RDGOption[];
  value: string[];
  onChange: (keys: string[]) => void;
  max?: number;
  language?: 'hu' | 'en' | 'es';
  error?: string;
  disabled?: boolean;
}

export default function RDGMultiSelect({
  options,
  value,
  onChange,
  max = 5,
  language = 'hu',
  error,
  disabled,
}: Readonly<RDGMultiSelectProps>) {
  const { t, i18n } = useTranslation('pitch');
  const effectiveLang = language || i18n.language;
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

  const filteredOptions = options.filter((opt) => {
    const searchText = search.toLowerCase();
    const optLabel = effectiveLang === 'hu' && opt.labelHu ? opt.labelHu : opt.label;
    return (
      optLabel.toLowerCase().includes(searchText) ||
      opt.key.toLowerCase().includes(searchText) ||
      opt.category.toLowerCase().includes(searchText)
    );
  });

  const groupedOptions = filteredOptions.reduce(
    (acc, opt) => {
      if (!acc[opt.category]) acc[opt.category] = [];
      acc[opt.category].push(opt);
      return acc;
    },
    {} as Record<string, RDGOption[]>,
  );

  const getLabel = (opt: RDGOption) =>
    effectiveLang === 'hu' && opt.labelHu ? opt.labelHu : opt.label;

  const handleToggle = (key: string) => {
    if (value.includes(key)) {
      onChange(value.filter((k) => k !== key));
    } else if (value.length < max) {
      onChange([...value, key]);
    }
  };

  const selectedOptions = options.filter((opt) => value.includes(opt.key));

  return (
    <div className="relative w-full" ref={containerRef}>
      <div // NOSONAR(S6819) — role="button" trigger with nested button children (button-in-button blocked); a native button wrapper would be invalid button-in-button — role=button + tabIndex + keyboard handlers cover interaction
        role="button"
        tabIndex={0}
        onClick={() => !disabled && setOpen(!open)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        className={`w-full rounded-lg border bg-white p-2.5 text-left text-sm dark:bg-gray-800 ${(() => {
          if (error) return 'border-red-500';
          if (open) return 'ring-2 ring-emerald-500 border-transparent';
          return 'border-gray-300 dark:border-gray-700';
        })()} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      >
        <div className="flex flex-wrap gap-1">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-500 dark:text-gray-400">
              {t('rdg.selectPlaceholder')}
            </span>
          ) : (
            selectedOptions.map((opt) => (
              <span
                key={opt.key}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
              >
                {getLabel(opt)}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(opt.key);
                  }}
                  className="hover:text-emerald-600"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDownIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      {open && (
        <div
          data-testid="rdg-dropdown"
          className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="border-b border-gray-100 p-2 dark:border-gray-700">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={t('rdg.searchPlaceholder')}
                className="w-full rounded-md border-none bg-gray-50 py-1.5 pl-9 pr-3 text-sm focus:ring-1 focus:ring-emerald-500 dark:bg-gray-900"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto p-1">
            {Object.entries(groupedOptions).map(([category, opts]) => (
              <div key={category}>
                <div className="px-3 py-1.5 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                  {t(`category.${category}`, category)}
                </div>
                {opts.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => handleToggle(opt.key)}
                    disabled={!value.includes(opt.key) && value.length >= max}
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${(() => {
                      if (value.includes(opt.key)) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
                      if (value.length >= max) return 'cursor-not-allowed opacity-50';
                      return 'hover:bg-gray-100 dark:hover:bg-gray-700';
                    })()}`}
                  >
                    <span>{getLabel(opt)}</span>
                    {value.includes(opt.key) && <CheckIcon className="h-4 w-4 text-emerald-600" />}
                  </button>
                ))}
              </div>
            ))}

            {filteredOptions.length === 0 && (
              <div className="p-3 text-center text-sm text-gray-500">
                {t('rdg.noResults')}
              </div>
            )}
          </div>

          {max ? (
            <div className="border-t border-gray-100 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {value.length}/{max} {t('rdg.selected')}
            </div>
          ) : null}
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
