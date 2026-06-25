'use client';

import { formatRdgLabel } from '@/lib/taxonomy';

interface IdeaTagsProps {
  rdgTags: string[];
  tags: string[];
}

export function IdeaTags({ rdgTags, tags }: Readonly<IdeaTagsProps>) {
  if (rdgTags.length === 0 && tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {rdgTags.map((rdg) => (
        <span
          key={rdg}
          className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300"
          title={formatRdgLabel(rdg)}
        >
          {rdg}
        </span>
      ))}
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400"
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}
