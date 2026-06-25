'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';

/**
 * Generic searchable single-select combobox for a fixed list of options whose
 * labels come from i18n keys. Extracted from the byte-identical
 * `ImpactTypeCombobox` / `TargetAudienceCombobox` (true duplication — see
 * docs/testing/reports/2026-06/2026-06-20-code-duplication-analysis.md). Each
 * domain keeps its own option-data module and exposes a thin wrapper around this
 * component, so the public API (`ImpactTypeCombobox`, `IMPACT_TYPE_OPTIONS`, …)
 * is unchanged; only the shared logic lives here.
 */
export interface LabelKeyOption {
  id: string;
  labelKey: string;
}

interface LabelKeyComboboxProps {
  value: string | null;
  onChange: (value: string) => void;
  options: readonly LabelKeyOption[];
  /** i18n key for the field label, e.g. `offer.impactType`. */
  fieldLabelKey: string;
  /** Default value if the field-label key is missing, e.g. `Impact Type`. */
  fieldLabelDefault: string;
  /** i18n key for the empty-state placeholder, e.g. `form.impactTypePlaceholder`. */
  placeholderKey: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  optional?: boolean;
}

export function LabelKeyCombobox({
  value,
  onChange,
  options,
  fieldLabelKey,
  fieldLabelDefault,
  placeholderKey,
  placeholder,
  error,
  disabled,
  optional,
}: Readonly<LabelKeyComboboxProps>) {
  // Namespace is fixed to 'contribute' (a literal, not a prop) so the i18n
  // static checker can resolve the chrome keys below; both current consumers
  // (Impact/TargetAudience) are contribute-form selects. Generalize only if a
  // non-contribute caller ever appears.
  const { t, i18n } = useTranslation('contribute');
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

  const getLabel = (opt: LabelKeyOption) => {
    return i18n.t(opt.labelKey, { ns: 'contribute', defaultValue: opt.id });
  };

  const filteredOptions = options.filter((opt) =>
    getLabel(opt).toLowerCase().includes(search.toLowerCase()) ||
    opt.id.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {t(fieldLabelKey, fieldLabelDefault)}
        {optional && <span className="text-gray-400 font-normal ml-1">({t('common.optional')})</span>}
      </label>
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
          {selectedOption ? getLabel(selectedOption) : (placeholder ?? t(placeholderKey))}
        </span>
        <ChevronDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder={t('form.searchPlaceholder')}
              className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border-none rounded focus:ring-1 focus:ring-emerald-500 outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                  setSearch('');
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                  value === opt.id
                    ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>{getLabel(opt)}</span>
                {value === opt.id && <CheckIcon className="h-4 w-4 text-emerald-600" />}
              </button>
            ))}

            {filteredOptions.length === 0 && (
              <div className="p-3 text-center text-sm text-gray-500">
                {t('form.noOptionsFound')}
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
