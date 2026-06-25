'use client';

import MentorProfileFormClient from '@/components/features/mentor/MentorProfileFormClient';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Profile {
  id: string;
  domain: string;
  yearsExperience: number;
  whatCanOffer: string | null;
  arcLengthPreference: string;
  maxConcurrent: number;
}

interface EditMentorProfileClientProps {
  id: string;
  profile: Profile;
}

export default function EditMentorProfileClient({ id, profile }: Readonly<EditMentorProfileClientProps>) {
  const { t } = useTranslation('mentor');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href={`/mentor/offer/${id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-8 transition-colors"
        >
          ← Back to profile
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('editMentorProfile')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('updateMentoringDetails')}.</p>
        </div>

        <MentorProfileFormClient
          isEdit
          id={id}
initialData={{
        domain: profile.domain,
        yearsExperience: profile.yearsExperience,
        whatCanOffer: profile.whatCanOffer ?? undefined,
        arcLengthPreference: profile.arcLengthPreference,
        maxConcurrent: profile.maxConcurrent,
      }}
        />
      </div>
    </div>
  );
}
