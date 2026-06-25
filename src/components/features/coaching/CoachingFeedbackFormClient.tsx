'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { submitCoachingFeedbackAction } from '@/app/actions/coaching';
import { useValidationErrors } from '@/hooks/useValidationErrors';

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none';

export default function CoachingFeedbackFormClient({ engagementId }: Readonly<{ engagementId: string }>) {
  const { t } = useTranslation('coaching');
  const router = useRouter();
  const { formError, setErrors, clearErrors, getFieldError } = useValidationErrors();
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const [coacheeReflection, setCoacheeReflection] = useState('');
  const [coacheeReflectionTouched, setCoacheeReflectionTouched] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    clearErrors();

    const fd = new FormData(e.currentTarget);
    const coachObservation = fd.get('coachObservation') as string;
    const input = {
      engagementId,
      coacheeReflection,
      ...(coachObservation ? { coachObservation } : {}),
    };

    const result = await submitCoachingFeedbackAction(input);
    setPending(false);

    if (!result.success) {
      setErrors(result);
      return;
    }

    setSuccess(true);
    router.push('/coach/connections');
  }

  if (success) {
    return (
    <p className="rounded-lg bg-emerald-900/30 p-4 text-emerald-300">
      {t('feedbackForm.successMessage')}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <p className="rounded-lg bg-red-900/30 p-3 text-sm text-red-300">{formError}</p>
      )}
      {getFieldError('coacheeReflection') && (
        <p className="text-xs text-red-400">{getFieldError('coacheeReflection')}</p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          {t('feedbackForm.yourReflectionLabel')} <span className="text-red-400">*</span>
        </label>
        <p className="mb-1 text-xs text-slate-500">
          {t('feedbackForm.yourReflectionHint')}
        </p>
        <textarea
          value={coacheeReflection}
          onChange={(e) => setCoacheeReflection(e.target.value)}
          onBlur={() => setCoacheeReflectionTouched(true)}
          required
          rows={5}
          placeholder={t('feedbackForm.yourReflectionPlaceholder')}
          className={`${INPUT_CLASS} ${coacheeReflectionTouched && coacheeReflection.length < 50 ? 'border-red-500' : ''}`}
        />
        <div className="flex justify-between mt-1">
          {coacheeReflectionTouched && coacheeReflection.length < 50 ? (
            <p className="text-xs text-red-400">{t('feedbackForm.minChars', { count: 50 })}</p>
          ) : (
            <span />
          )}
        <p className={`text-xs ml-auto ${coacheeReflectionTouched && coacheeReflection.length < 50 ? 'text-red-400' : 'text-slate-500'}`}>
          {t('feedbackForm.charCount', { current: coacheeReflection.length, min: 50 })}
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          {t('feedbackForm.coachObservationLabel')} <span className="text-slate-500">({t('feedbackForm.optional')})</span>
        </label>
        <p className="mb-1 text-xs text-slate-500">
          {t('feedbackForm.coachObservationHint')}
        </p>
        <textarea
          name="coachObservation"
          rows={3}
          placeholder={t('feedbackForm.coachObservationPlaceholder')}
          className={INPUT_CLASS}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? t('feedbackForm.submitting') : t('feedbackForm.submit')}
      </button>
    </form>
  );
}
