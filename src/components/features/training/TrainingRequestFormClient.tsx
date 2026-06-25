'use client';

import { useState } from 'react';
import { createTrainingRequestAction } from '@/app/actions/training';
import type { CreateTrainingRequestInput } from '@/lib/validations/training';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { useTranslation } from 'react-i18next';

export default function TrainingRequestFormClient() {
  const { t } = useTranslation('training');
  const { formError, setErrors, clearErrors, getFieldError } = useValidationErrors();
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const [skillGapDescription, setSkillGapDescription] = useState('');
  const [skillGapDescriptionTouched, setSkillGapDescriptionTouched] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    clearErrors();

    const fd = new FormData(e.currentTarget);
    const formatPref = fd.get('formatPreference') as string;
    const levelPref = fd.get('levelPreference') as string;

    const input: CreateTrainingRequestInput = {
      domain: fd.get('domain') as string,
      skillGapDescription,
      formatPreference: formatPref ? (formatPref as CreateTrainingRequestInput['formatPreference']) : undefined,
      levelPreference: levelPref ? (levelPref as CreateTrainingRequestInput['levelPreference']) : undefined,
    };

    const result = await createTrainingRequestAction(input);
    setPending(false);

    if (result.success) {
      setSuccess(true);
    } else {
      setErrors(result);
    }
  }

  if (success) {
    return (
      <p className="rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/30 dark:text-green-300">
        {t('requestForm.success')}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {formError}
        </p>
      )}
      {getFieldError('domain') && (
        <p className="text-xs text-red-500 dark:text-red-400">{getFieldError('domain')}</p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('request.domain')}
        </label>
        <input
          name="domain"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('request.skillGap')}
        </label>
        <textarea
          value={skillGapDescription}
          onChange={(e) => setSkillGapDescription(e.target.value)}
          onBlur={() => setSkillGapDescriptionTouched(true)}
          rows={4}
          required
          placeholder={t('requestForm.skillGapPlaceholder')}
          className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
            skillGapDescriptionTouched && skillGapDescription.length < 20
              ? 'border-red-400 dark:border-red-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        />
        {skillGapDescriptionTouched && skillGapDescription.length < 20 && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">
            {t('requestForm.minChars', { min: 20, count: skillGapDescription.length })}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('request.formatPreference')}
          </label>
          <select
            name="formatPreference"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
          <option value="">{t('requestForm.any')}</option>
          <option value="WORKSHOP">{t('offerSection.formats.WORKSHOP')}</option>
          <option value="COURSE">{t('offerSection.formats.COURSE')}</option>
          <option value="DEMO">{t('offerSection.formats.DEMO')}</option>
          <option value="RESOURCE">{t('offerSection.formats.RESOURCE')}</option>
          <option value="GUIDED_PRACTICE">{t('offerSection.formats.GUIDED_PRACTICE')}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('request.levelPreference')}
          </label>
          <select
            name="levelPreference"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
          <option value="">{t('requestForm.any')}</option>
          <option value="BEGINNER">{t('requestForm.levelBeginner')}</option>
          <option value="PARTIAL">{t('requestForm.levelPartial')}</option>
          <option value="ADVANCED">{t('requestForm.levelAdvanced')}</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {pending ? t('requestForm.submitting') : t('requestForm.submit')}
      </button>
    </form>
  );
}
