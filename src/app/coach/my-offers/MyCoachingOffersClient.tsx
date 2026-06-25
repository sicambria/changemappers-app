'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArchiveOfferButton } from '@/components/features/growth-hub/ArchiveOfferButton';

interface CoachOffer {
  id: string;
  style: string;
  format: string;
  arcLengthOption: string;
  coacheeKnow: string | null;
}

interface MyCoachingOffersClientProps {
  offers: CoachOffer[];
}

export function MyCoachingOffersClient({ offers }: Readonly<MyCoachingOffersClientProps>) {
  const { t } = useTranslation('coaching');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">{t('offer.myOffers.title')}</h1>
          <Link
            href="/coach/offer/new"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 transition-colors"
          >
            {t('offer.new')}
          </Link>
        </div>

        {offers.length === 0 ? (
          <p className="text-slate-400">{t('offer.myOffers.empty')}</p>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-1">{offer.style}</h2>
                    <p className="text-sm text-slate-400">
                      {offer.format} · {offer.arcLengthOption}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/coach/offer/${offer.id}/edit`}
                      className="rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 text-sm px-3 py-1.5 transition-colors"
                    >
                      {t('offer.edit')}
                    </Link>
                    <ArchiveOfferButton modality="COACH" offerId={offer.id} />
                  </div>
                </div>
                {offer.coacheeKnow && (
                  <p className="text-slate-300 text-sm mt-3 line-clamp-2">{offer.coacheeKnow}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
