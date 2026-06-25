'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { RadioIcon, PlusIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import type { CityAutocompleteValue } from '@/components/ui/CityAutocomplete';
import { createWeakSignal, updateWeakSignal } from '@/app/actions/weak-signal';
import type { SignalDomain, SignalScale, SignalConfidence, SignalNovelty, SignalSourceType } from '@/types/weak-signal';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { CommonsLicenseNotice } from '@/components/shared/CommonsLicenseNotice';

export interface SignalFormInitialData {
  title: string;
  description?: string;
  context?: string;
  domain: SignalDomain | '';
  scale: SignalScale | '';
  confidence: SignalConfidence | '';
  novelty: SignalNovelty | '';
  regenerativeRelevance: number;
  sourceType: SignalSourceType | '';
  sourceUrl?: string;
  isLocalizable: boolean;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  tags: string[];
  communityId?: string;
  patternId?: string;
}

const DOMAIN_OPTIONS: SignalDomain[] = [
  'EDUCATION', 'GOVERNANCE', 'FOOD', 'TECHNOLOGY', 'HEALTH',
  'ECONOMY', 'ECOLOGY', 'CULTURE', 'ENERGY', 'HOUSING',
  'TRANSPORT', 'MEDIA', 'JUSTICE', 'FINANCE', 'OTHER',
];

const SCALE_OPTIONS: SignalScale[] = ['INDIVIDUAL', 'COMMUNITY', 'INSTITUTIONAL', 'ECOSYSTEM'];
const CONFIDENCE_OPTIONS: SignalConfidence[] = ['LOW', 'MEDIUM', 'HIGH'];
const NOVELTY_OPTIONS: SignalNovelty[] = ['COMMON', 'UNCOMMON', 'RARE', 'NOVEL'];
const SOURCE_TYPE_OPTIONS: SignalSourceType[] = ['FIRSTHAND', 'SECONDHAND', 'NEWS', 'ACADEMIC', 'SOCIAL_MEDIA', 'OTHER'];

interface SignalFormProps {
  signalId?: string;
  initialData?: SignalFormInitialData;
}

export function SignalForm({ signalId, initialData }: Readonly<SignalFormProps>) {
  const isEdit = Boolean(signalId);
  const { t } = useTranslation('signals');
  const router = useRouter();
  const { formError, setErrors, clearErrors } = useValidationErrors();
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [form, setForm] = useState({
    title: initialData?.title ?? '',
    description: initialData?.description ?? '',
    context: initialData?.context ?? '',
    domain: (initialData?.domain ?? ''),
    scale: (initialData?.scale ?? ''),
    confidence: (initialData?.confidence ?? ''),
    novelty: (initialData?.novelty ?? ''),
    regenerativeRelevance: initialData?.regenerativeRelevance ?? 5,
    sourceType: (initialData?.sourceType ?? ''),
    sourceUrl: initialData?.sourceUrl ?? '',
    isLocalizable: initialData?.isLocalizable ?? false,
    locationName: initialData?.locationName ?? '',
    latitude: initialData?.latitude,
    longitude: initialData?.longitude,
    tags: initialData?.tags ?? [] as string[],
  });

const [newTag, setNewTag] = useState('');

const [cityValue, setCityValue] = useState<CityAutocompleteValue>(
    initialData?.locationName
      ? { name: initialData.locationName, country: '', lat: initialData.latitude || 0, lng: initialData.longitude || 0 }
      : null
  );

useEffect(() => {
    setHydrated(true);
  }, []);

  const addTag = () => {
    if (newTag && !form.tags.includes(newTag)) {
      setForm((f) => ({ ...f, tags: [...f.tags, newTag] }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: f.tags.filter((existing) => existing !== tag) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!form.title.trim()) {
      setErrors({ success: false, error: t('errors.titleRequired') });
      return;
    }
    if (!form.domain) {
      setErrors({ success: false, error: t('errors.domainRequired') });
      return;
    }
    if (!form.scale) {
      setErrors({ success: false, error: t('errors.scaleRequired') });
      return;
    }
    if (form.isLocalizable && (!cityValue?.lat || !cityValue?.lng)) {
      setErrors({ success: false, error: t('errors.locationRequired') });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        context: form.context || undefined,
        domain: form.domain,
        scale: form.scale,
        confidence: (form.confidence || 'MEDIUM'),
        novelty: (form.novelty || 'UNCOMMON'),
        regenerativeRelevance: form.regenerativeRelevance,
        sourceType: (form.sourceType || 'FIRSTHAND'),
        sourceUrl: form.sourceUrl || undefined,
isLocalizable: form.isLocalizable,
      locationName: cityValue?.name || undefined,
      latitude: cityValue?.lat,
      longitude: cityValue?.lng,
        tags: form.tags,
      };

      const result = isEdit && signalId
        ? await updateWeakSignal(signalId, payload)
        : await createWeakSignal(payload);

      if (result.success && result.data) {
        const destination = `/signals/${result.data.id}`;
        router.push(destination);
        globalThis.location.assign(destination);
      } else {
        setErrors(result);
      }
    } catch (err) {
      console.error(isEdit ? 'Error updating signal:' : 'Error creating signal:', err);
      setErrors({ success: false, error: isEdit ? t('errors.updateFailed') : t('errors.createFailed') });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/50">
          <RadioIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEdit ? t('form.update') : t('form.submit')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('createMetaDescription')}
          </p>
        </div>
      </div>

      <form data-testid="signal-form" data-hydrated={hydrated ? 'true' : 'false'} onSubmit={handleSubmit} className="space-y-6">
        <CommonsLicenseNotice />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('form.title')} <span className="text-red-500">*</span>
          </label>
        <input
          name="title"
          type="text"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          placeholder={t('form.titlePlaceholder')}
          maxLength={200}
          required
        />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('form.description')}
          </label>
        <textarea
          name="description"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          placeholder={t('form.descriptionPlaceholder')}
          rows={4}
          maxLength={5000}
        />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('form.context')}
          </label>
        <textarea
          name="context"
          value={form.context}
          onChange={(e) => setForm((f) => ({ ...f, context: e.target.value }))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          placeholder={t('form.contextPlaceholder')}
          rows={3}
          maxLength={3000}
        />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('form.domain')} <span className="text-red-500">*</span>
            </label>
        <select
          name="domain"
          value={form.domain}
          onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value as SignalDomain }))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          required
        >
              <option value="">{t('form.domainPlaceholder')}</option>
              {DOMAIN_OPTIONS.map((d) => (
                <option key={d} value={d}>{t(`domains.${d}`)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('form.scale')} <span className="text-red-500">*</span>
            </label>
        <select
          name="scale"
          value={form.scale}
          onChange={(e) => setForm((f) => ({ ...f, scale: e.target.value as SignalScale }))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          required
        >
              <option value="">{t('filters.scale')}</option>
              {SCALE_OPTIONS.map((s) => (
                <option key={s} value={s}>{t(`scale.${s}`)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('form.confidence')}
            </label>
        <select
          name="confidence"
          value={form.confidence}
          onChange={(e) => setForm((f) => ({ ...f, confidence: e.target.value as SignalConfidence }))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
              <option value="">{t('filters.confidence')}</option>
              {CONFIDENCE_OPTIONS.map((c) => (
                <option key={c} value={c}>{t(`confidence.${c}`)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('form.novelty')}
            </label>
        <select
          name="novelty"
          value={form.novelty}
          onChange={(e) => setForm((f) => ({ ...f, novelty: e.target.value as SignalNovelty }))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
              <option value="">{t('filters.novelty')}</option>
              {NOVELTY_OPTIONS.map((n) => (
                <option key={n} value={n}>{t(`novelty.${n}`)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('form.regenerativeRelevance')}
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={form.regenerativeRelevance}
              onChange={(e) => setForm((f) => ({ ...f, regenerativeRelevance: Number.parseInt(e.target.value) }))}
              className="w-full mt-2"
            />
            <div className="text-center text-sm text-gray-500">{form.regenerativeRelevance}/10</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('form.sourceType')}
            </label>
        <select
          name="sourceType"
          value={form.sourceType}
          onChange={(e) => setForm((f) => ({ ...f, sourceType: e.target.value as SignalSourceType }))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
              <option value="">{t('form.sourceTypePlaceholder')}</option>
              {SOURCE_TYPE_OPTIONS.map((s) => (
                <option key={s} value={s}>{t(`sourceType.${s}`)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('form.sourceUrl')}
            </label>
        <input
          name="sourceUrl"
          type="url"
          value={form.sourceUrl}
          onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          placeholder={t('form.sourceUrlPlaceholder')}
        />
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isLocalizable}
              onChange={(e) => setForm((f) => ({ ...f, isLocalizable: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {form.isLocalizable ? t('form.locationEnabled') : t('form.locationDisabled')}
            </span>
          </label>

{form.isLocalizable && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('form.location')}
            </label>
            <CityAutocomplete
              value={cityValue}
              onChange={setCityValue}
              placeholder={t('form.locationSearchPlaceholder')}
            />
          </div>
        )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('form.tags')}
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              placeholder={t('form.tagsPlaceholder')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button type="button" variant="secondary" size="sm" onClick={addTag}>
              <PlusIcon className="h-4 w-4" />
            </Button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 dark:bg-teal-900/30 rounded text-xs text-teal-700 dark:text-teal-300"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    aria-label={t('form.removeTag', { defaultValue: 'Remove tag {{tag}}', tag })}
                    className="hover:text-red-500"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {formError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
            <RadioIcon className="h-4 w-4 flex-shrink-0 mt-0.5" />
            {formError}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button type="submit" variant="primary" disabled={saving}>
            {(() => {
              if (saving) return t('form.submitting');
              if (isEdit) return t('form.update');
              return t('form.submit');
            })()}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            {t('form.cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
