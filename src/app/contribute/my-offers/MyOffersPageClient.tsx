'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface MyOffer {
  id: string;
  type: string;
  domain: string | null;
  format: string;
  availability: string | null;
}

interface MyOffersPageClientProps {
  offers: MyOffer[];
}

export default function MyOffersPageClient({ offers }: Readonly<MyOffersPageClientProps>) {
  const { t } = useTranslation('contribute');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-8">
          <h1 className="text-3xl font-bold text-white">{t('myOffers.title')}</h1>
          <Link
            href="/contribute/offer/new"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-4 py-2 transition-colors"
          >
            {t('myOffers.newOffer')}
          </Link>
        </div>

        {offers.length === 0 ? (
          <p className="text-slate-400">{t('myOffers.empty')}</p>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-1">
                      {t(`types.${offer.type}`)}
                    </h2>
                    <p className="text-sm text-slate-400">
                      {offer.domain ?? t('myOffers.noDomain')} · {offer.format}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/contribute/offer/${offer.id}/edit`}
                      className="rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 text-sm px-3 py-1.5 transition-colors"
                    >
                      {t('offer.edit')}
                    </Link>
                  </div>
                </div>
                {offer.availability && (
                  <p className="text-slate-300 text-sm mt-3 line-clamp-2">{offer.availability}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
