'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { SearchIcon, MapPinIcon, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CityResult {
  name: string;
  country: string;
  displayName: string;
  lat: number;
  lng: number;
}

export type CityAutocompleteValue = { name: string; country: string; lat: number; lng: number } | null;

interface CityAutocompleteProps {
  value: CityAutocompleteValue;
  onChange: (val: CityAutocompleteValue) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export function CityAutocomplete({
  value,
  onChange,
  placeholder,
  error,
  disabled,
}: Readonly<CityAutocompleteProps>) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<CityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const searchCities = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setOptions([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '10',
        'accept-language': 'en',
        featuretype: 'city',
      });

      const response = await fetch(`${NOMINATIM_URL}?${params}`, {
        headers: {
          'User-Agent': 'Changemappers/1.0 (contact@changemappers.org)',
        },
      });

      if (!response.ok) throw new Error('Geocoding failed');

      const data = await response.json();
        const cities: CityResult[] = data
          .filter((item: { addresstype: string }) =>
            ['city', 'town', 'village', 'municipality'].includes(item.addresstype)
          )
          .map((item: { display_name: string; lat: string; lon: string; name: string; address?: { country?: string } }) => ({
            name: item.name,
            country: item.address?.country || '',
            displayName: item.display_name,
            lat: Number.parseFloat(item.lat),
            lng: Number.parseFloat(item.lon),
          }));

      setOptions(cities);
    } catch (err) {
      console.error('City search failed:', err);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchCities(search);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search, open, searchCities]);

  const handleSelect = (city: CityResult) => {
    onChange({ name: city.name, country: city.country, lat: city.lat, lng: city.lng });
    setOpen(false);
    setSearch('');
  };

  const handleUseTypedLocation = () => {
    const trimmed = search.trim();
    if (trimmed.length < 2) return;

    onChange({ name: trimmed, country: '', lat: 0, lng: 0 });
    setOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onChange(null);
    setSearch('');
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        {value ? (
          <div className="flex items-center justify-between p-2.5 rounded-lg border bg-white dark:bg-gray-800 text-sm">
          <span className="flex items-center gap-2 text-gray-900 dark:text-white">
            <MapPinIcon className="h-4 w-4 text-emerald-600" />
            {value.country ? `${value.name}, ${value.country}` : value.name}
          </span>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
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
            <span className="text-gray-500 dark:text-gray-400">{placeholder ?? t('cityAutocomplete.placeholder')}</span>
            <SearchIcon className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
          </button>
        )}
      </div>

      {open && !value && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700 relative">
            {loading ? (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            )}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder={t('cityAutocomplete.typeToSearch')}
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-900 border-none rounded focus:ring-1 focus:ring-emerald-500 outline-none"
              autoFocus
            />
          </div>

          <div className="max-h-60 overflow-y-auto p-1">
            {!options || options.length === 0 ? (
              (() => {
                if (loading) return <div className="p-3 text-center text-sm text-gray-500">{t('cityAutocomplete.searching')}</div>;
                if (search.trim().length < 2) return <div className="p-3 text-center text-sm text-gray-500">{t('cityAutocomplete.minChars')}</div>;
                return (
                  <div className="p-1">
                    <button
                      type="button"
                      onClick={handleUseTypedLocation}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-left"
                    >
                      <MapPinIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-medium">{t('cityAutocomplete.useTypedLocation', { query: search.trim() })}</span>
                        <span className="text-xs text-gray-500">{t('cityAutocomplete.useTypedHint')}</span>
                      </div>
                    </button>
                  </div>
                );
              })()
            ) : (
              options.map((city, idx) => (
                <button
                  key={`${city.name}-${idx}`}
                  type="button"
                  onClick={() => handleSelect(city)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-left"
                >
                  <MapPinIcon className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium">{city.name}</span>
                    <span className="text-xs text-gray-500 line-clamp-1">{city.displayName}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
