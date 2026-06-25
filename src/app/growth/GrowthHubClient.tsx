'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { GrowthTabsClient, GrowthOfferCard, GrowthFilterClient, GrowthOfferFormClient } from '@/components/features/growth-hub';
import type { GrowthTab } from '@/components/features/growth-hub/GrowthTabsClient';
import { ConnectNatureClient } from '@/components/features/connect-nature/ConnectNatureClient';
import type { GrowthOfferCardProps } from '@/components/features/growth-hub/GrowthOfferCard';
import type { GrowthModality } from '@/types/growth-hub';

interface GrowthHubClientProps {
  initialOffers: GrowthOfferCardProps[];
}

export function GrowthHubClient({ initialOffers }: Readonly<GrowthHubClientProps>) {
  const { t } = useTranslation('growth');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<GrowthTab>('find');
  const [selectedModality, setSelectedModality] = useState<GrowthModality | undefined>();
  const [domainFilter, setDomainFilter] = useState('');

  // The hub's "My offers"/"Connections" tabs previously hardcoded empty
  // placeholders that never fetched — the real data lives on the dedicated
  // /growth/my-offers and /growth/connections pages. Route there instead of
  // showing a misleading empty state (AUDIT-20260613-024).
  const handleTabChange = (tab: GrowthTab) => {
    if (tab === 'myOffers') {
      router.push('/growth/my-offers');
      return;
    }
    if (tab === 'connections') {
      router.push('/growth/connections');
      return;
    }
    setActiveTab(tab);
  };

  const filteredOffers = initialOffers.filter((offer) => {
    if (selectedModality && offer.modality !== selectedModality) return false;
    if (domainFilter && !offer.domain.toLowerCase().includes(domainFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('subtitle')}</p>
      </div>

      <GrowthTabsClient activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === 'find' && (
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
      )}

      {activeTab === 'offer' && (
        <GrowthOfferFormClient />
      )}

      {/* 'myOffers' and 'connections' tabs navigate to their dedicated pages
          (see handleTabChange) — they no longer render inert empty states. */}

      {activeTab === 'nature' && (
        <ConnectNatureClient />
      )}
    </div>
  );
}
