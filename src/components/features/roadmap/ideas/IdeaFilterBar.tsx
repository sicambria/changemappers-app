'use client';

import { useTranslation } from 'react-i18next';
import { SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui';
import { IDEA_TYPES, IDEA_STATUSES } from './types';

export interface IdeaFilterState {
  type: string;
  status: string;
  sort: 'votes' | 'newest';
  search: string;
}

export const DEFAULT_IDEA_FILTERS: IdeaFilterState = { type: '', status: '', sort: 'votes', search: '' };

interface IdeaFilterBarProps {
  filters: IdeaFilterState;
  onChange: (patch: Partial<IdeaFilterState>) => void;
}

const selectClass =
  'rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm';

export function IdeaFilterBar({ filters, onChange }: Readonly<IdeaFilterBarProps>) {
  const { t } = useTranslation('roadmap');

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select className={selectClass} value={filters.type} onChange={(e) => onChange({ type: e.target.value })}>
        <option value="">{t('ideas.filters.allTypes')}</option>
        {IDEA_TYPES.map((type) => (
          <option key={type} value={type}>{t(`ideas.types.${type}`)}</option>
        ))}
      </select>
      <select className={selectClass} value={filters.status} onChange={(e) => onChange({ status: e.target.value })}>
        <option value="">{t('ideas.filters.allStatuses')}</option>
        {IDEA_STATUSES.map((status) => (
          <option key={status} value={status}>{t(`ideas.statuses.${status}`)}</option>
        ))}
      </select>
      <select
        className={selectClass}
        value={filters.sort}
        onChange={(e) => onChange({ sort: e.target.value as IdeaFilterState['sort'] })}
      >
        <option value="votes">{t('ideas.filters.mostVoted')}</option>
        <option value="newest">{t('ideas.filters.newest')}</option>
      </select>
      <div className="relative min-w-[180px] flex-1 max-w-xs">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          className="h-8 pl-9 text-sm"
          placeholder={t('ideas.filters.searchPlaceholder')}
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>
    </div>
  );
}
