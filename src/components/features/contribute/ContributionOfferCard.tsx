'use client';

import { useTranslation } from 'react-i18next';

const TYPE_COLORS: Record<string, string> = {
  SKILL_OFFERING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ACCOMPANIMENT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  KNOWLEDGE_COMMONS: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  HOLDING_SPACE: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

interface ContributionOfferCardProps {
  offer: {
    id: string;
    type: string;
    domain?: string | null;
    timeCommitment: string;
    format: string;
    offerer: {
      name: string;
      displayName?: string | null;
      profilePhoto?: string | null;
    };
  };
}

export default function ContributionOfferCard({ offer }: Readonly<ContributionOfferCardProps>) {
  const { t } = useTranslation('contribute');
  const displayName = offer.offerer.displayName ?? offer.offerer.name;
  const typeColor = TYPE_COLORS[offer.type] ?? 'bg-gray-100 text-gray-800';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColor}`}>
          {t(`offerCard.typeLabels.${offer.type}`, { defaultValue: offer.type })}
        </span>
      </div>

      {offer.domain && (
        <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-gray-100">
          {offer.domain}
        </h3>
      )}

      <div className="mb-3 space-y-1">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">{t('offerCard.formatLabel')}</span> {offer.format}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">{t('offerCard.timeLabel')}</span> {offer.timeCommitment}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {offer.offerer.profilePhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={offer.offerer.profilePhoto}
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
    </div>
  );
}
