'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { RadioIcon, PlusIcon, MapPinIcon, SlidersHorizontalIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getWeakSignals } from '@/app/actions/weak-signal';
import { SearchableFilter } from '@/components/map/SearchableFilter';
import type { FilterOption } from '@/components/map/SearchableFilter';
import type { WeakSignal, SignalDomain, SignalScale, SignalConfidence, SignalNovelty, SignalSourceType, VerificationLevel } from '@/types/weak-signal';

type SortOption = 'newest' | 'resonated' | 'relevance';

const DOMAIN_OPTIONS: SignalDomain[] = [
  'EDUCATION', 'GOVERNANCE', 'FOOD', 'TECHNOLOGY', 'HEALTH',
  'ECONOMY', 'ECOLOGY', 'CULTURE', 'ENERGY', 'HOUSING',
  'TRANSPORT', 'MEDIA', 'JUSTICE', 'FINANCE', 'OTHER',
];

const SCALE_OPTIONS: SignalScale[] = ['INDIVIDUAL', 'COMMUNITY', 'INSTITUTIONAL', 'ECOSYSTEM'];
const CONFIDENCE_OPTIONS: SignalConfidence[] = ['LOW', 'MEDIUM', 'HIGH'];
const NOVELTY_OPTIONS: SignalNovelty[] = ['COMMON', 'UNCOMMON', 'RARE', 'NOVEL'];
const SOURCE_TYPE_OPTIONS: SignalSourceType[] = ['FIRSTHAND', 'SECONDHAND', 'NEWS', 'ACADEMIC', 'SOCIAL_MEDIA', 'OTHER'];
const VERIFICATION_OPTIONS: VerificationLevel[] = ['SELF_DECLARED', 'PEER_VOUCHED', 'COMMUNITY_VERIFIED', 'ADMIN_VERIFIED'];

const primaryCreateLinkStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500';
const primaryCreateLinkSmStyles = `${primaryCreateLinkStyles} px-3 py-1.5 text-sm gap-1.5`;
const primaryCreateLinkMdStyles = `${primaryCreateLinkStyles} px-4 py-2 text-sm gap-2`;
function getDomainColor(domain: SignalDomain): string {
  const colors: Record<string, string> = {
    EDUCATION: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    GOVERNANCE: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    FOOD: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    TECHNOLOGY: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    HEALTH: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    ECONOMY: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    ECOLOGY: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    CULTURE: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    ENERGY: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    HOUSING: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    TRANSPORT: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    MEDIA: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    JUSTICE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    FINANCE: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };
  return colors[domain] || colors.OTHER;
}

function getConfidenceColor(confidence: SignalConfidence): string {
  switch (confidence) {
    case 'HIGH':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'LOW':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getNoveltyColor(novelty: SignalNovelty): string {
  switch (novelty) {
    case 'NOVEL':
      return 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200';
    case 'RARE':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
    case 'UNCOMMON':
      return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
    case 'COMMON':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function countActiveFilters(state: {
  selectedDomain: string[];
  selectedScale: string[];
  selectedConfidence: string[];
  selectedNovelty: string[];
  selectedSourceType: string[];
  selectedVerification: string[];
  hasLocation: boolean;
  relevanceMin: string;
  relevanceMax: string;
}): number {
  let count = 0;
  if (state.selectedDomain.length > 0) count += state.selectedDomain.length;
  if (state.selectedScale.length > 0) count += state.selectedScale.length;
  if (state.selectedConfidence.length > 0) count += state.selectedConfidence.length;
  if (state.selectedNovelty.length > 0) count += state.selectedNovelty.length;
  if (state.selectedSourceType.length > 0) count += state.selectedSourceType.length;
  if (state.selectedVerification.length > 0) count += state.selectedVerification.length;
  if (state.hasLocation) count += 1;
  if (state.relevanceMin !== '') count += 1;
  if (state.relevanceMax !== '') count += 1;
  return count;
}

export function SignalsList() {
  const { t } = useTranslation('signals');
  const [signals, setSignals] = useState<WeakSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [selectedDomain, setSelectedDomain] = useState<string[]>([]);
  const [selectedScale, setSelectedScale] = useState<string[]>([]);
  const [selectedConfidence, setSelectedConfidence] = useState<string[]>([]);
  const [selectedNovelty, setSelectedNovelty] = useState<string[]>([]);
  const [selectedSourceType, setSelectedSourceType] = useState<string[]>([]);
  const [selectedVerification, setSelectedVerification] = useState<string[]>([]);
  const [hasLocation, setHasLocation] = useState(false);
  const [relevanceMin, setRelevanceMin] = useState('');
  const [relevanceMax, setRelevanceMax] = useState('');

  const activeFilterCount = countActiveFilters({
    selectedDomain, selectedScale, selectedConfidence, selectedNovelty,
    selectedSourceType, selectedVerification, hasLocation, relevanceMin, relevanceMax,
  });

  const clearAllFilters = useCallback(() => {
    setSelectedDomain([]);
    setSelectedScale([]);
    setSelectedConfidence([]);
    setSelectedNovelty([]);
    setSelectedSourceType([]);
    setSelectedVerification([]);
    setHasLocation(false);
    setRelevanceMin('');
    setRelevanceMax('');
  }, []);

  useEffect(() => {
    async function loadSignals() {
      setIsLoading(true);
      const result = await getWeakSignals({
        domain: selectedDomain.length === 1 ? (selectedDomain[0] as SignalDomain) : undefined,
        scale: selectedScale.length === 1 ? (selectedScale[0] as SignalScale) : undefined,
        confidence: selectedConfidence.length === 1 ? (selectedConfidence[0] as SignalConfidence) : undefined,
        novelty: selectedNovelty.length === 1 ? (selectedNovelty[0] as SignalNovelty) : undefined,
        sourceType: selectedSourceType.length === 1 ? (selectedSourceType[0] as SignalSourceType) : undefined,
        verificationLevel: selectedVerification.length === 1 ? (selectedVerification[0] as VerificationLevel) : undefined,
        hasLocation: hasLocation || undefined,
        regenerativeRelevanceMin: relevanceMin !== '' ? Number(relevanceMin) : undefined,
        regenerativeRelevanceMax: relevanceMax !== '' ? Number(relevanceMax) : undefined,
        search: searchQuery || undefined,
      });
      if (result.success && result.data) {
        const sorted = [...result.data];
        if (sortBy === 'resonated') {
          sorted.sort((a, b) => (b.resonatesCount ?? 0) - (a.resonatesCount ?? 0));
        } else if (sortBy === 'relevance') {
          sorted.sort((a, b) => (b.regenerativeRelevance ?? 0) - (a.regenerativeRelevance ?? 0));
        }
        setSignals(sorted);
      }
      setIsLoading(false);
    }
    loadSignals();
  }, [searchQuery, selectedDomain, selectedScale, selectedConfidence, selectedNovelty,
      selectedSourceType, selectedVerification, hasLocation, relevanceMin, relevanceMax, sortBy]);

  const domainOptions: FilterOption[] = DOMAIN_OPTIONS.map((d) => ({
    value: d,
    label: t(`domains.${d}`),
  }));

  const scaleOptions: FilterOption[] = SCALE_OPTIONS.map((s) => ({
    value: s,
    label: t(`scale.${s}`),
  }));

  const confidenceOptions: FilterOption[] = CONFIDENCE_OPTIONS.map((c) => ({
    value: c,
    label: t(`confidence.${c}`),
  }));

  const noveltyOptions: FilterOption[] = NOVELTY_OPTIONS.map((n) => ({
    value: n,
    label: t(`novelty.${n}`),
  }));

  const sourceTypeOptions: FilterOption[] = SOURCE_TYPE_OPTIONS.map((s) => ({
    value: s,
    label: t(`sourceType.${s}`),
  }));

  const verificationOptions: FilterOption[] = VERIFICATION_OPTIONS.map((v) => ({
    value: v,
    label: t(`verification.${v}`),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={sortBy === 'newest' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSortBy('newest')}
          >
            {t('filters.sortNewest')}
          </Button>
          <Button
            variant={sortBy === 'resonated' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSortBy('resonated')}
          >
            {t('filters.sortResonated')}
          </Button>
          <Button
            variant={sortBy === 'relevance' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSortBy('relevance')}
          >
            {t('filters.sortRelevance')}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <SlidersHorizontalIcon className="h-4 w-4 mr-2" />
            {t('filters.advanced')}
            {activeFilterCount > 0 && (
              <span className="ml-1.5 bg-emerald-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Link href="/signals/create" className={primaryCreateLinkSmStyles}>
            <PlusIcon className="h-4 w-4" />
            {t('form.submit')}
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder={t('filters.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
      </div>

      {showAdvanced && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {t('filters.advanced')}
            </h3>
            <div className="flex gap-2">
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  <XIcon className="h-3 w-3 mr-1" />
                  {t('filters.clearAll')}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(false)}>
                {t('filters.advancedClose')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <SearchableFilter
              label={t('filters.domain')}
              options={domainOptions}
              value={selectedDomain}
              onChange={setSelectedDomain}
              placeholder={t('filters.domain')}
            />

            <SearchableFilter
              label={t('filters.scale')}
              options={scaleOptions}
              value={selectedScale}
              onChange={setSelectedScale}
              placeholder={t('filters.scale')}
            />

            <SearchableFilter
              label={t('filters.confidence')}
              options={confidenceOptions}
              value={selectedConfidence}
              onChange={setSelectedConfidence}
              placeholder={t('filters.confidence')}
            />

            <SearchableFilter
              label={t('filters.novelty')}
              options={noveltyOptions}
              value={selectedNovelty}
              onChange={setSelectedNovelty}
              placeholder={t('filters.novelty')}
            />

            <SearchableFilter
              label={t('filters.sourceType')}
              options={sourceTypeOptions}
              value={selectedSourceType}
              onChange={setSelectedSourceType}
              placeholder={t('filters.sourceType')}
            />

            <SearchableFilter
              label={t('filters.verificationLevel')}
              options={verificationOptions}
              value={selectedVerification}
              onChange={setSelectedVerification}
              placeholder={t('filters.verificationLevel')}
            />

            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasLocation}
                  onChange={(e) => setHasLocation(e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                {t('filters.hasLocation')}
              </label>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('filters.relevanceMin')}
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={relevanceMin}
                  onChange={(e) => setRelevanceMin(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
              <span className="text-gray-400 mt-6">–</span>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('filters.relevanceMax')}
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={relevanceMax}
                  onChange={(e) => setRelevanceMax(e.target.value)}
                  placeholder="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {(() => {
      if (isLoading) return <div className="text-center py-12 text-gray-500">{t('common:loading')}</div>;
      if (signals.length === 0) return (
        <Card className="p-8 text-center">
          <RadioIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('empty.title')}
          </h3>
          <p className="text-gray-500 mb-4">{t('empty.description')}</p>
          <Link href="/signals/create" className={primaryCreateLinkMdStyles}>
            {t('empty.createFirst')}
          </Link>
        </Card>
      );
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {signals.map((signal) => (
            <Link key={signal.id} href={`/signals/${signal.id}`}>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer h-full">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/50">
                    <RadioIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {signal.title}
                    </h3>

                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getDomainColor(signal.domain)}`}>
                        {t(`domains.${signal.domain}`)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getConfidenceColor(signal.confidence)}`}>
                        {t(`confidence.${signal.confidence}`)}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getNoveltyColor(signal.novelty)}`}>
                        {t(`novelty.${signal.novelty}`)}
                      </span>
                      {signal.locationName && (
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          <MapPinIcon className="h-3 w-3 inline mr-1" />
                          {signal.locationName}
                        </span>
                      )}
                    </div>

                    {signal.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {signal.description}
                      </p>
                    )}

                    <div className="flex gap-4 mt-3 text-xs text-gray-500">
                      <span>{t('detail.resonances')}: {signal.resonatesCount ?? 0}</span>
                      <span>{t('detail.corroborations')}: {signal.corroborationCount ?? 0}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      );
      })()}
    </div>
  );
}
