'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import PitchCard from '@/components/features/pitch/PitchCard';

type PitchItem = {
  id: string;
  name: string;
  summary: string;
  location: string;
  stage: string;
  needsFunding: boolean;
  needsPartners: boolean;
  needsVolunteers: boolean;
  needsSkills: string[];
  author: { name: string; displayName: string | null; profilePhoto: string | null };
  rdgTags: Array<{ rdg: { key: string; label: string; labelHu: string | null } }>;
  _count: { endorsements: number };
};

type BrowseResult = { success: true; data: PitchItem[] } | { success: false; error?: string };

export default function PitchBrowseClient({ result }: Readonly<{ result: BrowseResult }>) {
  const { t, i18n } = useTranslation('pitch');

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('browse.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('browse.subtitle')}
            </p>
          </div>
          <Link
            href="/pitch/new"
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
          >
            {t('browse.newPitch')}
          </Link>
        </div>

        {result.success && result.data.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {result.data.map((pitch) => (
              <PitchCard key={pitch.id} pitch={pitch} language={i18n.language as 'hu' | 'en' | 'es'} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {result.success ? t('browse.empty') : t('browse.error')}
            </p>
            <Link
              href="/pitch/new"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
            >
              {t('browse.createNew')}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
