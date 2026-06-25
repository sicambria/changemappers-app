import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import type { GrowthModality } from '@/types/growth-hub';

export interface GrowthOfferCardProps {
  id: string;
  modality: GrowthModality;
  domain: string;
  description: string;
  createdAt: Date;
  creator: {
    id: string;
    name: string | null;
    displayName: string | null;
    profilePhoto: string | null;
    archetypes: string[];
  };
}

export function GrowthOfferCard({
  id,
  modality,
  domain,
  description,
  creator,
}: Readonly<GrowthOfferCardProps>) {
  const { t } = useTranslation('growth');

  const modalityColor: Record<GrowthModality, string> = {
    MENTOR: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    COACH: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    TRAINING: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    PEER: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  };

  const modalityRoute: Record<GrowthModality, string> = {
    MENTOR: 'mentor',
    COACH: 'coach',
    TRAINING: 'training',
    PEER: 'peer',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${modalityColor[modality]}`}
        >
          {t(`modality.${modality.toLowerCase()}`)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{domain}</span>
      </div>

      <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-2">
        {description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {creator.profilePhoto ? (
            <Image
              src={creator.profilePhoto}
              alt={creator.displayName || creator.name || ''}
              className="w-6 h-6 rounded-full object-cover"
              width={24}
              height={24}
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
              {(creator.displayName || creator.name || '?')[0].toUpperCase()}
            </div>
          )}
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {creator.displayName || creator.name}
          </span>
        </div>

        <Link
          href={`/${modalityRoute[modality]}/${id}`}
          className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          {t('actions.contact')}
        </Link>
      </div>
    </div>
  );
}
