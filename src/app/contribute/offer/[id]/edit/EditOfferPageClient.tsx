'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import ContributionOfferFormClient from '@/components/features/contribute/ContributionOfferFormClient';
import type { CreateContributionOfferInput } from '@/lib/validations/contribute';

interface EditOfferPageClientProps {
  id: string;
  initialData: Partial<CreateContributionOfferInput>;
}

export default function EditOfferPageClient({ id, initialData }: Readonly<EditOfferPageClientProps>) {
  const { t } = useTranslation('contribute');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href={`/contribute/offer/${id}`}
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-8 transition-colors"
        >
          ← {t('detailOffer.backToOffers')}
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('editOffer.title')}</h1>
          <p className="text-slate-400">{t('editOffer.subtitle')}</p>
        </div>

        <ContributionOfferFormClient
          isEdit
          id={id}
          initialData={initialData}
        />
      </div>
    </div>
  );
}
