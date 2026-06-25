'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTrainingOfferAction, editTrainingOfferAction } from '@/app/actions/training';
import type { CreateTrainingOfferInput } from '@/lib/validations/training';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { Tooltip } from '@/components/ui/Tooltip';
import { InfoIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  isEdit?: boolean;
  id?: string;
  initialData?: Partial<CreateTrainingOfferInput>;
}

export default function TrainingOfferFormClient({ isEdit = false, id, initialData = {} }: Readonly<Props>) {
  const router = useRouter();
  const { t } = useTranslation('training');
  const { formError, setErrors, clearErrors, getFieldError } = useValidationErrors();
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const [description, setDescription] = useState(initialData.description ?? '');
  const [descriptionTouched, setDescriptionTouched] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    clearErrors();

    const fd = new FormData(e.currentTarget);
    const input: CreateTrainingOfferInput = {
      domain: fd.get('domain') as string,
      format: fd.get('format') as CreateTrainingOfferInput['format'],
      level: fd.get('level') as CreateTrainingOfferInput['level'],
      deliveryMode: (fd.get('deliveryMode') as CreateTrainingOfferInput['deliveryMode']) || 'ONLINE',
      city: fd.get('city') ? fd.get('city') as string : undefined,
      cityLat: fd.get('cityLat') ? Number(fd.get('cityLat')) : undefined,
      cityLng: fd.get('cityLng') ? Number(fd.get('cityLng')) : undefined,
      professionalUrl: fd.get('professionalUrl') ? fd.get('professionalUrl') as string : undefined,
      description,
      isSync: fd.get('isSync') === 'on',
      isGroupFormat: fd.get('isGroupFormat') === 'on',
      timeCommitment: fd.get('timeCommitment') as string,
      capacity: fd.get('capacity') ? Number(fd.get('capacity')) : undefined,
    };

    const result = isEdit && id
      ? await editTrainingOfferAction(id, input)
      : await createTrainingOfferAction(input);
    setPending(false);

    if (result.success) {
      setSuccess(true);
      router.push('/training/connections');
    } else {
      setErrors(result);
    }
  }

  if (success) {
    return (
      <p className="rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/30 dark:text-green-300">
        {isEdit ? t('offerForm.updated') : t('offerForm.created')}
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

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('offerSection.domain')}
        </label>
        <input
          name="domain"
          defaultValue={initialData.domain ?? ''}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('offerSection.format')}
          </label>
          <select
            name="format"
            defaultValue={initialData.format ?? 'WORKSHOP'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
          <option value="WORKSHOP">{t('offerSection.formats.WORKSHOP')}</option>
          <option value="COURSE">{t('offerSection.formats.COURSE')}</option>
          <option value="DEMO">{t('offerSection.formats.DEMO')}</option>
          <option value="RESOURCE">{t('offerSection.formats.RESOURCE')}</option>
          <option value="GUIDED_PRACTICE">{t('offerSection.formats.GUIDED_PRACTICE')}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('offerSection.level')}
          </label>
          <select
            name="level"
            defaultValue={initialData.level ?? 'EXPLORER'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
          <option value="EXPLORER">{t('offerForm.levelExplorer')}</option>
          <option value="PRACTITIONER">{t('offerForm.levelPractitioner')}</option>
          <option value="GUIDE">{t('offerForm.levelGuide')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('offerForm.deliveryMode')}
          </label>
          <select
            name="deliveryMode"
            defaultValue={initialData.deliveryMode ?? 'ONLINE'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          >
          <option value="ONLINE">{t('offerForm.deliveryOnline')}</option>
          <option value="IN_PERSON">{t('offerForm.deliveryInPerson')}</option>
          <option value="HYBRID">{t('offerForm.deliveryHybrid')}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('offerForm.cityLabel')}
          </label>
          <input
            name="city"
            defaultValue={initialData.city ?? ''}
            placeholder={t('offerForm.cityPlaceholder')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('offerForm.professionalUrl')}
        </label>
        <Tooltip content={t('offerForm.professionalUrlHint')}>
          <InfoIcon className="h-3.5 w-3.5 text-gray-400" />
        </Tooltip>
      </div>
      <input
        name="professionalUrl"
        type="url"
        defaultValue={initialData.professionalUrl ?? ''}
        placeholder="https://..."
        className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${getFieldError('professionalUrl') ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
      />
      {getFieldError('professionalUrl') && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{getFieldError('professionalUrl')}</p>}
    </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('offerSection.description')}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => setDescriptionTouched(true)}
          rows={4}
          required
          className={`w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:text-gray-100 ${
            descriptionTouched && description.length < 20
              ? 'border-red-400 dark:border-red-500'
              : 'border-gray-300 dark:border-gray-600'
          }`}
        />
        <div className="flex justify-between mt-1">
          {descriptionTouched && description.length < 20 ? (
            <p className="text-xs text-red-500 dark:text-red-400">{t('offerForm.minChars', { min: 20 })}</p>
          ) : (
            <span />
          )}
          <p className={`text-xs ml-auto ${descriptionTouched && description.length < 20 ? 'text-red-400' : 'text-gray-400'}`}>
            {description.length}/{t('offerForm.min', { min: 20 })}
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('offerSection.timeCommitment')}
        </label>
        <input
          name="timeCommitment"
          defaultValue={initialData.timeCommitment ?? ''}
          required
          placeholder={t('offerForm.timeCommitmentPlaceholder')}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('offerForm.capacityOptional')}
        </label>
        <input
          name="capacity"
          type="number"
          defaultValue={initialData.capacity ?? ''}
          min={1}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input name="isSync" type="checkbox" defaultChecked={initialData.isSync ?? true} />
          {t('offerForm.synchronous')}
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input name="isGroupFormat" type="checkbox" defaultChecked={initialData.isGroupFormat ?? false} />
          {t('offerForm.groupFormat')}
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {(() => {
          if (pending) return t('offerForm.saving');
          if (isEdit) return t('offerForm.update');
          return t('offerForm.create');
        })()}
      </button>
    </form>
  );
}
