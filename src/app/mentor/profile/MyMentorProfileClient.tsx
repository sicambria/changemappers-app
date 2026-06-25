'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArchiveOfferButton } from '@/components/features/growth-hub/ArchiveOfferButton';

interface Profile {
  id: string;
  domain: string;
  yearsExperience: number;
  whatCanOffer: string | null;
  arcLengthPreference: string;
  maxConcurrent: number;
}

interface MyMentorProfileClientProps {
  profile: Profile | null;
}

export default function MyMentorProfileClient({ profile }: Readonly<MyMentorProfileClientProps>) {
  const { t } = useTranslation('mentor');

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('myMentorProfile')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You do not have a mentor profile yet. Create one to start mentoring.
          </p>
          <Link
            href="/mentor/offer/new"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium px-5 py-2.5 transition-colors"
          >
            {t('createMentorProfile')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{t('myMentorProfile')}</h1>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{profile.domain}</h2>

          <div className="flex flex-wrap gap-2 mb-6">
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 text-sm px-3 py-1">
              {profile.yearsExperience} years experience
            </span>
            <span className="inline-flex items-center rounded-full border border-emerald-700/40 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-700 dark:text-emerald-300 text-sm px-3 py-1">
              {profile.arcLengthPreference}
            </span>
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 text-sm px-3 py-1">
              {t('maxConcurrent')} {profile.maxConcurrent}
            </span>
          </div>

          {profile.whatCanOffer && (
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {profile.whatCanOffer}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={`/mentor/offer/${profile.id}/edit`}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium px-5 py-2.5 transition-colors"
          >
            {t('profile.edit')}
          </Link>
          <ArchiveOfferButton modality="MENTOR" offerId={profile.id} />
        </div>
      </div>
    </div>
  );
}
