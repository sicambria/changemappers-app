'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { createCanvasAction } from '@/app/actions/canvas';
import type { CreateCanvasInput } from '@/lib/validations/canvas';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { CommonsLicenseNotice } from '@/components/shared/CommonsLicenseNotice';

const INPUT_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition';

interface Props {
  communityId?: string;
}

export default function DrawingBoardFormClient({ communityId }: Readonly<Props>) {
  const router = useRouter();
  const { t } = useTranslation('canvas');
  const { formError, setErrors, clearErrors, getFieldError } = useValidationErrors();
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    clearErrors();

    const fd = new FormData(e.currentTarget);
    const input: CreateCanvasInput = {
      title: fd.get('title') as string,
      description: (fd.get('description') as string) || undefined,
      visibility: fd.get('visibility') as 'PUBLIC' | 'REGISTERED' | 'COMMUNITY',
      communityId: communityId,
    };

    const result = await createCanvasAction(input);
    setPending(false);

    if (!result.success) {
      setErrors(result);
      return;
    }

    router.push(`/canvas/${result.data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <p className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
          {formError}
        </p>
      )}
      {getFieldError('title') && (
        <p className="text-xs text-red-500">{getFieldError('title')}</p>
      )}

      <CommonsLicenseNotice />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {t('form.diagramTitleRequired')} <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          type="text"
          required
          placeholder={t('form.diagramTitlePlaceholder')}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {t('form.descriptionOptional')} <span className="text-gray-400 font-normal">({t('canvas.description').toLowerCase()})</span>
        </label>
        <textarea
          name="description"
          rows={3}
          placeholder={t('form.descriptionPlaceholder')}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {t('form.whoCanView')}
        </label>
        <select name="visibility" className={INPUT_CLASS} defaultValue="REGISTERED">
          <option value="PUBLIC">{t('form.visibilityPublic')}</option>
          <option value="REGISTERED">{t('form.visibilityRegistered')}</option>
          <option value="COMMUNITY">{t('form.visibilityCommunity')}</option>
        </select>
        <p className="mt-1.5 text-xs text-gray-400">
          {t('form.visibilityNote')}
          {communityId
            ? t('form.visibilityNoteCommunity')
            : t('form.visibilityNoteNoCommunity')}
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
      >
        {pending ? t('form.creating') : t('form.createAndOpen')}
      </button>
    </form>
  );
}
