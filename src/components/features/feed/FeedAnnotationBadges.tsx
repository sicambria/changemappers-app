'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FEED_RDG_OPTIONS } from '@/lib/feed-reactions';

type AnnotationSource = 'AUTHOR' | 'VIEWER';

export interface FeedRdgAnnotationView {
  rdgSlug: string;
  source: AnnotationSource;
  userId: string;
}

export interface FeedTagAnnotationView {
  tagKey: string;
  tagLabel: string;
  tagCategory: string;
  source: AnnotationSource;
  userId: string;
}

interface FeedAnnotationBadgesProps {
  rdgAnnotations?: FeedRdgAnnotationView[];
  tagAnnotations?: FeedTagAnnotationView[];
}

export function FeedAnnotationBadges({ rdgAnnotations = [], tagAnnotations = [] }: Readonly<FeedAnnotationBadgesProps>) {
  const { t } = useTranslation('feed');
  const rdgTitles = useMemo(() => new Map(FEED_RDG_OPTIONS.map((rdg) => [rdg.slug, rdg.title])), []);
  const authorRdgs = rdgAnnotations.filter((annotation) => annotation.source === 'AUTHOR');
  const viewerRdgs = rdgAnnotations.filter((annotation) => annotation.source === 'VIEWER');
  const authorTags = tagAnnotations.filter((annotation) => annotation.source === 'AUTHOR');
  const viewerTags = tagAnnotations.filter((annotation) => annotation.source === 'VIEWER');

  if (rdgAnnotations.length === 0 && tagAnnotations.length === 0) return null;

  return (
    <div className="space-y-2" data-testid="feed-annotation-badges">
      {(authorRdgs.length > 0 || authorTags.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{t('annotations.author', 'Author')}</span>
          {authorRdgs.map((annotation) => (
            <span key={`author-rdg-${annotation.rdgSlug}`} className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
              {rdgTitles.get(annotation.rdgSlug)?.replace(/^RDG\s+/, '') ?? annotation.rdgSlug}
            </span>
          ))}
          {authorTags.map((annotation) => (
            <span key={`author-tag-${annotation.tagKey}`} className="rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950 dark:text-sky-200">
              {annotation.tagLabel}
            </span>
          ))}
        </div>
      )}
      {(viewerRdgs.length > 0 || viewerTags.length > 0) && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{t('annotations.community', 'Community')}</span>
          {viewerRdgs.map((annotation) => (
            <span key={`viewer-rdg-${annotation.userId}-${annotation.rdgSlug}`} className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {rdgTitles.get(annotation.rdgSlug)?.replace(/^RDG\s+/, '') ?? annotation.rdgSlug}
            </span>
          ))}
          {viewerTags.map((annotation) => (
            <span key={`viewer-tag-${annotation.userId}-${annotation.tagKey}`} className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {annotation.tagLabel}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
