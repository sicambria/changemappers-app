'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { acceptCoachingRequestAction, getMyCoachingOffersAction } from '@/app/actions/coaching';
import { useValidationErrors } from '@/hooks/useValidationErrors';

type Offer = Awaited<ReturnType<typeof getMyCoachingOffersAction>>[number];

const fieldCls = 'w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100';
const labelCls = 'block text-xs font-medium text-slate-400 mb-1';

function FormTextField({ label, value, onChange, required, minLength, maxLength, placeholder }: Readonly<{
  label: string; value: string; onChange: (v: string) => void;
  required?: boolean; minLength?: number; maxLength?: number; placeholder?: string;
}>) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        required={required} minLength={minLength} maxLength={maxLength}
        placeholder={placeholder} className={fieldCls} />
    </div>
  );
}

interface CoachingAcceptFormProps { requestId: string; offers: Offer[]; onDone?: () => void; }

export function CoachingAcceptForm({ requestId, offers, onDone }: Readonly<CoachingAcceptFormProps>) {
  const { t } = useTranslation('coaching');
  const router = useRouter();
  const [offerId, setOfferId] = useState('');
  const [style, setStyle] = useState('');
  const [format, setFormat] = useState('');
  const [arcLength, setArcLength] = useState('');
  const [checkInRhythm, setCheckInRhythm] = useState('');
  const [pending, setPending] = useState(false);
  const { formError, setErrors, clearErrors } = useValidationErrors();
  const activeOffers = offers.filter((o) => !o.isArchived);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!offerId) { setErrors({ success: false, error: t('requests.offerRequired') }); return; }
    setPending(true);
    clearErrors();
    const result = await acceptCoachingRequestAction({
      requestId, offerId, style, format, arcLength,
      checkInRhythm: checkInRhythm || undefined,
    });
    setPending(false);
    if (!result.success) { setErrors(result); return; }
    if (onDone) { onDone(); } else { router.push('/coach/connections'); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-3">
      <div>
        <label className={labelCls}>{t('requests.offerLabel')}</label>
        <select value={offerId} onChange={(e) => setOfferId(e.target.value)} required className={fieldCls}>
          <option value="">{t('requests.offerPlaceholder')}</option>
          {activeOffers.map((o) => <option key={o.id} value={o.id}>{o.style} — {o.format}</option>)}
        </select>
      </div>
      <FormTextField label={t('requests.styleLabel')} value={style} onChange={setStyle}
        required minLength={2} maxLength={200} placeholder={t('requests.stylePlaceholder')} />
      <FormTextField label={t('requests.formatLabel')} value={format} onChange={setFormat}
        required minLength={2} maxLength={100} placeholder={t('requests.formatPlaceholder')} />
      <FormTextField label={t('requests.arcLengthLabel')} value={arcLength} onChange={setArcLength}
        required minLength={2} maxLength={100} placeholder={t('requests.arcLengthPlaceholder')} />
      <FormTextField label={t('requests.checkInRhythmLabel')} value={checkInRhythm} onChange={setCheckInRhythm}
        maxLength={100} placeholder={t('requests.checkInRhythmPlaceholder')} />
      {formError && <p role="alert" className="text-sm text-red-400">{formError}</p>}
      <button type="submit" disabled={pending}
        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
        {pending ? t('requests.acceptPending') : t('requests.acceptButton')}
      </button>
    </form>
  );
}
