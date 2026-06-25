'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RadioIcon, PlusIcon, Trash2Icon, CheckIcon, XIcon } from 'lucide-react';
import {
  adminGetRadioStationsAction,
  adminCreateRadioStationAction,
  adminUpdateRadioStationAction,
  adminDeleteRadioStationAction,
} from '@/app/actions/admin/radio-stations';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { ActionRequirements } from '@/components/ui/ActionRequirements';

interface RadioStationData {
  id: string;
  name: string;
  url: string;
  genre: string | null;
  language: string | null;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

export function RadioStationsAdminClient({ initialStations }: Readonly<{ initialStations: RadioStationData[] }>) {
  const { t } = useTranslation('admin');
  const [stations, setStations] = useState<RadioStationData[]>(initialStations);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [genre, setGenre] = useState('');
  const [language, setLanguage] = useState('');
  const { formError, setErrors, clearErrors } = useValidationErrors();

  const refresh = useCallback(async () => {
    const result = await adminGetRadioStationsAction();
    if (result.success && result.data) setStations(result.data);
  }, []);

  const handleCreate = async () => {
    clearErrors();
    const result = await adminCreateRadioStationAction(name, url, genre || undefined, language || undefined);
    if (result.success) {
      setShowForm(false);
      setName('');
      setUrl('');
      setGenre('');
      setLanguage('');
      refresh();
    } else {
      setErrors(result);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await adminUpdateRadioStationAction(id, { isActive });
    setStations((prev) => prev.map((s) => (s.id === id ? { ...s, isActive } : s)));
  };

  const handleDelete = async (id: string) => {
    if (!globalThis.confirm(t('radioStations.deleteConfirm'))) return;
    await adminDeleteRadioStationAction(id);
    setStations((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RadioIcon className="h-5 w-5 text-purple-500" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('radioStations.title')}</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          {t('radioStations.addStation')}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('radioStations.namePlaceholder')}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t('radioStations.urlPlaceholder')}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm"
          />
          <input
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder={t('radioStations.genrePlaceholder')}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm"
          />
          <input
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder={t('radioStations.languagePlaceholder')}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm"
          />
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <ActionRequirements id="station-create-requirements" requirements={[!name.trim() && t('radioStations.requirementName'), !url.trim() && t('radioStations.requirementUrl')]} />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!name.trim() || !url.trim()}
              aria-describedby={(!name.trim() || !url.trim()) ? 'station-create-requirements' : undefined}
              className="rounded-md bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {t('radioStations.create')}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {t('radioStations.cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('radioStations.table.name')}</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('radioStations.table.url')}</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('radioStations.table.genre')}</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('radioStations.table.lang')}</th>
              <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500">{t('radioStations.table.active')}</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('radioStations.table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {stations.map((station) => (
              <tr key={station.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white">
                  {station.name}
                  {station.isDefault && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">{t('radioStations.defaultBadge')}</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                  {station.url}
                </td>
                <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">
                  {station.genre || '—'}
                </td>
                <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">
                  {station.language ? (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 uppercase">
                      {station.language}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <button
                    onClick={() => handleToggleActive(station.id, !station.isActive)}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                      station.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {station.isActive ? <CheckIcon className="h-2.5 w-2.5" /> : <XIcon className="h-2.5 w-2.5" />}
                    {station.isActive ? t('radioStations.active') : t('radioStations.inactive')}
                  </button>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => handleDelete(station.id)}
                    aria-label={t('radioStations.deleteLabel')}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {stations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                  {t('radioStations.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
