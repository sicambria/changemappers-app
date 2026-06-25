'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { createCoachingOfferAction, editCoachingOfferAction } from '@/app/actions/coaching';
import type { CreateCoachingOfferInput } from '@/lib/validations/coaching';
import { useValidationErrors } from '@/hooks/useValidationErrors';

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none';

interface Props {
  isEdit?: boolean;
  id?: string;
  initialData?: Partial<CreateCoachingOfferInput>;
}

export default function CoachingOfferFormClient({ isEdit = false, id, initialData = {} }: Readonly<Props>) {
  const { t } = useTranslation('coaching');
  const router = useRouter();
  const { formError, setErrors, clearErrors } = useValidationErrors();
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    clearErrors();

    const fd = new FormData(e.currentTarget);
    const input: CreateCoachingOfferInput = {
      style: fd.get('style') as string,
      format: fd.get('format') as string,
      arcLengthOption: fd.get('arcLengthOption') as string,
      availability: fd.get('availability') as string,
      coacheeKnow: fd.get('coacheeKnow') as string,
    };

    const result = isEdit && id
      ? await editCoachingOfferAction(id, input)
      : await createCoachingOfferAction(input);
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
        {isEdit ? t('offer.updated') : t('offer.createdSuccess')}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
    {formError && (
      <p className="rounded-lg bg-red-900/30 p-3 text-sm text-red-300">{formError}</p>
    )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          {t('offer.style')} <span className="text-red-400">*</span>
        </label>
        <input
          name="style"
          type="text"
          required
          placeholder={t('offer.stylePlaceholder')}
          defaultValue={initialData.style ?? ''}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          {t('offer.format')} <span className="text-red-400">*</span>
        </label>
        <input
          name="format"
          type="text"
          required
          placeholder={t('offer.formatPlaceholder')}
          defaultValue={initialData.format ?? ''}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          {t('offer.arcLengthOption')} <span className="text-red-400">*</span>
        </label>
        <input
          name="arcLengthOption"
          type="text"
          required
          placeholder={t('offer.arcLengthPlaceholder')}
          defaultValue={initialData.arcLengthOption ?? ''}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          {t('offer.availability')} <span className="text-red-400">*</span>
        </label>
        <input
          name="availability"
          type="text"
          required
          placeholder={t('offer.availabilityPlaceholder')}
          defaultValue={initialData.availability ?? ''}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">
          {t('offer.coacheeKnow')} <span className="text-red-400">*</span>
        </label>
        <textarea
          name="coacheeKnow"
          required
          rows={4}
          placeholder={t('offer.coacheeKnowPlaceholder')}
          defaultValue={initialData.coacheeKnow ?? ''}
          className={INPUT_CLASS}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {(() => {
          if (pending) return t('offer.saving');
          if (isEdit) return t('offer.edit');
          return t('offer.create');
        })()}
      </button>
    </form>
  );
}
