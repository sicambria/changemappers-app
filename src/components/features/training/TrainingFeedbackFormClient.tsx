'use client';

import { useState } from 'react';
import { submitTrainingFeedbackAction } from '@/app/actions/training';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { useTranslation } from 'react-i18next';

interface Props {
  engagementId: string;
}

export default function TrainingFeedbackFormClient({ engagementId }: Readonly<Props>) {
  const { t } = useTranslation('training');
  const { formError, setErrors, clearErrors, getFieldError } = useValidationErrors();
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const [learnerReflection, setLearnerReflection] = useState('');
  const [learnerReflectionTouched, setLearnerReflectionTouched] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    clearErrors();

    const fd = new FormData(e.currentTarget);
    const trainerObservation = fd.get('trainerObservation') as string;

    const result = await submitTrainingFeedbackAction({
      engagementId,
      learnerReflection,
      trainerObservation: trainerObservation || undefined,
    });

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
        {t('feedbackForm.success')}
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
      {getFieldError('learnerReflection') && (
        <p className="text-xs text-red-500 dark:text-red-400">{getFieldError('learnerReflection')}</p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('feedbackForm.yourReflection')}
        </label>
        <textarea
          value={learnerReflection}
          onChange={(e) => setLearnerReflection(e.target.value)}
          onBlur={() => setLearnerReflectionTouched(true)}
          rows={5}
          required
          placeholder={t('feedbackForm.yourReflectionPlaceholder')}
          className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
            learnerReflectionTouched && learnerReflection.length < 50
              ? 'border-red-400 dark:border-red-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        />
        <div className="flex justify-between mt-1">
          {learnerReflectionTouched && learnerReflection.length < 50 ? (
            <p className="text-xs text-red-500 dark:text-red-400">{t('feedbackForm.minChars', { min: 50 })}</p>
          ) : (
            <span />
          )}
          <p className={`text-xs ml-auto ${learnerReflectionTouched && learnerReflection.length < 50 ? 'text-red-400' : 'text-gray-400'}`}>
            {learnerReflection.length}/{t('feedbackForm.min', { min: 50 })}
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('feedbackForm.trainerObservation')} <span className="text-gray-400">{t('feedbackForm.optional')}</span>
        </label>
        <textarea
          name="trainerObservation"
          rows={3}
          placeholder={t('feedbackForm.trainerObservationPlaceholder')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {pending ? t('feedbackForm.submitting') : t('feedbackForm.submit')}
      </button>
    </form>
  );
}
