'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, Link2Icon, PencilIcon, TrashIcon, PlusIcon, XIcon, LightbulbIcon, UsersIcon, FolderIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getWeakSignalPatternById, addSignalToPattern, removeSignalFromPattern, updateWeakSignalPattern } from '@/app/actions/weak-signal-pattern';
import { getWeakSignals } from '@/app/actions/weak-signal';
import type { WeakSignalPattern, WeakSignal } from '@/types/weak-signal';

const TRAJECTORY_COLORS: Record<string, string> = {
  EMERGING: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  STABILIZING: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
  DECLINING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
};

const STATUS_COLORS: Record<string, string> = {
  PROPOSED: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
  VALIDATED: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  RETIRED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

interface PatternDetailProps {
  patternId: string;
}

export function PatternDetail({ patternId }: Readonly<PatternDetailProps>) {
  const { t } = useTranslation('signals');
  const router = useRouter();
  const [pattern, setPattern] = useState<WeakSignalPattern & { signals?: unknown[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSignalSearch, setShowSignalSearch] = useState(false);
  const [signalSearch, setSignalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<WeakSignal[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  useEffect(() => {
    async function loadPattern() {
      const result = await getWeakSignalPatternById(patternId);
      if (result.success && result.data) {
        setPattern(result.data as WeakSignalPattern & { signals?: unknown[] });
      }
      setIsLoading(false);
    }
    loadPattern();
  }, [patternId]);

  const handleDelete = async () => {
    setIsDeleting(true);
    // AUDIT-20260613-022: previously the result was discarded and we navigated
    // away regardless; now confirm success before leaving and surface failure.
    const result = await updateWeakSignalPattern(patternId, { status: 'RETIRED' });
    if (result.success) {
      router.push('/signals/patterns');
    } else {
      toast.error(t('errors.updatePatternFailed'));
      setIsDeleting(false);
    }
  };

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
    await addSignalToPattern(signalId, patternId);
    const result = await getWeakSignalPatternById(patternId);
    if (result.success && result.data) {
      setPattern(result.data as WeakSignalPattern & { signals?: unknown[] });
    }
    setLinking(null);
  };

  const handleUnlinkSignal = async (signalId: string) => {
    setUnlinking(signalId);
    await removeSignalFromPattern(signalId);
    const result = await getWeakSignalPatternById(patternId);
    if (result.success && result.data) {
      setPattern(result.data as WeakSignalPattern & { signals?: unknown[] });
    }
    setUnlinking(null);
  };

  if (isLoading) {
    return <div className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-2xl h-96" />;
  }

  if (!pattern) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('errors.notFound')}</p>
      </div>
    );
  }

  const linkedSignals = (pattern.signals ?? []) as WeakSignal[];

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/signals/patterns" className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6">
        <ArrowLeftIcon className="h-4 w-4" />
        {t('pattern.backToPatterns')}
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <Card className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                <Link2Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{pattern.name}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${TRAJECTORY_COLORS[pattern.trajectory] ?? 'bg-gray-100 text-gray-700'}`}>
                    {t(`trajectory.${pattern.trajectory}`)}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[pattern.status] ?? 'bg-gray-100 text-gray-700'}`}>
                    {t(`pattern.statusBadge.${pattern.status}`)}
                  </span>
                </div>
              </div>
            </div>

            {pattern.description && (
              <div className="prose dark:prose-invert max-w-none mt-4">
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{pattern.description}</p>
              </div>
            )}

            {pattern.hypothesis && (
              <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-teal-900 dark:text-teal-300 mb-1">{t('pattern.hypothesis')}</h3>
                <p className="text-sm text-teal-800 dark:text-teal-200 whitespace-pre-wrap">{pattern.hypothesis}</p>
              </div>
            )}

            {pattern.proposedBy && (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>{t('pattern.proposedBy')}: {pattern.proposedBy.displayName ?? pattern.proposedBy.name}</span>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('pattern.linkedSignals')}</h2>
              <Button variant="outline" size="sm" onClick={() => setShowSignalSearch(!showSignalSearch)}>
                <PlusIcon className="h-4 w-4 mr-1" />
                {t('pattern.addSignal')}
              </Button>
            </div>

            {showSignalSearch && (
              <div className="mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={signalSearch}
                    onChange={(e) => setSignalSearch(e.target.value)}
                    placeholder={t('pattern.addSignalSearch')}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSignalSearch(); } }}
                  />
                  <Button variant="primary" size="sm" onClick={handleSignalSearch} disabled={searching}>
                    {searching ? '...' : t('pattern.addSignal')}
                  </Button>
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                    {searchResults
                      .filter((s) => !linkedSignals.some((ls) => (ls as { id: string }).id === s.id))
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

            {linkedSignals.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('pattern.noSignalsLinked')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {linkedSignals.map((signal) => {
                  const s = signal as { id: string; title: string; domain?: string; confidence?: string; novelty?: string };
                  return (
                    <div key={s.id} className="rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                      <div className="flex items-start justify-between">
                        <Link href={`/signals/${s.id}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:underline line-clamp-1">
                          {s.title}
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnlinkSignal(s.id)}
                          disabled={unlinking === s.id}
                          className="p-1 h-auto"
                        >
                          <XIcon className="h-3 w-3 text-gray-400" />
                        </Button>
                      </div>
                      <div className="flex gap-1.5 mt-1">
                        {s.confidence && (
                          <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                            {s.confidence}
                          </span>
                        )}
                        {s.novelty && (
                          <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300">
                            {s.novelty}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:w-72 space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">{t('pattern.editPattern')}</h3>
            <div className="flex flex-col gap-2">
              <Link href={`/signals/patterns/${patternId}/edit`}>
                <Button variant="outline" size="sm" className="w-full">
                  <PencilIcon className="h-4 w-4 mr-2" />
                  {t('pattern.edit')}
                </Button>
              </Link>
              {showDeleteConfirm ? (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-red-600 dark:text-red-400">{t('pattern.deleteConfirm')}</p>
                  <Button variant="danger" size="sm" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? t('form.submitting') : t('pattern.deletePattern')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>
                    {t('form.cancel')}
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="w-full" onClick={() => setShowDeleteConfirm(true)}>
                  <TrashIcon className="h-4 w-4 mr-2" />
                  {t('pattern.deletePattern')}
                </Button>
              )}
            </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">{t('action.title')}</h3>
        <div className="flex flex-col gap-2">
          <Link href={`/signals?patternId=${patternId}`}>
            <Button variant="outline" size="sm" className="w-full">
              <FolderIcon className="h-4 w-4 mr-2" />
              {t('action.linkProject')}
            </Button>
          </Link>
          <Link href={`/communities`}>
            <Button variant="outline" size="sm" className="w-full">
              <UsersIcon className="h-4 w-4 mr-2" />
              {t('action.linkCommunity')}
            </Button>
          </Link>
          <Link href={`/signals/create?patternId=${patternId}`}>
            <Button variant="outline" size="sm" className="w-full">
              <LightbulbIcon className="h-4 w-4 mr-2" />
              {t('action.startExperiment')}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  </div>
</div>
  );
}
