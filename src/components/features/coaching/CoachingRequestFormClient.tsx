'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { createCoachingRequestAction } from '@/app/actions/coaching';
import { useValidationErrors } from '@/hooks/useValidationErrors';

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none';

export default function CoachingRequestFormClient() {
  const { t } = useTranslation('coaching');
  const router = useRouter();
  const { formError, setErrors, clearErrors, getFieldError } = useValidationErrors();
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const [stuckOn, setStuckOn] = useState('');
  const [stuckOnTouched, setStuckOnTouched] = useState(false);
  const [shiftsWanted, setShiftsWanted] = useState('');
  const [shiftsWantedTouched, setShiftsWantedTouched] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    clearErrors();

    const fd = new FormData(e.currentTarget);
    const formatPreference = fd.get('formatPreference') as string;
    const input = {
      stuckOn,
      shiftsWanted,
      ...(formatPreference ? { formatPreference } : {}),
    };

    const result = await createCoachingRequestAction(input);
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
      {t('requestForm.successMessage')}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <p className="rounded-lg bg-red-900/30 p-3 text-sm text-red-300">{formError}</p>
      )}
      {getFieldError('stuckOn') && (
        <p className="text-xs text-red-400">{getFieldError('stuckOn')}</p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          {t('requestForm.stuckOnLabel')} <span className="text-red-400">*</span>
        </label>
        <textarea
          value={stuckOn}
          onChange={(e) => setStuckOn(e.target.value)}
          onBlur={() => setStuckOnTouched(true)}
          required
          rows={3}
          placeholder={t('requestForm.stuckOnPlaceholder')}
          className={`${INPUT_CLASS} ${stuckOnTouched && stuckOn.length < 20 ? 'border-red-500' : ''}`}
        />
        {stuckOnTouched && stuckOn.length < 20 && (
          <p className="mt-1 text-xs text-red-400">{t('requestForm.minChars', { min: 20, current: stuckOn.length })}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          {t('requestForm.shiftsWantedLabel')} <span className="text-red-400">*</span>
        </label>
        <textarea
          value={shiftsWanted}
          onChange={(e) => setShiftsWanted(e.target.value)}
          onBlur={() => setShiftsWantedTouched(true)}
          required
          rows={3}
          placeholder={t('requestForm.shiftsWantedPlaceholder')}
          className={`${INPUT_CLASS} ${shiftsWantedTouched && shiftsWanted.length < 10 ? 'border-red-500' : ''}`}
        />
        {shiftsWantedTouched && shiftsWanted.length < 10 && (
          <p className="mt-1 text-xs text-red-400">{t('requestForm.minCharsShort', { min: 10, current: shiftsWanted.length })}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          {t('requestForm.formatPreferenceLabel')} <span className="text-slate-500">({t('requestForm.optional')})</span>
        </label>
        <input
          name="formatPreference"
          type="text"
          placeholder={t('requestForm.formatPreferencePlaceholder')}
          className={INPUT_CLASS}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? t('requestForm.submitting') : t('requestForm.submit')}
      </button>
    </form>
  );
}
