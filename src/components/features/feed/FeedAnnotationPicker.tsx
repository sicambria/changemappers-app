'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getFeedAnnotationOptionsAction } from '@/app/actions/feed';
import {
  FEED_RDG_OPTIONS,
  MAX_FEED_RDG_ANNOTATIONS,
  MAX_FEED_TAG_ANNOTATIONS,
  STATIC_FEED_TAG_OPTIONS,
  type FeedRdgOption,
  type FeedTagOption,
} from '@/lib/feed-reactions';

interface FeedAnnotationPickerProps {
  rdgSlugs: string[];
  tagKeys: string[];
  onRdgSlugsChange: (value: string[]) => void;
  onTagKeysChange: (value: string[]) => void;
  rdgLocked?: boolean;
  tagsLocked?: boolean;
  compact?: boolean;
}

function toggleValue(values: string[], value: string, max: number): string[] {
  if (values.includes(value)) return values.filter((item) => item !== value);
  if (values.length >= max) return values;
  return [...values, value];
}

export function FeedAnnotationPicker({
  rdgSlugs,
  tagKeys,
  onRdgSlugsChange,
  onTagKeysChange,
  rdgLocked = false,
  tagsLocked = false,
  compact = false,
}: Readonly<FeedAnnotationPickerProps>) {
  const { t } = useTranslation('feed');
  const [rdgs, setRdgs] = useState<FeedRdgOption[]>([...FEED_RDG_OPTIONS]);
  const [tags, setTags] = useState<FeedTagOption[]>([...STATIC_FEED_TAG_OPTIONS]);

  useEffect(() => {
    let cancelled = false;
    getFeedAnnotationOptionsAction().then((result) => {
      if (!cancelled && result.success && result.data) {
        setRdgs(result.data.rdgs);
        setTags(result.data.tags);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleRdgs = compact ? rdgs.slice(0, 30) : rdgs;
  const groupedTags = useMemo(() => {
    const groups = new Map<string, FeedTagOption[]>();
    for (const tag of tags) {
      const current = groups.get(tag.category) ?? [];
      current.push(tag);
      groups.set(tag.category, current);
    }
    return Array.from(groups.entries());
  }, [tags]);

  return (
    <div className="space-y-3" data-testid="feed-annotation-picker">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
          <span>{t('annotations.rdgs', 'RDGs')}</span>
          <span>{rdgSlugs.length}/{MAX_FEED_RDG_ANNOTATIONS}</span>
        </div>
        <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto rounded-md border border-gray-200 p-2 dark:border-gray-700">
          {visibleRdgs.map((rdg) => {
            const selected = rdgSlugs.includes(rdg.slug);
            return (
              <button
                key={rdg.slug}
                type="button"
                disabled={rdgLocked}
                aria-pressed={selected}
                title={rdg.title}
                onClick={() => onRdgSlugsChange(toggleValue(rdgSlugs, rdg.slug, MAX_FEED_RDG_ANNOTATIONS))}
                className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                  selected
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'border-gray-200 text-gray-600 hover:border-emerald-300 dark:border-gray-700 dark:text-gray-300'
                } ${rdgLocked ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                {rdg.title.replace(/^RDG\s+/, '')}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
          <span>{t('annotations.tags.header', 'Tags')}</span>
          <span>{tagKeys.length}/{MAX_FEED_TAG_ANNOTATIONS}</span>
        </div>
        <div className="space-y-2 rounded-md border border-gray-200 p-2 dark:border-gray-700">
          {groupedTags.map(([category, options]) => (
            <div key={category}>
              <p className="mb-1 text-[11px] font-medium uppercase text-gray-400">{t(`annotations.tags.categories.${category}`, category)}</p>
              <div className="flex flex-wrap gap-1">
                {options.map((tag) => {
                  const selected = tagKeys.includes(tag.key);
                  return (
                    <button
                      key={tag.key}
                      type="button"
                      disabled={tagsLocked}
                      aria-pressed={selected}
                      onClick={() => onTagKeysChange(toggleValue(tagKeys, tag.key, MAX_FEED_TAG_ANNOTATIONS))}
                      className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                        selected
                          ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-200'
                          : 'border-gray-200 text-gray-600 hover:border-sky-300 dark:border-gray-700 dark:text-gray-300'
                      } ${tagsLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      {t(`annotations.tags.labels.${tag.key.toLowerCase()}`, tag.label)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
