'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { getVolunteerOpportunitiesAction, saveVolunteerOpportunityAction, unsaveVolunteerOpportunityAction } from '@/app/actions/volunteer';
import type { VolunteerOpportunityFilterInput } from '@/lib/validations/volunteer';

export interface VolunteerOpportunityListItem {
  id: string;
  title: string;
  summary: string;
  primaryRdgs: string[];
  format: string;
  location: string | null;
  region: string | null;
  commitmentType: string;
  rollingApplications: boolean;
  applicationDeadline: Date | null;
  volunteersNeeded: number;
  createdAt: Date;
  requester: { id: string; name: string; organizationName: string | null };
  _count: { applications: number };
}

interface VolunteerBrowseClientProps {
  initialOpportunities?: VolunteerOpportunityListItem[];
  initialTotal?: number;
  initialFilters?: VolunteerOpportunityFilterInput;
  embedded?: boolean;
}

const DEFAULT_FILTERS: VolunteerOpportunityFilterInput = {
  page: 1,
  limit: 20,
};

function normalizeFilters(filters?: VolunteerOpportunityFilterInput): VolunteerOpportunityFilterInput {
  return {
    ...DEFAULT_FILTERS,
    ...filters,
    page: filters?.page ?? DEFAULT_FILTERS.page,
    limit: filters?.limit ?? DEFAULT_FILTERS.limit,
  };
}

function getFilterKey(filters: VolunteerOpportunityFilterInput): string {
  return JSON.stringify(filters);
}

function mergeOpportunities(
  current: VolunteerOpportunityListItem[],
  incoming: VolunteerOpportunityListItem[],
): VolunteerOpportunityListItem[] {
  const byId = new Map(current.map((opportunity) => [opportunity.id, opportunity]));
  incoming.forEach((opportunity) => byId.set(opportunity.id, opportunity));
  return Array.from(byId.values());
}

export function VolunteerBrowseClient({
  initialOpportunities,
  initialTotal = 0,
  initialFilters,
  embedded = false,
}: Readonly<VolunteerBrowseClientProps>) {
  const { t, i18n } = useTranslation('volunteer');
  const dateLocale = i18n.resolvedLanguage || 'en';
  const hasInitialData = initialOpportunities !== undefined;
  const initialFilterKeyRef = useRef(getFilterKey(normalizeFilters(initialFilters)));
  const [opportunities, setOpportunities] = useState<VolunteerOpportunityListItem[]>(initialOpportunities ?? []);
  const [loading, setLoading] = useState(!hasInitialData);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(initialTotal);
  const [filters, setFilters] = useState<VolunteerOpportunityFilterInput>(() => normalizeFilters(initialFilters));
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let isActive = true;
    const page = filters.page ?? 1;

    async function loadOpportunities() {
      if (hasInitialData && getFilterKey(filters) === initialFilterKeyRef.current) {
        setOpportunities(initialOpportunities ?? []);
        setTotal(initialTotal);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      if (page > 1) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const result = await getVolunteerOpportunitiesAction(filters);
      if (!isActive) return;

      if (result.success) {
        setOpportunities((current) => (
          page > 1 ? mergeOpportunities(current, result.data.opportunities) : result.data.opportunities
        ));
        setTotal(result.data.total);
      }
      setLoading(false);
      setLoadingMore(false);
    }

    loadOpportunities();

    return () => {
      isActive = false;
    };
  }, [filters, hasInitialData, initialOpportunities, initialTotal]);

  const handleSave = async (id: string) => {
    if (savedIds.has(id)) {
      await unsaveVolunteerOpportunityAction(id);
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      await saveVolunteerOpportunityAction(id);
      setSavedIds((prev) => new Set(prev).add(id));
    }
  };

  const handleFilterChange = (key: keyof VolunteerOpportunityFilterInput, value: string | boolean | number | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const content = (
    <div className={embedded ? '' : 'max-w-6xl mx-auto'}>
      <div className="mb-8">
        {embedded ? (
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('browse.title')}
          </h2>
        ) : (
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {t('browse.title')}
          </h1>
        )}
        <p className="text-gray-500 dark:text-gray-400">
          {t('hero.subtitle')}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          onChange={(e) => handleFilterChange('rdgDomain', e.target.value || undefined)}
          defaultValue=""
        >
          <option value="">{t('browse.filters.rdgDomain')}</option>
          <option value="1">{t('rdgDomains.1')}</option>
          <option value="2">{t('rdgDomains.2')}</option>
          <option value="3">{t('rdgDomains.3')}</option>
          <option value="4">{t('rdgDomains.4')}</option>
          <option value="5">{t('rdgDomains.5')}</option>
        </select>

        <select
          className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          onChange={(e) => handleFilterChange('format', e.target.value as 'ONLINE' | 'OFFLINE' | 'HYBRID' || undefined)}
          defaultValue=""
        >
          <option value="">{t('browse.filters.format')}</option>
          <option value="ONLINE">{t('format.ONLINE')}</option>
          <option value="OFFLINE">{t('format.OFFLINE')}</option>
          <option value="HYBRID">{t('format.HYBRID')}</option>
        </select>

        <select
          className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
          onChange={(e) => handleFilterChange('commitmentType', e.target.value as 'ONE_TIME' | 'RECURRING' | 'ONGOING' || undefined)}
          defaultValue=""
        >
          <option value="">{t('browse.filters.commitment')}</option>
          <option value="ONE_TIME">{t('commitmentType.ONE_TIME')}</option>
          <option value="RECURRING">{t('commitmentType.RECURRING')}</option>
          <option value="ONGOING">{t('commitmentType.ONGOING')}</option>
        </select>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            onChange={(e) => handleFilterChange('rollingApplications', e.target.checked || undefined)}
            className="rounded border-gray-300"
          />
          {t('browse.filters.rollingApplications')}
        </label>
      </div>

      {(() => {
      if (loading) return (
        <p className="text-gray-400 dark:text-gray-500 text-center py-16">
          {t('browse.loading')}
        </p>
      );
      if (opportunities.length === 0) return (
        <p className="text-gray-400 dark:text-gray-500 text-center py-16">
          {t('browse.empty')}
        </p>
      );
      return (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opp) => (
              <article
                key={opp.id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-5 hover:border-teal-400 dark:hover:border-teal-600 transition-colors"
              >
                <Link href={`/volunteer/${opp.id}`} className="block">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                      {opp.title}
                    </h2>
                    <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300">
                      {t(`format.${opp.format}`)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                    {opp.summary}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {opp.primaryRdgs.slice(0, 2).map((rdg) => (
                      <span
                        key={rdg}
                        className="text-xs bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded"
                      >
                        {rdg}
                      </span>
                    ))}
                    {opp.primaryRdgs.length > 2 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        +{opp.primaryRdgs.length - 2}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
                    {opp.location && (
                      <p>
                        <span className="font-medium">{t('card.location')}:</span> {opp.location}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">{t('card.timeCommitment')}:</span> {t(`commitmentType.${opp.commitmentType}`)}
                    </p>
                    {opp.applicationDeadline && (
                      <p>
                        <span className="font-medium">{t('card.deadline')}:</span>{' '}
                        {new Date(opp.applicationDeadline).toLocaleDateString(dateLocale)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                    <span>
                      {opp.volunteersNeeded - opp._count.applications > 0
                        ? `${opp.volunteersNeeded - opp._count.applications} ${t('card.spotsRemaining')}`
                        : t('status.FULL')}
                    </span>
                    {opp.rollingApplications && (
                      <span className="text-blue-600 dark:text-blue-400">
                        {t('card.rollingApplications')}
                      </span>
                    )}
                  </div>
                </Link>

                <button
                  onClick={() => handleSave(opp.id)}
                  className="mt-3 text-xs text-gray-400 hover:text-teal-600 dark:hover:text-teal-400"
                >
                  {savedIds.has(opp.id) ? t('card.saved') : t('card.save')}
                </button>
              </article>
            ))}
          </div>

          {opportunities.length < total && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => {
                  setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }));
                }}
                disabled={loadingMore}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingMore ? t('browse.loading') : t('browse.loadMore')}
              </button>
            </div>
          )}
        </>
      );
      })()}

      <div className="mt-8 flex justify-center">
        <Link
          href="/volunteer/new"
          className="px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium"
        >
          {t('request.create')}
        </Link>
      </div>
    </div>
  );

  if (embedded) {
    return <section>{content}</section>;
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-10">
      {content}
    </main>
  );
}
