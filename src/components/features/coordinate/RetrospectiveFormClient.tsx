'use client';

import { useState } from 'react';
import { submitRetrospectiveAction } from '@/app/actions/coordinate';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { useTranslation } from 'react-i18next';

export default function RetrospectiveFormClient({ initiativeId }: Readonly<{ initiativeId: string }>) {
  const { t } = useTranslation('coordinate');
  const [publicNarrative, setPublicNarrative] = useState('');
  const [loading, setLoading] = useState(false);
  const { formError, setErrors, clearErrors, getFieldError } = useValidationErrors();
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    clearErrors();

    const result = await submitRetrospectiveAction({ initiativeId, publicNarrative });

    setLoading(false);

    if (!result.success) {
      setErrors(result);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="rounded-xl border border-green-700 bg-green-900/20 p-5">
        <p className="font-medium text-green-300">{t('retrospectiveForm.submitted')}</p>
        <p className="mt-1 text-sm text-green-400">
          {t('retrospectiveForm.submittedMessage')}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-xl border border-slate-700 bg-slate-900 p-5"
    >
      <h2 className="text-base font-semibold text-slate-100">{t('retrospectiveForm.submitTitle')}</h2>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="retrospective-narrative" className="text-sm font-medium text-slate-200">
          {t('retrospectiveForm.publicNarrative')} <span className="text-red-400">*</span>
        </label>
        <textarea
          id="retrospective-narrative"
          required
          rows={6}
          value={publicNarrative}
          onChange={(e) => setPublicNarrative(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-y"
          placeholder={t('retrospectiveForm.placeholder')}
        />
      </div>

      {formError && (
        <p className="rounded-lg border border-red-700 bg-red-900/20 px-3 py-2 text-sm text-red-300">
          {formError}
        </p>
      )}
      {getFieldError('publicNarrative') && (
        <p className="text-xs text-red-400">{getFieldError('publicNarrative')}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="self-start rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? t('retrospectiveForm.submitting') : t('retrospectiveForm.submitTitle')}
      </button>
    </form>
  );
}
