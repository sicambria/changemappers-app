'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
  UsersIcon,
  UserIcon,
  CalendarIcon,
  AlertTriangleIcon,
  RadioIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ActiveBadge } from '@/components/ui/ActiveBadge';
import type { MapEntity } from './map-entity-types';

function EntityTypeIcon({ type }: Readonly<{ type: MapEntity['type'] }>) {
  if (type === 'community') {
    return (
      <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded">
        <UsersIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      </div>
    );
  }
  if (type === 'event') {
    return (
      <div className="p-1.5 bg-teal-100 dark:bg-teal-900/50 rounded">
        <CalendarIcon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
      </div>
    );
  }
  if (type === 'issue') {
    return (
      <div className="p-1.5 bg-red-100 dark:bg-red-900/50 rounded">
        <AlertTriangleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
      </div>
    );
  }
  if (type === 'signal') {
    return (
      <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded">
        <RadioIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      </div>
    );
  }
  return (
    <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/50 rounded">
      <UserIcon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
    </div>
  );
}

// Entity preview popup
export function EntityPreview({ entity }: Readonly<{ entity: MapEntity }>) {
    const { t, i18n } = useTranslation('map');
    const dateLocale = i18n.resolvedLanguage || 'en';

  return (
    <div className="min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
    <EntityTypeIcon type={entity.type} />
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-semibold text-gray-900 dark:text-white">{entity.name}</h4>
          <ActiveBadge show={entity.type === 'individual' && entity.isRecentlyActive} />
        </div>
      </div>

      <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">

        {entity.type === 'community' && entity.communityType && (
          <p className="text-xs uppercase tracking-wide text-gray-500">{entity.communityType}</p>
        )}
        {entity.type === 'event' && (
          <>
            {entity.eventDate && !Number.isNaN(new Date(entity.eventDate).getTime()) && (
              <p>{new Date(entity.eventDate).toLocaleDateString(dateLocale)}</p>
            )}
            <p className="text-xs">{entity.eventType}</p>
          </>
        )}
    {entity.type === 'issue' && (
      <>
        <p className="text-xs uppercase tracking-wide text-red-500 font-medium">{entity.issueCategory}</p>
        <p className="text-xs font-medium">Severity: {entity.issueSeverity}</p>
      </>
    )}
    {entity.type === 'signal' && (
      <>
        <p className="text-xs uppercase tracking-wide text-teal-600 font-medium">{entity.signalDomain}</p>
        <div className="flex gap-1.5">
          <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">{entity.signalConfidence}</span>
          <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-700">{entity.signalNovelty}</span>
        </div>
        {entity.description && <p className="text-xs line-clamp-2">{entity.description.slice(0, 120)}{entity.description.length > 120 ? '...' : ''}</p>}
      </>
    )}
        {entity.memberCount !== undefined && (
          <p>{t('preview.memberCount', { count: entity.memberCount })}</p>
        )}
        {entity.appreciateCount !== undefined && entity.appreciateCount > 0 && (
          <p>{t('preview.appreciateCount', { count: entity.appreciateCount })}</p>
        )}
        {entity.type === 'individual' && entity.changemakeLevel && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {t('preview.changemakeLevel', { level: entity.changemakeLevel.replace('LEVEL_', '') })}
          </p>
        )}
      </div>

  <Link href={(() => {
    if (entity.type === 'community') return `/communities/${entity.id}`;
    if (entity.type === 'event') return `/events/${entity.id}`;
    if (entity.type === 'issue') return `/social-issues/${entity.id}`;
    if (entity.type === 'signal') return `/signals/${entity.id}`;
    return `/profile/${entity.id}`;
  })()}>
    <Button variant="ghost" size="sm" className="mt-3 w-full">
      {entity.type === 'signal' ? t('preview.viewSignal') : t('preview.viewProfile')}
    </Button>
      </Link>
    </div>
  );
}
