'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

type Props = {
  profile: {
    id: string;
    domain: string;
    yearsExperience: number;
    whatCanOffer: string;
    arcLengthPreference: string;
    isArchived: boolean;
    user: { id: string; name: string | null; displayName: string | null; profilePhoto: string | null };
  };
};

export default function MentorProfileCard({ profile }: Readonly<Props>) {
  const { t } = useTranslation('mentor');
  const displayName = profile.user.displayName ?? profile.user.name ?? 'Unknown';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div
      className={`bg-slate-900 border border-slate-700 rounded-xl p-5 transition hover:border-slate-600 ${
        profile.isArchived ? 'opacity-60' : ''
      }`}
    >
      {profile.isArchived && (
        <span className="mb-3 inline-block rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-400">
          Archived
        </span>
      )}

      <div className="mb-3 flex items-center gap-3">
        {profile.user.profilePhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.user.profilePhoto}
            alt={displayName}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-medium text-slate-300">
            {initial}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-slate-100">{displayName}</p>
          <p className="text-xs text-slate-400">{profile.yearsExperience} yrs experience</p>
        </div>
      </div>

      <h3 className="mb-2 text-base font-semibold text-slate-100">{profile.domain}</h3>

      <p className="mb-3 line-clamp-2 text-sm text-slate-400">{profile.whatCanOffer}</p>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400">
          {t('card.arcLabel', { arc: profile.arcLengthPreference })}
        </span>
      </div>

      <div className="flex justify-end">
        <Link
          href={`/mentor/offer/${profile.id}`}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition ${
            profile.isArchived
              ? 'cursor-not-allowed bg-slate-700 text-slate-400'
              : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
          aria-disabled={profile.isArchived}
        >
          {t('card.viewProfile')}
        </Link>
      </div>
    </div>
  );
}
