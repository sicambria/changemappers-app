'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { createGrowthOfferAction } from '@/app/actions/growth-hub';
import type { GrowthModality } from '@/types/growth-hub';
import { TrainingFormatValues, TrainingLevelValues, DeliveryModeValues } from '@/types/modalities';
import { DomainCombobox, type DomainOption } from '@/components/ui/DomainCombobox';
import { CityAutocomplete } from '@/components/ui/CityAutocomplete';
import { useValidationErrors } from '@/hooks/useValidationErrors';

interface GrowthOfferFormClientProps {
  initialModality?: GrowthModality;
}

const TIME_COMMITMENT_PRESETS = [
  { value: '1-2 hours/week', key: '1-2h' },
  { value: '3-5 hours/week', key: '3-5h' },
  { value: 'Weekend intensive', key: 'weekend' },
  { value: 'Self-paced', key: 'selfPaced' },
];

function getTranslatedList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function GrowthOfferFormClient({ initialModality }: Readonly<GrowthOfferFormClientProps>) {
  const { t } = useTranslation('growth');
  const router = useRouter();
  const { formError, setErrors, clearErrors } = useValidationErrors();
  const [modality, setModality] = useState<GrowthModality>(initialModality ?? 'TRAINING');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainOption | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<string>('ONLINE');
  const [selectedCity, setSelectedCity] = useState<{ name: string; country: string; lat: number; lng: number } | null>(null);
  const [timeCommitment, setTimeCommitment] = useState<string>('');
  const [customTimeCommitment, setCustomTimeCommitment] = useState<string>('');
  // AUDIT-20260613-038: controlled state for the suggestion-chip fields
  // (was imperative document.querySelector(...).value assignment, which
  // bypassed React's render cycle and could silently drop a selection on
  // re-render). Only one modality renders at a time, so `format` is shared.
  const [style, setStyle] = useState<string>('');
  const [situationType, setSituationType] = useState<string>('');
  const [format, setFormat] = useState<string>('');
  const coachingFormats = getTranslatedList(t('form.coachingFormats', { returnObjects: true }));
  const peerSituations = getTranslatedList(t('form.peerSituations', { returnObjects: true }));
  const peerFormats = getTranslatedList(t('form.peerFormats', { returnObjects: true }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearErrors();

    const formData = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {};

    formData.forEach((value, key) => {
      if (key === 'isSync' || key === 'isGroupFormat') {
        data[key] = value === 'true';
      } else if (key === 'capacity' || key === 'maxConcurrent' || key === 'yearsExperience') {
        data[key] = Number.parseInt(value as string) || undefined;
      } else {
        data[key] = value;
      }
    });

    if (selectedDomain) {
      data.domain = selectedDomain.name;
    }

    data.deliveryMode = deliveryMode;
    if (selectedCity && deliveryMode !== 'ONLINE') {
      data.city = selectedCity.name;
      data.cityLat = selectedCity.lat;
      data.cityLng = selectedCity.lng;
    }

    const finalTimeCommitment = timeCommitment === 'custom' ? customTimeCommitment : timeCommitment;
    if (finalTimeCommitment) {
      data.timeCommitment = finalTimeCommitment;
    }

    const result = await createGrowthOfferAction(modality, data);
    setIsSubmitting(false);

    if (result.success) {
      router.push('/growth/my-offers');
    } else {
      setErrors(result);
    }
  };

  const modalityOptions: GrowthModality[] = ['MENTOR', 'COACH', 'TRAINING', 'PEER'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('form.selectModality')}
        </label>
        <div className="flex flex-wrap gap-2">
          {modalityOptions.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModality(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                modality === m
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t(`modality.${m.toLowerCase()}`)}
            </button>
          ))}
        </div>
      </div>

      {(modality === 'MENTOR' || modality === 'TRAINING') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('form.domainLabel')}
          </label>
          <DomainCombobox
            value={selectedDomain}
            onChange={setSelectedDomain}
            placeholder={t('form.domainPlaceholder')}
          />
        </div>
      )}

      {modality === 'TRAINING' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('form.formatLabel')}
            </label>
            <select
              name="format"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            >
              {Object.keys(TrainingFormatValues).map((f) => (
                <option key={f} value={f}>
                  {f.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('form.levelLabel')}
            </label>
            <select
              name="level"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            >
              {Object.keys(TrainingLevelValues).map((l) => (
                <option key={l} value={l}>
                  {t(`levels.${l}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('form.deliveryModeLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(DeliveryModeValues).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDeliveryMode(mode)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    deliveryMode === mode
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {t(`deliveryMode.${mode}`)}
                </button>
              ))}
            </div>
          </div>

          {deliveryMode !== 'ONLINE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('form.cityLabel')}
              </label>
              <CityAutocomplete
                value={selectedCity}
                onChange={setSelectedCity}
                placeholder={t('form.cityPlaceholder')}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('form.timeCommitmentLabel')}
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {TIME_COMMITMENT_PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => setTimeCommitment(preset.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      timeCommitment === preset.value
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {t(`form.timeCommitmentPresets.${preset.key}`)}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setTimeCommitment('custom')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    timeCommitment === 'custom'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {t('form.timeCommitmentPresets.custom')}
                </button>
              </div>
              {timeCommitment === 'custom' && (
                <input
                  type="text"
                  value={customTimeCommitment}
                  onChange={(e) => setCustomTimeCommitment(e.target.value)}
                  placeholder={t('form.customTimePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  required
                />
              )}
            </div>
          </div>
        </>
      )}

      {modality === 'COACH' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('form.styleLabel')}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {['Art-based', 'Somatic', 'Gestalt', 'Psychosynthesis', 'Narrative', 'Emotionally Focused'].map((styleOption) => (
                <button
                  key={styleOption}
                  type="button"
                  onClick={() => setStyle(styleOption)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                >
                  {styleOption}
                </button>
              ))}
            </div>
            <input
              type="text"
              name="style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              placeholder={t('form.stylePlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('form.formatLabel')}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {coachingFormats.map((formatOption) => (
                <button
                  key={formatOption}
                  type="button"
                  onClick={() => setFormat(formatOption)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                >
                  {formatOption}
                </button>
              ))}
            </div>
            <input
              type="text"
              name="format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              placeholder={t('form.formatPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
        </>
      )}

      {modality === 'PEER' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('form.situationTypeLabel')}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {peerSituations.map((situationOption) => (
                <button
                  key={situationOption}
                  type="button"
                  onClick={() => setSituationType(situationOption)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                >
                  {situationOption}
                </button>
              ))}
            </div>
            <input
              type="text"
              name="situationType"
              value={situationType}
              onChange={(e) => setSituationType(e.target.value)}
              placeholder={t('form.situationTypePlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('form.formatLabel')}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {peerFormats.map((formatOption) => (
                <button
                  key={formatOption}
                  type="button"
                  onClick={() => setFormat(formatOption)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors"
                >
                  {formatOption}
                </button>
              ))}
            </div>
            <input
              type="text"
              name="format"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              placeholder={t('form.peerFormatPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
        </>
      )}

      {modality === 'MENTOR' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('form.maxConcurrentLabel')}
            </label>
            <input
              type="number"
              name="maxConcurrent"
              min={1}
              max={10}
              defaultValue={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('form.yearsExperienceLabel', 'Years of Experience')}
            </label>
            <input
              type="number"
              name="yearsExperience"
              min={0}
              max={60}
              defaultValue={1}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </>
      )}

      {(modality === 'MENTOR' || modality === 'TRAINING') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('form.urlLabel')}
          </label>
          <input
            type="url"
            name="professionalUrl"
            placeholder={t('form.urlPlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('form.descriptionLabel')}
        </label>
        <textarea
          name="description"
          rows={4}
          placeholder={t('form.descriptionPlaceholder')}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          required
        />
      </div>

      {formError && <div className="text-red-600 dark:text-red-400 text-sm">{formError}</div>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors"
      >
        {isSubmitting ? t('actions.create') + '...' : t('actions.create')}
      </button>
    </form>
  );
}
