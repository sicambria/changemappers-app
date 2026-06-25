'use client';

import { useTranslation } from 'react-i18next';

export type GrowthTab = 'find' | 'offer' | 'myOffers' | 'connections' | 'nature';

interface GrowthTabsClientProps {
  activeTab: GrowthTab;
  onTabChange: (tab: GrowthTab) => void;
}

export function GrowthTabsClient({ activeTab, onTabChange }: Readonly<GrowthTabsClientProps>) {
  const { t } = useTranslation('growth');

  const tabs: Array<{ key: typeof activeTab; label: string }> = [
    { key: 'find', label: t('tabs.find') },
    { key: 'offer', label: t('tabs.offer') },
    { key: 'myOffers', label: t('tabs.myOffers') },
    { key: 'connections', label: t('tabs.connections') },
    { key: 'nature', label: t('tabs.nature') },
  ];

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto scrollbar-none">
      <nav className="flex -mb-px min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
