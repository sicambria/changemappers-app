'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { SearchIcon, CheckIcon, ChevronDownIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listContributableInitiativesAction } from '@/app/actions/weak-signal-links';

export interface InitiativeOption {
  id: string;
  name: string;
}

/**
 * AUDIT-20260613-023: searchable picker for initiatives the current user may
 * contribute to. Modeled on CommunityCombobox but deliberately has no
 * "add new" affordance — you can only link to an existing initiative you are
 * authorized for (the backing action enforces the contributable scope).
 */
export function InitiativeCombobox({
  value,
  onChange,
  placeholder,
  error,
}: Readonly<{
  value: InitiativeOption | null;
  onChange: (val: InitiativeOption | null) => void;
  placeholder?: string;
  error?: string;
}>) {
  const { t } = useTranslation('common');
  const displayPlaceholder = placeholder || t('initiativeCombobox.search');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<InitiativeOption[]>([]);
  const [isPending, startTransition] = useTransition();
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

  useEffect(() => {
    if (!open) return;

    startTransition(async () => {
      try {
        const res = await listContributableInitiativesAction({ query: search, limit: 10 });
        if (res.success && res.data) {
          setOptions(res.data);
        } else {
          setOptions([]);
        }
      } catch (err) {
        console.error('Initiative combobox search failed:', err);
        setOptions([]);
      }
    });
  }, [search, open]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between p-2.5 rounded-lg border bg-white dark:bg-gray-800 text-sm ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
          } ${open ? 'ring-2 ring-emerald-500 border-transparent' : ''}`}
      >
        <span className={value ? 'text-gray-900 dark:text-white line-clamp-1 text-left' : 'text-gray-500 dark:text-gray-400 line-clamp-1 text-left'}>
          {value ? value.name : displayPlaceholder}
        </span>
        <ChevronDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700 relative">
            {isPending ? (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            )}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder={t('initiativeCombobox.searchByName')}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border-none rounded focus:ring-1 focus:ring-emerald-500 outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto p-1">
            {options.length === 0 && !isPending ? (
              <div className="p-3 text-center text-sm text-gray-500">{t('initiativeCombobox.noResults')}</div>
            ) : (
              options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${value?.id === opt.id
                    ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                >
                  <span className="line-clamp-1 text-left">{opt.name}</span>
                  {value?.id === opt.id && <CheckIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
