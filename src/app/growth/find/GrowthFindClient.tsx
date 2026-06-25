'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GrowthOfferCard, GrowthFilterClient } from '@/components/features/growth-hub';
import type { GrowthOfferCardProps } from '@/components/features/growth-hub/GrowthOfferCard';
import type { GrowthModality } from '@/types/growth-hub';

interface GrowthFindClientProps {
  initialOffers: GrowthOfferCardProps[];
}

export function GrowthFindClient({ initialOffers }: Readonly<GrowthFindClientProps>) {
  const { t } = useTranslation('growth');
  const [selectedModality, setSelectedModality] = useState<GrowthModality | undefined>();
  const [domainFilter, setDomainFilter] = useState('');

  const filteredOffers = initialOffers.filter((offer) => {
    if (selectedModality && offer.modality !== selectedModality) return false;
    if (domainFilter && !offer.domain.toLowerCase().includes(domainFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('tabs.find')}</h1>
      </div>

      <div className="space-y-6">
        <GrowthFilterClient
          selectedModality={selectedModality}
          onModalityChange={setSelectedModality}
          domainFilter={domainFilter}
          onDomainChange={setDomainFilter}
        />

        {filteredOffers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('empty.noOffers')}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredOffers.map((offer) => (
              <GrowthOfferCard key={`${offer.modality}-${offer.id}`} {...offer} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
