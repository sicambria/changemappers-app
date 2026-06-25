'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { createContributionRequestAction } from '@/app/actions/contribute';
import { useValidationErrors } from '@/hooks/useValidationErrors';

const CONTRIBUTION_TYPES = [
  'SKILL_OFFERING',
  'ACCOMPANIMENT',
  'KNOWLEDGE_COMMONS',
  'HOLDING_SPACE',
] as const;

type ContributionType = (typeof CONTRIBUTION_TYPES)[number];

export default function ContributionRequestFormClient() {
  const { t } = useTranslation('contribute');
  const router = useRouter();
  const [type, setType] = useState<ContributionType>('SKILL_OFFERING');
  const [whatNeeded, setWhatNeeded] = useState('');
  const [whatNeededTouched, setWhatNeededTouched] = useState(false);
  const [alreadyTried, setAlreadyTried] = useState('');
  const [willDoWith, setWillDoWith] = useState('');
  const [loading, setLoading] = useState(false);
  const { formError, setErrors, clearErrors, getFieldError, clearFieldError } = useValidationErrors();
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    clearErrors();

    const result = await createContributionRequestAction({
      type,
      whatNeeded,
      alreadyTried: alreadyTried || undefined,
      willDoWith: willDoWith || undefined,
    });

    setLoading(false);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push('/contribute/find'), 1200);
    } else {
      setErrors(result);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="text-2xl text-emerald-600">✓</div>
        <p className="mt-2 font-semibold text-emerald-900">
          {t('requestForm.successTitle')}
        </p>
        <p className="mt-1 text-sm text-emerald-700">
          {t('requestForm.successBody')}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-800">
          {t('requestForm.typeLabel')}
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ContributionType)}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        >
          {CONTRIBUTION_TYPES.map((option) => (
            <option key={option} value={option}>
              {t(`types.${option}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-800">
          {t('request.whatNeeded')}
        </label>
        <textarea
          value={whatNeeded}
          onChange={(e) => {
            setWhatNeeded(e.target.value);
            clearFieldError('whatNeeded');
          }}
          onBlur={() => setWhatNeededTouched(true)}
          required
          rows={4}
          placeholder={t('requestForm.whatNeededPlaceholder')}
          className={`w-full rounded-xl border px-3 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:ring-2 ${
            whatNeededTouched && whatNeeded.length < 20
              ? 'border-red-300 bg-red-50/40 focus:border-red-500 focus:ring-red-500/20'
              : 'border-gray-200 bg-white focus:border-emerald-500 focus:ring-emerald-500/20'
          }`}
        />
        <div className="flex justify-between">
          {whatNeededTouched && whatNeeded.length < 20 ? (
            <p className="text-xs text-red-600">{t('requestForm.minimumChars')}</p>
          ) : (
            <span />
          )}
          <p className={`ml-auto text-xs ${whatNeededTouched && whatNeeded.length < 20 ? 'text-red-600' : 'text-gray-500'}`}>
            {t('requestForm.minCount', { count: whatNeeded.length })}
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-800">
          {t('request.alreadyTried')}{' '}
          <span className="font-normal text-gray-400">({t('common.optional')})</span>
        </label>
        <textarea
          value={alreadyTried}
          onChange={(e) => {
            setAlreadyTried(e.target.value);
            clearFieldError('alreadyTried');
          }}
          rows={3}
          placeholder={t('requestForm.alreadyTriedPlaceholder')}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-800">
          {t('requestForm.willDoWithLabel')}{' '}
          <span className="font-normal text-gray-400">({t('requestForm.willDoWithHint')})</span>
        </label>
        <textarea
          value={willDoWith}
          onChange={(e) => {
            setWillDoWith(e.target.value);
            clearFieldError('willDoWith');
          }}
          rows={3}
          placeholder={t('requestForm.willDoWithPlaceholder')}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {formError && (
        <p className="text-sm text-rose-600">{formError}</p>
      )}
      {getFieldError('whatNeeded') && (
        <p className="text-xs text-red-600">{getFieldError('whatNeeded')}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? t('requestForm.submitting') : t('requestForm.submit')}
      </button>
    </form>
  );
}
