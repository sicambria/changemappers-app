'use client';

import Link from 'next/link';

interface TrainingOfferCardProps {
  offer: {
    id: string;
    domain: string;
    format: string;
    level: string;
    description: string;
    creator: {
      name: string;
      displayName?: string | null;
      profilePhoto?: string | null;
    };
    _count: {
      engagements: number;
    };
  };
}

const FORMAT_LABELS: Record<string, string> = {
  WORKSHOP: 'Workshop',
  COURSE: 'Course',
  DEMO: 'Demo',
  RESOURCE: 'Resource',
  GUIDED_PRACTICE: 'Guided Practice',
};

const LEVEL_COLORS: Record<string, string> = {
  BEGINNER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  PARTIAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ADVANCED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function TrainingOfferCard({ offer }: Readonly<TrainingOfferCardProps>) {
  const displayName = offer.creator.displayName ?? offer.creator.name;
  const levelColor = LEVEL_COLORS[offer.level] ?? 'bg-gray-100 text-gray-800';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {offer.domain}
      </h3>

      <div className="mb-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          {FORMAT_LABELS[offer.format] ?? offer.format}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${levelColor}`}>
          {offer.level.charAt(0) + offer.level.slice(1).toLowerCase()}
        </span>
      </div>

      <p className="mb-4 line-clamp-3 text-sm text-gray-600 dark:text-gray-400">
        {offer.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {offer.creator.profilePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={offer.creator.profilePhoto}
              alt={displayName}
              className="h-6 w-6 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm text-gray-600 dark:text-gray-400">{displayName}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {offer._count.engagements} engaged
          </span>
          <Link
            href={`/training/offer/${offer.id}`}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Connect
          </Link>
        </div>
      </div>
    </div>
  );
}
