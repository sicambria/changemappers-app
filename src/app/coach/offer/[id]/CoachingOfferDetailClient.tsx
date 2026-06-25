'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface CoachingOfferDetailClientProps {
  id: string;
  offer: {
    style: string;
    format: string;
    arcLengthOption: string;
    coacheeKnow: string | null;
    coach: {
      displayName: string | null;
      name: string | null;
      profilePhoto: string | null;
    };
  };
}

export function CoachingOfferDetailClient({ id, offer }: Readonly<CoachingOfferDetailClientProps>) {
  const { t } = useTranslation('coaching');

  const coachName = offer.coach.displayName || offer.coach.name || t('anonymous');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/coach/find"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-8 transition-colors"
        >
          {t('offer.backToOffers')}
        </Link>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 mb-6">
          <h1 className="text-2xl font-bold text-white mb-4">{t('offer.detail.title')}</h1>

          <div className="flex flex-wrap gap-2 mb-6">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-slate-800/60 text-slate-300 text-sm px-3 py-1">
              {offer.style}
            </span>
            <span className="inline-flex items-center rounded-full border border-emerald-700/40 bg-emerald-900/40 text-emerald-300 text-sm px-3 py-1">
              {offer.format}
            </span>
            <span className="inline-flex items-center rounded-full border border-white/10 bg-slate-800/60 text-slate-400 text-sm px-3 py-1">
              {offer.arcLengthOption}
            </span>
          </div>

          {offer.coacheeKnow && (
            <p className="text-slate-300 leading-relaxed mb-8 whitespace-pre-wrap">
              {offer.coacheeKnow}
            </p>
          )}

          <div className="flex items-center gap-3 pt-6 border-t border-white/10">
            {offer.coach.profilePhoto ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={offer.coach.profilePhoto}
                alt={coachName}
                width={40}
                height={40}
                className="rounded-full object-cover shrink-0 w-10 h-10"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-800/60 flex items-center justify-center shrink-0">
                <span className="text-sm font-semibold text-emerald-300">
                  {coachName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-white">{coachName}</p>
              <p className="text-xs text-slate-500">{t('offer.detail.coach')}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/coach/offer/${id}/edit`}
            className="rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium px-5 py-2.5 transition-colors"
          >
            {t('offer.editButton')}
          </Link>
        </div>
      </div>
    </div>
  );
}
