'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createMentorProfileAction, editMentorProfileAction } from '@/app/actions/mentoring';
import type { CreateMentorProfileInput } from '@/lib/validations/mentoring';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { useTranslation } from 'react-i18next';

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none';

interface Props {
  isEdit?: boolean;
  id?: string;
  initialData?: Partial<CreateMentorProfileInput>;
}

export default function MentorProfileFormClient({ isEdit = false, id, initialData = {} }: Readonly<Props>) {
  const router = useRouter();
  const { t } = useTranslation('mentor');
  const { formError, setErrors, clearErrors, getFieldError } = useValidationErrors();
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const [whatCanOffer, setWhatCanOffer] = useState(initialData.whatCanOffer ?? '');
  const [whatCanOfferTouched, setWhatCanOfferTouched] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    clearErrors();

    const fd = new FormData(e.currentTarget);
    const input: CreateMentorProfileInput = {
      domain: fd.get('domain') as string,
      yearsExperience: Number(fd.get('yearsExperience')),
      whatCanOffer,
      arcLengthPreference: fd.get('arcLengthPreference') as string,
      maxConcurrent: Number(fd.get('maxConcurrent') ?? 2),
    };

    const result = isEdit && id
      ? await editMentorProfileAction(id, input)
      : await createMentorProfileAction(input);
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
        {isEdit ? t('profileForm.updated') : t('profileForm.created')}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <p className="rounded-lg bg-red-900/30 p-3 text-sm text-red-300">{formError}</p>
      )}
      {getFieldError('domain') && (
        <p className="text-xs text-red-400">{getFieldError('domain')}</p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          {t('profileForm.domain')} <span className="text-red-400">*</span>
        </label>
        <input name="domain" type="text" required defaultValue={initialData.domain ?? ''} className={INPUT_CLASS} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          {t('profileForm.yearsExperience')} <span className="text-red-400">*</span>
        </label>
        <input
          name="yearsExperience"
          type="number"
          required
          min={0}
          defaultValue={initialData.yearsExperience ?? 0}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          {t('profileForm.whatCanOffer')} <span className="text-red-400">*</span>
        </label>
        <p className="mb-1 text-xs text-slate-500">
          {t('profileForm.whatCanOfferHint')}
        </p>
        <textarea
          value={whatCanOffer}
          onChange={(e) => setWhatCanOffer(e.target.value)}
          onBlur={() => setWhatCanOfferTouched(true)}
          required
          rows={4}
          className={`${INPUT_CLASS} ${whatCanOfferTouched && whatCanOffer.length < 20 ? 'border-red-500' : ''}`}
        />
        <div className="flex justify-between mt-1">
          {whatCanOfferTouched && whatCanOffer.length < 20 ? (
            <p className="text-xs text-red-400">{t('profileForm.minChars', { min: 20 })}</p>
          ) : (
            <span />
          )}
          <p className={`text-xs ml-auto ${whatCanOfferTouched && whatCanOffer.length < 20 ? 'text-red-400' : 'text-slate-500'}`}>
            {whatCanOffer.length}/{t('profileForm.min', { min: 20 })}
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          {t('profileForm.arcLengthPreference')} <span className="text-red-400">*</span>
        </label>
        <input
          name="arcLengthPreference"
          type="text"
          required
          placeholder={t('profileForm.arcLengthPlaceholder')}
          defaultValue={initialData.arcLengthPreference ?? ''}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          {t('profileForm.maxConcurrent')}
        </label>
        <input
          name="maxConcurrent"
          type="number"
          min={1}
          max={10}
          defaultValue={initialData.maxConcurrent ?? 2}
          className={INPUT_CLASS}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {(() => {
          if (pending) return t('profileForm.saving');
          if (isEdit) return t('profileForm.update');
          return t('profileForm.create');
        })()}
      </button>
    </form>
  );
}
