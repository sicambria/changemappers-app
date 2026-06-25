'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPeerSupportRequestAction } from '@/app/actions/peer';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { useTranslation } from 'react-i18next';

export default function PeerSupportRequestFormClient() {
  const router = useRouter();
  const { t } = useTranslation('peer');
  const [situationType, setSituationType] = useState('');
  const [whatSupportLooks, setWhatSupportLooks] = useState('');
  const [whatSupportLooksTouched, setWhatSupportLooksTouched] = useState(false);
  const [whatNotLooking, setWhatNotLooking] = useState('');
  const [whatNotLookingTouched, setWhatNotLookingTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const { formError, setErrors, clearErrors, getFieldError } = useValidationErrors();
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    clearErrors();

    const result = await createPeerSupportRequestAction({
      situationType,
      whatSupportLooks,
      whatNotLooking,
    });

    setLoading(false);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push('/peer/find'), 1200);
    } else {
      setErrors(result);
    }
  }

  if (success) {
    return (
      <div className="bg-emerald-950 border border-emerald-700 rounded-xl p-6 text-emerald-300">
        ✓ {t('requestForm.success')}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-300">{t('requestForm.situationType')}</label>
        <input
          type="text"
          value={situationType}
          onChange={(e) => setSituationType(e.target.value)}
          required
          placeholder={t('requestForm.situationPlaceholder')}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-300">{t('requestForm.whatSupportLooks')}</label>
        <textarea
          value={whatSupportLooks}
          onChange={(e) => setWhatSupportLooks(e.target.value)}
          onBlur={() => setWhatSupportLooksTouched(true)}
          required
          rows={4}
          placeholder={t('requestForm.whatSupportPlaceholder')}
          className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
            whatSupportLooksTouched && whatSupportLooks.length < 10
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-600 focus:ring-emerald-500'
          }`}
        />
        {whatSupportLooksTouched && whatSupportLooks.length < 10 && (
          <p className="text-xs text-red-400">{t('requestForm.minChars', { min: 10, count: whatSupportLooks.length })}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-300">{t('requestForm.whatNotLooking')}</label>
        <textarea
          value={whatNotLooking}
          onChange={(e) => setWhatNotLooking(e.target.value)}
          onBlur={() => setWhatNotLookingTouched(true)}
          required
          rows={3}
          placeholder={t('requestForm.whatNotLookingPlaceholder')}
          className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
            whatNotLookingTouched && whatNotLooking.length < 10
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-600 focus:ring-emerald-500'
          }`}
        />
        {whatNotLookingTouched && whatNotLooking.length < 10 && (
          <p className="text-xs text-red-400">{t('requestForm.minChars', { min: 10, count: whatNotLooking.length })}</p>
        )}
        <p className="text-xs text-slate-500">
          {t('requestForm.whatNotLookingHint')}
        </p>
      </div>

      {formError && (
        <p className="text-rose-400 text-sm">{formError}</p>
      )}
      {getFieldError('situationType') && (
        <p className="text-xs text-red-400">{getFieldError('situationType')}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
      >
        {loading ? t('requestForm.submitting') : t('requestForm.submit')}
      </button>
    </form>
  );
}
