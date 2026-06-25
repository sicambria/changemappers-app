'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Link2Icon, ChevronDownIcon, ChevronUpIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { createWeakSignalPattern, updateWeakSignalPattern } from '@/app/actions/weak-signal-pattern';
import type { PatternTrajectory } from '@/types/weak-signal';
import { useValidationErrors } from '@/hooks/useValidationErrors';

const TRAJECTORY_OPTIONS: PatternTrajectory[] = ['EMERGING', 'STABILIZING', 'DECLINING'];

const TRAJECTORY_COLORS: Record<PatternTrajectory, string> = {
  EMERGING: 'bg-emerald-100 border-emerald-400 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  STABILIZING: 'bg-teal-100 border-teal-400 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
  DECLINING: 'bg-amber-100 border-amber-400 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
};

const RDG_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1);

export interface PatternFormInitialData {
  name: string;
  description: string;
  trajectory: PatternTrajectory | '';
  hypothesis?: string;
  relatedRdgs: string[];
}

interface PatternFormProps {
  patternId?: string;
  initialData?: PatternFormInitialData;
}

export function PatternForm({ patternId, initialData }: Readonly<PatternFormProps>) {
  const isEdit = Boolean(patternId);
  const { t } = useTranslation('signals');
  const router = useRouter();
  const { formError, setErrors, clearErrors, getFieldError, clearFieldError } = useValidationErrors();
  const [saving, setSaving] = useState(false);
  const [showRdgList, setShowRdgList] = useState(false);
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    description: initialData?.description ?? '',
    trajectory: (initialData?.trajectory ?? 'EMERGING') as PatternTrajectory,
    hypothesis: initialData?.hypothesis ?? '',
    relatedRdgs: initialData?.relatedRdgs ?? [] as string[],
  });

  const toggleRdg = (rdg: string) => {
    setForm((f) => ({
      ...f,
      relatedRdgs: f.relatedRdgs.includes(rdg)
        ? f.relatedRdgs.filter((r) => r !== rdg)
        : [...f.relatedRdgs, rdg],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!form.name.trim() || !form.description.trim()) {
      setErrors({ success: false, error: t('errors.nameAndDescriptionRequired') });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        trajectory: form.trajectory,
        hypothesis: form.hypothesis || undefined,
        relatedRdgs: form.relatedRdgs,
      };

      const result = isEdit && patternId
        ? await updateWeakSignalPattern(patternId, payload)
        : await createWeakSignalPattern(payload);

      if (result.success && result.data) {
        const id = (result.data as { id: string }).id;
        router.push(`/signals/patterns/${id}`);
      } else {
        setErrors(result);
      }
    } catch (err) {
      console.error(isEdit ? 'Error updating pattern:' : 'Error creating pattern:', err);
      setErrors({ success: false, error: isEdit ? t('errors.updatePatternFailed') : t('errors.createPatternFailed') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
          <Link2Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? t('pattern.editPattern') : t('pattern.create')}
          </h1>
        </div>
      </div>

      {formError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('pattern.name')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); clearFieldError('name'); }}
            className={`w-full px-4 py-2.5 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${getFieldError('name') ? 'border-red-500' : 'border-gray-300'}`}
            placeholder={t('pattern.namePlaceholder')}
            maxLength={200}
            required
          />
          {getFieldError('name') && <p className="text-xs text-red-500 mt-1">{getFieldError('name')}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('pattern.description')} <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => { setForm((f) => ({ ...f, description: e.target.value })); clearFieldError('description'); }}
            className={`w-full px-4 py-2.5 border rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${getFieldError('description') ? 'border-red-500' : 'border-gray-300'}`}
            placeholder={t('pattern.descriptionPlaceholder')}
            rows={4}
            maxLength={5000}
            required
          />
          {getFieldError('description') && <p className="text-xs text-red-500 mt-1">{getFieldError('description')}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('pattern.trajectory')}
          </label>
          <div className="flex gap-2 flex-wrap">
            {TRAJECTORY_OPTIONS.map((traj) => (
              <button
                key={traj}
                type="button"
                onClick={() => setForm((f) => ({ ...f, trajectory: traj }))}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border-2 transition ${
                  form.trajectory === traj
                    ? TRAJECTORY_COLORS[traj]
                    : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 hover:border-gray-400'
                }`}
              >
                {t(`trajectory.${traj}`)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('pattern.hypothesis')}
          </label>
          <textarea
            value={form.hypothesis}
            onChange={(e) => setForm((f) => ({ ...f, hypothesis: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            placeholder={t('pattern.hypothesisPlaceholder')}
            rows={3}
            maxLength={2000}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('form.rdgAlignment')}
            </label>
            {form.relatedRdgs.length > 0 && (
              <span className="text-xs text-emerald-600 font-medium">
                {form.relatedRdgs.length} selected
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowRdgList(!showRdgList)}
            className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 font-medium mb-3 hover:underline"
          >
            {showRdgList ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
            {showRdgList ? 'Hide RDG list' : 'Browse RDGs'}
          </button>
          {showRdgList && (
            <div className="mb-3 space-y-1.5 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
              {RDG_OPTIONS.map((rdg) => (
                <label key={rdg} className="flex items-start gap-3 cursor-pointer group py-1 px-2 rounded-lg hover:bg-white dark:hover:bg-gray-700 transition">
                  <input
                    type="checkbox"
                    checked={form.relatedRdgs.includes(String(rdg))}
                    onChange={() => toggleRdg(String(rdg))}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 flex-shrink-0"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">RDG {rdg}</span>
                </label>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {form.relatedRdgs.map((rdg) => (
              <span key={rdg} className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full bg-emerald-100 border border-emerald-500 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                RDG {rdg}
                <button type="button" onClick={() => toggleRdg(rdg)} className="hover:text-red-500">
                  <XIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="primary" type="submit" disabled={saving}>
            {(() => {
              if (saving) return t('form.submitting');
              if (isEdit) return t('form.update');
              return t('pattern.create');
            })()}
          </Button>
          <Button variant="ghost" type="button" onClick={() => router.back()}>
            {t('form.cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
