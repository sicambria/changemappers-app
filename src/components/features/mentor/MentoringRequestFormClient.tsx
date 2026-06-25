'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { createMentoringRequestAction } from '@/app/actions/mentoring';
import { useValidationErrors } from '@/hooks/useValidationErrors';

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none';

export default function MentoringRequestFormClient() {
  const { t } = useTranslation('mentor');
  const router = useRouter();
  const { formError, setErrors, clearErrors, getFieldError } = useValidationErrors();
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const [inflectionPoint, setInflectionPoint] = useState('');
  const [inflectionPointTouched, setInflectionPointTouched] = useState(false);
  const [guidanceSought, setGuidanceSought] = useState('');
  const [guidanceSoughtTouched, setGuidanceSoughtTouched] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    clearErrors();

    const fd = new FormData(e.currentTarget);
    const input = {
      domain: fd.get('domain') as string,
      inflectionPoint,
      guidanceSought,
    };

    const result = await createMentoringRequestAction(input);
    setPending(false);

    if (!result.success) {
      setErrors(result);
      return;
    }

    setSuccess(true);
    router.push('/mentor/connections');
  }

  if (success) {
    return (
      <p className="rounded-lg bg-emerald-900/30 p-4 text-emerald-300">
        {t('request.successMessage')}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <p className="rounded-lg bg-red-900/30 p-3 text-sm text-red-300">{formError}</p>
      )}
      {getFieldError('inflectionPoint') && (
        <p className="text-xs text-red-400">{getFieldError('inflectionPoint')}</p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          {t('request.domainLabel')} <span className="text-red-400">*</span>
        </label>
        <input name="domain" type="text" required className={INPUT_CLASS} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          {t('request.inflectionPointLabel')} <span className="text-red-400">*</span>
        </label>
        <textarea
          value={inflectionPoint}
          onChange={(e) => setInflectionPoint(e.target.value)}
          onBlur={() => setInflectionPointTouched(true)}
          required
          rows={3}
          placeholder={t('request.inflectionPointPlaceholder')}
          className={`${INPUT_CLASS} ${inflectionPointTouched && inflectionPoint.length < 20 ? 'border-red-500' : ''}`}
        />
        {inflectionPointTouched && inflectionPoint.length < 20 && (
          <p className="mt-1 text-xs text-red-400">{t('request.minChars', { min: 20, current: inflectionPoint.length })}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          {t('request.guidanceSoughtLabel')} <span className="text-red-400">*</span>
        </label>
        <textarea
          value={guidanceSought}
          onChange={(e) => setGuidanceSought(e.target.value)}
          onBlur={() => setGuidanceSoughtTouched(true)}
          required
          rows={3}
          placeholder={t('request.guidanceSoughtPlaceholder')}
          className={`${INPUT_CLASS} ${guidanceSoughtTouched && guidanceSought.length < 20 ? 'border-red-500' : ''}`}
        />
        {guidanceSoughtTouched && guidanceSought.length < 20 && (
          <p className="mt-1 text-xs text-red-400">{t('request.minChars', { min: 20, current: guidanceSought.length })}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? t('request.submitting') : t('request.submit')}
      </button>
    </form>
  );
}
