'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface EditCoachingOfferClientProps {
  id: string;
}

export function EditCoachingOfferClient({ id }: Readonly<EditCoachingOfferClientProps>) {
  const { t } = useTranslation('coaching');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href={`/coach/offer/${id}`}
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-8 transition-colors"
        >
          {t('offer.backToOffer')}
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('offer.editPageTitle')}</h1>
          <p className="text-slate-400">{t('offer.editPageDescription')}</p>
        </div>
      </div>
    </div>
  );
}
