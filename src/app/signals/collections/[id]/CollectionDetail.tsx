'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { ArrowLeftIcon, FolderIcon, PlusIcon, XIcon, StarIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getSignalCollectionById, addSignalToCollection, removeSignalFromCollection, toggleCollectionFeatured } from '@/app/actions/weak-signal-collection';
import { getWeakSignals } from '@/app/actions/weak-signal';
import type { SignalCollection, WeakSignal } from '@/types/weak-signal';

interface CollectionDetailProps {
  collectionId: string;
}

export function CollectionDetail({ collectionId }: Readonly<CollectionDetailProps>) {
  const { t } = useTranslation('signals');
  const [collection, setCollection] = useState<(SignalCollection & { items?: unknown[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSignalSearch, setShowSignalSearch] = useState(false);
  const [signalSearch, setSignalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<WeakSignal[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [togglingFeatured, setTogglingFeatured] = useState(false);

  const loadCollection = useCallback(async () => {
    const result = await getSignalCollectionById(collectionId);
    if (result.success && result.data) {
      setCollection(result.data as SignalCollection & { items: unknown[] });
    }
    setIsLoading(false);
  }, [collectionId]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  const handleSignalSearch = async () => {
    if (!signalSearch.trim()) return;
    setSearching(true);
    const result = await getWeakSignals({ search: signalSearch, take: 10 });
    if (result.success && result.data) {
      setSearchResults(result.data);
    }
    setSearching(false);
  };

  const handleLinkSignal = async (signalId: string) => {
    setLinking(signalId);
    await addSignalToCollection(signalId, collectionId);
    await loadCollection();
    setLinking(null);
  };

  const handleUnlinkSignal = async (signalId: string) => {
    setUnlinking(signalId);
    await removeSignalFromCollection(signalId, collectionId);
    await loadCollection();
    setUnlinking(null);
  };

  const handleToggleFeatured = async () => {
    setTogglingFeatured(true);
    await toggleCollectionFeatured(collectionId);
    await loadCollection();
    setTogglingFeatured(false);
  };

  if (isLoading) {
    return <div className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-2xl h-96" />;
  }

  if (!collection) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('errors.notFound')}</p>
      </div>
    );
  }

  const items = (collection.items ?? []) as {
    id: string;
    signalId: string;
    note?: string | null;
    addedAt: string;
    signal?: { id: string; title: string; domain: string; confidence: string; novelty: string; tags: string[] };
    addedBy?: { id: string; name: string; displayName: string };
  }[];

  const linkedSignalIds = new Set(items.map((item) => item.signalId));

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/signals/collections" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6">
        <ArrowLeftIcon className="h-4 w-4" />
        {t('collection.backToCollections')}
      </Link>

      <Card className="p-6 mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/50">
            <FolderIcon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{collection.name}</h1>
              {collection.isFeatured && (
                <Badge className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  <StarIcon className="h-3 w-3 mr-0.5" />
                </Badge>
              )}
            </div>
            {collection.description && (
              <p className="text-gray-600 dark:text-gray-300 mt-2 whitespace-pre-wrap">{collection.description}</p>
            )}
            <div className="flex items-center gap-3 mt-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {collection.signalCount ?? 0} {t('collection.signals')}
              </span>
              {collection.createdBy && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t('collection.createdBy')}: {collection.createdBy.displayName ?? collection.createdBy.name}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleFeatured}
            disabled={togglingFeatured}
          >
            <StarIcon className={`h-4 w-4 mr-1 ${collection.isFeatured ? 'text-amber-500 fill-amber-500' : ''}`} />
            {collection.isFeatured ? t('collection.unfeature') : t('collection.feature')}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('collection.signals')}</h2>
          <Button variant="outline" size="sm" onClick={() => setShowSignalSearch(!showSignalSearch)}>
            <PlusIcon className="h-4 w-4 mr-1" />
            {t('collection.addSignal')}
          </Button>
        </div>

        {showSignalSearch && (
          <div className="mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={signalSearch}
                onChange={(e) => setSignalSearch(e.target.value)}
                placeholder={t('collection.searchSignals')}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSignalSearch(); } }}
              />
              <Button variant="primary" size="sm" onClick={handleSignalSearch} disabled={searching}>
                {searching ? '...' : t('collection.addSignal')}
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {searchResults
                  .filter((s) => !linkedSignalIds.has(s.id))
                  .map((signal) => (
                    <div key={signal.id} className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded">
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{signal.title}</span>
                      <Button variant="ghost" size="sm" onClick={() => handleLinkSignal(signal.id)} disabled={linking === signal.id}>
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('collection.noSignals')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item) => {
              const signal = item.signal;
              if (!signal) return null;
              return (
                <div key={item.id} className="rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                  <div className="flex items-start justify-between">
                    <Link href={`/signals/${signal.id}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:underline line-clamp-1">
                      {signal.title}
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnlinkSignal(signal.id)}
                      disabled={unlinking === signal.id}
                      className="p-1 h-auto"
                    >
                      <XIcon className="h-3 w-3 text-gray-400" />
                    </Button>
                  </div>
                  <div className="flex gap-1.5 mt-1">
                    <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300">
                      {signal.domain}
                    </span>
                    <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                      {signal.confidence}
                    </span>
                  </div>
                  {item.note && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{item.note}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
