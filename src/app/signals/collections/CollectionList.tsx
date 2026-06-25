'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { FolderIcon, PlusIcon, StarIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { SignalCollection } from '@/types/weak-signal';

interface CollectionListProps {
  featuredCollections: SignalCollection[];
  allCollections: SignalCollection[];
}

function CollectionCard({ collection }: Readonly<{ collection: SignalCollection }>) {
  return (
    <Link href={`/signals/collections/${collection.id}`}>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer h-full">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/50">
            <FolderIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {collection.name}
              </h3>
              {collection.isFeatured && (
                <Badge className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  <StarIcon className="h-3 w-3 mr-0.5" />
                </Badge>
              )}
            </div>
            {collection.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {collection.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 text-xs rounded-full bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300">
                {collection.signalCount ?? 0} signals
              </span>
              {collection.createdBy && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  by {collection.createdBy.displayName ?? collection.createdBy.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function CollectionList({ featuredCollections, allCollections }: Readonly<CollectionListProps>) {
  const { t } = useTranslation('signals');

  const nonFeaturedCollections = allCollections.filter(
    (c) => !featuredCollections.some((f) => f.id === c.id)
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('collection.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('collection.subtitle')}
          </p>
        </div>
        <Link href="/signals/collections/create">
          <Button variant="primary" size="sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('collection.create')}
          </Button>
        </Link>
      </div>

      {featuredCollections.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            <StarIcon className="h-5 w-5 inline mr-2 text-amber-500" />
            {t('collection.featured')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCollections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        </div>
      )}

      {(() => {
      if (nonFeaturedCollections.length > 0) return (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            {t('collection.allCollections')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nonFeaturedCollections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        </div>
      );
      if (featuredCollections.length === 0) return (
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center">
          <FolderIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{t('collection.noCollections')}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('collection.noCollectionsHint')}</p>
        </div>
      );
      return null;
      })()}
    </div>
  );
}
