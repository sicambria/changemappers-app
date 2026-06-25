'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

interface Profile {
  id: string;
  domain: string | null;
  yearsExperience: number;
  whatCanOffer: string | null;
  user: {
    name: string | null;
    displayName: string | null;
    profilePhoto: string | null;
  };
}

interface FindMentorClientProps {
  profiles: Profile[];
}

export default function FindMentorClient({ profiles }: Readonly<FindMentorClientProps>) {
  const { t } = useTranslation('mentor');

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('findMentor')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Browse mentors who are currently available to support your journey.
        </p>

        {profiles.length === 0 && (
          <p className="text-gray-400 dark:text-gray-500 text-center py-16">
            {t('noMentorsAvailable')}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {profiles.map((profile) => {
            const displayName = profile.user.displayName ?? profile.user.name ?? 'Anonymous';
            return (
              <Link
                key={profile.id}
                href={`/mentor/offer/${profile.id}`}
                className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-5 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  {profile.user.profilePhoto ? (
                    <Image
                      src={profile.user.profilePhoto}
                      alt={displayName}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium text-gray-900 dark:text-gray-100">{displayName}</span>
                </div>

                {profile.domain && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wide mb-1">
                    {profile.domain}
                  </p>
                )}

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {profile.yearsExperience} {t('yearsExperience')}
                </p>

                {profile.whatCanOffer && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {profile.whatCanOffer}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
