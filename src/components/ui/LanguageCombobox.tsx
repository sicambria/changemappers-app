'use client';

import { useState, useRef, useCallback } from 'react';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';
import { ISO_LANGUAGES, getLanguageName } from '@/lib/languages';
import { SearchIcon, CheckIcon, ChevronDownIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LanguageCombobox({
  value,
  onChange,
  locale = 'hu',
  placeholder,
  error
}: Readonly<{
  value: string;
  onChange: (val: string) => void;
  locale?: string;
  placeholder?: string;
  error?: string;
}>) {
  const { t } = useTranslation('common');
  const displayPlaceholder = placeholder || t('languageCombobox.selectLanguage');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setOpen(false), []);
  useOnClickOutside(containerRef, closeDropdown);

  const languages = ISO_LANGUAGES.map(code => ({
    code,
    name: getLanguageName(code, locale)
  }))
    .filter(lang => lang.name.toLowerCase() !== lang.code.toLowerCase())
    .sort((a, b) => a.name.localeCompare(b.name));

  const filtered = search
    ? languages.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.code.toLowerCase().includes(search.toLowerCase()))
    : languages;

  const selectedName = value ? getLanguageName(value, locale) : '';

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between p-2.5 rounded-lg border bg-white dark:bg-gray-800 text-sm ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
        } ${open ? 'ring-2 ring-emerald-500 border-transparent' : ''}`}
      >
        <span className={value ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
          {value ? selectedName : displayPlaceholder}
        </span>
        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
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
              placeholder={t('languageCombobox.search')}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border-none rounded focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="p-2 text-center text-sm text-gray-500">{t('languageCombobox.noResults')}</div>
            ) : (
              filtered.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    onChange(lang.code);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${value === lang.code
                    ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span>{lang.name}</span>
                  {value === lang.code && <CheckIcon className="h-4 w-4 text-emerald-600" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function MultiLanguageCombobox({
  values,
  onChange,
  locale = 'hu',
  placeholder,
  error
}: Readonly<{
  values: string[];
  onChange: (vals: string[]) => void;
  locale?: string;
  placeholder?: string;
  error?: string;
}>) {
  const { t } = useTranslation('common');
  const displayPlaceholder = placeholder || t('languageCombobox.selectLanguages');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setOpen(false), []);
  useOnClickOutside(containerRef, closeDropdown);

  const languages = ISO_LANGUAGES.map(code => ({
    code,
    name: getLanguageName(code, locale)
  }))
    .filter(lang => lang.name.toLowerCase() !== lang.code.toLowerCase())
    .sort((a, b) => a.name.localeCompare(b.name));

  const filtered = search
    ? languages.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || l.code.toLowerCase().includes(search.toLowerCase()))
    : languages;

  const toggleValue = (code: string) => {
    if (values.includes(code)) {
      onChange(values.filter(v => v !== code));
    } else {
      onChange([...values, code]);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map(code => (
          <button
            key={code}
            type="button"
            onClick={() => toggleValue(code)}
            className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
          >
            {getLanguageName(code, locale)}
            <span className="ml-1 text-emerald-600 hover:text-emerald-900">×</span>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between p-2.5 rounded-lg border bg-white dark:bg-gray-800 text-sm ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
        } ${open ? 'ring-2 ring-emerald-500 border-transparent' : ''}`}
      >
        <span className="text-gray-500 dark:text-gray-400">
          {displayPlaceholder}
        </span>
        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
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
              placeholder={t('languageCombobox.search')}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border-none rounded focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="p-2 text-center text-sm text-gray-500">{t('languageCombobox.noResults')}</div>
            ) : (
              filtered.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleValue(lang.code);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${values.includes(lang.code)
                    ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span>{lang.name}</span>
                  {values.includes(lang.code) && <CheckIcon className="h-4 w-4 text-emerald-600" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
