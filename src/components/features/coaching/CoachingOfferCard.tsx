'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

type Props = {
  offer: {
    id: string;
    style: string;
    format: string;
    arcLengthOption: string;
    availability: string;
    coacheeKnow: string;
    isArchived: boolean;
    coach: {
      id: string;
      name: string | null;
      displayName: string | null;
      profilePhoto: string | null;
      archetypes: string[];
    };
    _count: { engagements: number };
  };
};

export default function CoachingOfferCard({ offer }: Readonly<Props>) {
  const { t } = useTranslation('coaching');
  const displayName = offer.coach.displayName ?? offer.coach.name ?? 'Unknown';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div
      className={`bg-slate-900 border border-slate-700 rounded-xl p-5 transition hover:border-slate-600 ${
        offer.isArchived ? 'opacity-60' : ''
      }`}
    >
      {offer.isArchived && (
        <span className="mb-3 inline-block rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-400">
          Archived
        </span>
      )}

      <div className="mb-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
          {offer.style}
        </span>
        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
          {offer.format}
        </span>
        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
          {offer.arcLengthOption}
        </span>
      </div>

      <p className="mb-4 text-xs text-slate-500">
        {t('card.availabilityLabel', { availability: offer.availability })}
      </p>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {offer.coach.profilePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={offer.coach.profilePhoto}
              alt={displayName}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-700 text-xs font-medium text-slate-300">
              {initial}
            </div>
          )}
          <span className="text-sm text-slate-300">{displayName}</span>
        </div>
        <span className="text-xs text-slate-500">
          {offer._count.engagements} engaged
        </span>
      </div>

      <div className="flex justify-end">
        <Link
          href={`/coach/offer/${offer.id}`}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
            offer.isArchived
              ? 'cursor-not-allowed bg-slate-700 text-slate-400'
              : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
          aria-disabled={offer.isArchived}
        >
          {t('card.viewOffer')}
        </Link>
      </div>
    </div>
  );
}
