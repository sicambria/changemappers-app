'use client';

import TrainingOfferFormClient from '@/components/features/training/TrainingOfferFormClient';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Offer {
  id: string;
  domain: string;
  format: string;
  level: string;
  description: string | null;
  isSync: boolean;
  isGroupFormat: boolean;
  timeCommitment: string | null;
  capacity: number | null;
}

interface EditTrainingOfferClientProps {
  id: string;
  offer: Offer;
}

export default function EditTrainingOfferClient({ id, offer }: Readonly<EditTrainingOfferClientProps>) {
  const { t } = useTranslation('training');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href={`/training/offer/${id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-8 transition-colors"
        >
          ← Back to offer
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('editOffer')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('updateDetails')}.</p>
        </div>

        <TrainingOfferFormClient
          isEdit
          id={id}
initialData={{
        domain: offer.domain,
        format: offer.format as 'WORKSHOP' | 'COURSE' | 'DEMO' | 'RESOURCE' | 'GUIDED_PRACTICE',
        level: offer.level as 'EXPLORER' | 'PRACTITIONER' | 'GUIDE',
        description: offer.description ?? undefined,
        isSync: offer.isSync,
        isGroupFormat: offer.isGroupFormat,
        timeCommitment: offer.timeCommitment ?? undefined,
        capacity: offer.capacity ?? undefined,
      }}
        />
      </div>
    </div>
  );
}
