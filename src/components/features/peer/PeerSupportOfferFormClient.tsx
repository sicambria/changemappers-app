'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPeerSupportOfferAction } from '@/app/actions/peer';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { useTranslation } from 'react-i18next';

export default function PeerSupportOfferFormClient() {
  const router = useRouter();
  const { t } = useTranslation('peer');
  const [situationsNavigated, setSituationsNavigated] = useState('');
  const [format, setFormat] = useState('');
  const [capacity, setCapacity] = useState(1);
  const [boundaryStatement, setBoundaryStatement] = useState('');
  const [boundaryStatementTouched, setBoundaryStatementTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const { formError, setErrors, clearErrors, getFieldError } = useValidationErrors();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    clearErrors();
    setValidationError(null);

    const situations = situationsNavigated
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (situations.length === 0) {
      setValidationError(t('offerForm.minSituations'));
      setLoading(false);
      return;
    }

    const result = await createPeerSupportOfferAction({
      situationsNavigated: situations,
      format,
      capacity,
      boundaryStatement,
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
        ✓ {t('offerForm.success')}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-300">
          {t('offerForm.situationsNavigated')}
          <span className="text-slate-500 font-normal ml-1">{t('offerForm.onePerLine')}</span>
        </label>
        <textarea
          value={situationsNavigated}
          onChange={(e) => setSituationsNavigated(e.target.value)}
          required
          rows={5}
          placeholder={t('offerForm.situationsPlaceholder')}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <p className="text-xs text-slate-500">
          {t('offerForm.situationsHint')}
        </p>
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-300">{t('offerForm.format')}</label>
        <input
          type="text"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          required
          placeholder={t('offerForm.formatPlaceholder')}
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-300">
          {t('offerForm.capacity')} <span className="text-slate-500 font-normal">{t('offerForm.capacityHint')}</span>
        </label>
        <input
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(Number.parseInt(e.target.value, 10))}
          min={1}
          max={10}
          required
          className="w-32 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-300">{t('offerForm.boundaryStatement')}</label>
        <textarea
          value={boundaryStatement}
          onChange={(e) => setBoundaryStatement(e.target.value)}
          onBlur={() => setBoundaryStatementTouched(true)}
          required
          rows={3}
          placeholder={t('offerForm.boundaryPlaceholder')}
          className={`w-full bg-slate-800 border rounded-lg px-3 py-2 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 ${
            boundaryStatementTouched && boundaryStatement.length < 10
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-600 focus:ring-emerald-500'
          }`}
        />
        {boundaryStatementTouched && boundaryStatement.length < 10 && (
          <p className="text-xs text-red-400">{t('offerForm.minChars', { min: 10, count: boundaryStatement.length })}</p>
        )}
        <p className="text-xs text-slate-500">
          {t('offerForm.boundaryHint')}
        </p>
      </div>

      {validationError && (
        <p className="text-rose-400 text-sm">{validationError}</p>
      )}
      {formError && (
        <p className="text-rose-400 text-sm">{formError}</p>
      )}
      {getFieldError('situationsNavigated') && (
        <p className="text-xs text-red-400">{getFieldError('situationsNavigated')}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
      >
        {loading ? t('offerForm.publishing') : t('offerForm.publish')}
      </button>
    </form>
  );
}
