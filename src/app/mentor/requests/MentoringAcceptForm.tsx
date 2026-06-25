'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { acceptMentoringRequestAction } from '@/app/actions/mentoring';
import { useValidationErrors } from '@/hooks/useValidationErrors';

interface MentoringAcceptFormProps {
  requestId: string;
  onDone?: () => void;
}

export function MentoringAcceptForm({ requestId, onDone }: Readonly<MentoringAcceptFormProps>) {
  const { t } = useTranslation('mentor');
  const router = useRouter();
  const [arcLength, setArcLength] = useState('');
  const [checkInRhythm, setCheckInRhythm] = useState('');
  const [pending, setPending] = useState(false);
  const { formError, setErrors, clearErrors } = useValidationErrors();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    clearErrors();
    const result = await acceptMentoringRequestAction({ requestId, arcLength, checkInRhythm });
    setPending(false);
    if (!result.success) {
      setErrors(result);
      return;
    }
    if (onDone) { onDone(); } else { router.push('/mentor/relationships'); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-3">
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">{t('requests.arcLengthLabel')}</label>
        <input
          value={arcLength}
          onChange={(e) => setArcLength(e.target.value)}
          required
          minLength={2}
          maxLength={100}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
          placeholder={t('requests.arcLengthPlaceholder')}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">{t('requests.checkInRhythmLabel')}</label>
        <input
          value={checkInRhythm}
          onChange={(e) => setCheckInRhythm(e.target.value)}
          required
          minLength={2}
          maxLength={100}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100"
          placeholder={t('requests.checkInRhythmPlaceholder')}
        />
      </div>

      {formError && <p role="alert" className="text-sm text-red-400">{formError}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
      >
        {pending ? t('requests.acceptPending') : t('requests.acceptButton')}
      </button>
    </form>
  );
}
