'use client';

import { useTranslation } from 'react-i18next';
import { XIcon } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SearchableFilter } from './SearchableFilter';
import {
  ALL_ARCHETYPES,
  RDG_OPTIONS,
  SKILLS_OPTIONS,
  OFFERS_OPTIONS,
  NEEDS_OPTIONS,
  VALUES_OPTIONS,
  AVAILABILITY_OPTIONS,
} from '@/lib/profile-options';
import { Z_CLASS } from '@/lib/z-index';

// Filters panel component
export function FiltersPanel({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onOpenDefinitions: _onOpenDefinitions
}: Readonly<{
  isOpen: boolean;
  onClose: () => void;
  filters: {
    radius: number;
    archetype: string[];
    changemakeLevel: string;
    communityType?: string;
    rdg: string[];
    availability: string[];
    skills: string[];
    values: string[];
    needs: string[];
    offers: string[];
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFilterChange: (key: string, value: any) => void;
  onOpenDefinitions: (term?: string) => void;
}>) {
  const { t } = useTranslation('map');
  const { language } = useLanguage();
  const mapLanguage = language;

  if (!isOpen) { return null; }

    // ... (options definitions remain the same) ...
    const radiusOptions = [
        { value: 5, label: t('filters.location.km5') },
        { value: 30, label: t('filters.location.km30') },
        { value: 100, label: t('filters.location.km100') },
        { value: 500, label: t('filters.location.km500') },
        { value: -1, label: t('filters.location.anywhere') },
    ];


	const communityTypeOptions = [
		{ value: '', label: t('filters.communityType.all') },
		{ value: 'NATURE_CONNECTED_ECO_HUB', label: t('filters.communityType.natureConnectedEcoHub') },
		{ value: 'HEALING_SANCTUARY', label: t('filters.communityType.healingSanctuary') },
		{ value: 'INCLUSIVE_SUPPORT_NETWORK', label: t('filters.communityType.inclusiveSupportNetwork') },
		{ value: 'CREATIVE_ARTS_COLONY', label: t('filters.communityType.creativeArtsColony') },
		{ value: 'EGALITARIAN_LIVING', label: t('filters.communityType.egalitarianLiving') },
		{ value: 'SPIRITUAL_HAVEN', label: t('filters.communityType.spiritualHaven') },
		{ value: 'KNOWLEDGE_HUB', label: t('filters.communityType.knowledgeHub') },
		{ value: 'NOMADIC_NETWORK', label: t('filters.communityType.nomadicNetwork') },
		{ value: 'REGENERATIVE_ECONOMIC', label: t('filters.communityType.regenerativeEconomic') },
		{ value: 'VISIONARY_MODEL_CITY', label: t('filters.communityType.visionaryModelCity') },
		{ value: 'EARTH_REGENERATION_CENTER', label: t('filters.communityType.earthRegenerationCenter') },
		{ value: 'FRONTLINE_ACTIVIST', label: t('filters.communityType.frontlineActivist') },
		{ value: 'OTHER', label: t('filters.communityType.other') },
	];

    const changemakeLevelOptions = [
        { value: '', label: t('filters.changemakeLevel.all') },
        { value: 'LEVEL_1', label: t('filters.changemakeLevel.level1') },
        { value: 'LEVEL_2', label: t('filters.changemakeLevel.level2') },
        { value: 'LEVEL_3', label: t('filters.changemakeLevel.level3') },
        { value: 'LEVEL_4', label: t('filters.changemakeLevel.level4') },
        { value: 'LEVEL_5', label: t('filters.changemakeLevel.level5') },
        { value: 'LEVEL_6', label: t('filters.changemakeLevel.level6') },
        { value: 'LEVEL_7', label: t('filters.changemakeLevel.level7') },
        { value: 'LEVEL_8', label: t('filters.changemakeLevel.level8') },
        { value: 'LEVEL_9', label: t('filters.changemakeLevel.level9') },
    ];

  return (
    <Card className={`absolute left-4 top-16 md:top-4 ${Z_CLASS.mapOverlay} w-72 shadow-lg top-[60px] max-h-[calc(100vh-120px)] overflow-y-auto`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('filters.title')}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Radius filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('filters.location.title')}
            </label>
            <select
              value={filters.radius}
              onChange={(e) => onFilterChange('radius', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              {radiusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Community Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('filters.communityType.title')}
            </label>
            <select
              value={filters.communityType || ''}
              onChange={(e) => onFilterChange('communityType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              {communityTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Changemaker Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('filters.changemakeLevel.title')}
            </label>
            <select
              value={filters.changemakeLevel}
              onChange={(e) => onFilterChange('changemakeLevel', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              {changemakeLevelOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Archetype Filter */}
          <SearchableFilter
            label={t('filters.archetype.title')}
            options={ALL_ARCHETYPES.map(a => ({ value: a.value, label: a.label, labelHu: a.labelHu }))}
            value={filters.archetype}
            onChange={(val) => onFilterChange('archetype', val)}
            placeholder={t('filters.archetype.placeholder')}
            searchPlaceholder={t('filters.search')}
            language={mapLanguage}
          />

          {/* RDG Filter */}
          <SearchableFilter
            label={t('filters.rdg.title')}
            options={RDG_OPTIONS.map(r => ({ value: r.value, label: r.label, labelHu: r.labelHu }))}
            value={filters.rdg}
            onChange={(val) => onFilterChange('rdg', val)}
            placeholder={t('filters.rdg.placeholder')}
            searchPlaceholder={t('filters.search')}
            language={mapLanguage}
          />

          {/* Skills Filter */}
          <SearchableFilter
            label={t('filters.skills.title')}
            options={SKILLS_OPTIONS.map(s => ({ value: s, label: s }))}
            value={filters.skills}
            onChange={(val) => onFilterChange('skills', val)}
            placeholder={t('filters.skills.placeholder')}
            searchPlaceholder={t('filters.search')}
            language={mapLanguage}
          />

          {/* Values Filter */}
          <SearchableFilter
            label={t('filters.values.title')}
            options={VALUES_OPTIONS.map(v => ({ value: v, label: v }))}
            value={filters.values}
            onChange={(val) => onFilterChange('values', val)}
            placeholder={t('filters.values.placeholder')}
            searchPlaceholder={t('filters.search')}
            language={mapLanguage}
          />

          {/* Needs Filter */}
          <SearchableFilter
            label={t('filters.needs.title')}
            options={NEEDS_OPTIONS.map(n => ({ value: n, label: n }))}
            value={filters.needs}
            onChange={(val) => onFilterChange('needs', val)}
            placeholder={t('filters.needs.placeholder')}
            searchPlaceholder={t('filters.search')}
            language={mapLanguage}
          />

          {/* Offers Filter */}
          <SearchableFilter
            label={t('filters.offers.title')}
            options={OFFERS_OPTIONS.map(o => ({ value: o, label: o }))}
            value={filters.offers}
            onChange={(val) => onFilterChange('offers', val)}
            placeholder={t('filters.offers.placeholder')}
            searchPlaceholder={t('filters.search')}
            language={mapLanguage}
          />

          {/* Availability Filter */}
          <SearchableFilter
            label={t('filters.availability.title')}
            options={AVAILABILITY_OPTIONS.map(a => ({ value: a.value, label: a.label, labelHu: a.labelHu, labelEs: a.labelEs }))}
            value={filters.availability}
            onChange={(val) => onFilterChange('availability', val)}
            placeholder={t('filters.availability.placeholder')}
            searchPlaceholder={t('filters.search')}
            language={mapLanguage}
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onFilterChange('radius', 100);
            onFilterChange('archetype', []);
            onFilterChange('changemakeLevel', '');
            onFilterChange('communityType', '');
            onFilterChange('rdg', []);
            onFilterChange('availability', []);
            onFilterChange('skills', []);
            onFilterChange('values', []);
            onFilterChange('needs', []);
            onFilterChange('offers', []);
          }}
          className="w-full"
        >
          {t('filters.clear')}
        </Button>
      </div>
    </Card>
  );
}
