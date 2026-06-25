'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button } from '@/components/ui';
import { LightbulbIcon, RefreshCwIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, MessageSquareIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { adminGetIdeaPosts, adminUpdateIdeaPostStatus } from '@/app/actions/idea-post';
import type { IdeaPostType, IdeaPostStatus } from '@/lib/prisma-shared';
import { IDEA_STATUSES } from '@/components/features/roadmap/ideas/types';

interface AdminIdeaItem {
  id: string;
  title: string;
  description: string;
  type: IdeaPostType;
  status: IdeaPostStatus;
  createdAt: string | Date;
  createdBy: { name: string | null; email: string | null } | null;
  _count: { votes: number; comments: number };
}

function StatusSelect({ value, onChange }: Readonly<{ value: IdeaPostStatus; onChange: (s: IdeaPostStatus) => void }>) {
  const { t } = useTranslation('admin');
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as IdeaPostStatus)}
      className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs font-semibold"
    >
      {IDEA_STATUSES.map((status) => (
        <option key={status} value={status}>{t(`ideas.statuses.${status}`)}</option>
      ))}
    </select>
  );
}

function AdminIdeaRow({ item, onStatusChange }: Readonly<{
  item: AdminIdeaItem; onStatusChange: (id: string, status: IdeaPostStatus) => void;
}>) {
  const { t, i18n } = useTranslation('admin');
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <span className="text-xs font-bold uppercase tracking-wide text-gray-400">{t(`ideas.types.${item.type}`)}</span>
          <h4 className="font-bold text-gray-900 dark:text-white">{item.title}</h4>
          <p className="mt-1 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
          <p className="mt-2 text-xs text-gray-400">
            {item.createdBy?.name || item.createdBy?.email || t('feedback.anonymous')} ·{' '}
            {new Date(item.createdAt).toLocaleDateString(i18n.resolvedLanguage)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <StatusSelect value={item.status} onChange={(s) => onStatusChange(item.id, s)} />
          <div className="flex gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><ChevronUpIcon className="h-3.5 w-3.5" />{item._count.votes}</span>
            <span className="flex items-center gap-1"><MessageSquareIcon className="h-3.5 w-3.5" />{item._count.comments}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function AdminIdeasPagination({ page, totalPages, onPage }: Readonly<{ page: number; totalPages: number; onPage: (p: number) => void }>) {
  const { t } = useTranslation(['admin', 'common']);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4 pt-2">
      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPage(page - 1)}>
        <ChevronLeftIcon className="mr-1 h-4 w-4" />{t('common:actions.back')}
      </Button>
      <span className="text-sm font-medium">{t('manage.pagination', { current: page, total: totalPages })}</span>
      <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => onPage(page + 1)}>
        {t('common:actions.next')}<ChevronRightIcon className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}

export function AdminIdeasTab() {
  const { t } = useTranslation('admin');
  const translateRef = useRef(t);
  useEffect(() => { translateRef.current = t; });
  const [items, setItems] = useState<AdminIdeaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    const result = await adminGetIdeaPosts(page, 20);
    if (result.success) {
      setItems((result.data || []) as AdminIdeaItem[]);
      setTotalPages(result.totalPages || 1);
      setTotalCount(result.totalCount || 0);
    } else {
      toast.error(result.error || translateRef.current('ideas.fetchError'));
    }
    setIsLoading(false);
  }, [page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleStatusChange = async (id: string, status: IdeaPostStatus) => {
    const result = await adminUpdateIdeaPostStatus(id, status);
    if (result.success) {
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
      toast.success(t('ideas.statusUpdated'));
    } else {
      toast.error(result.error || t('ideas.updateError'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          <LightbulbIcon className="h-5 w-5 text-emerald-500" />
          {t('ideas.title')} ({totalCount})
        </h3>
        <Button variant="outline" size="sm" onClick={fetchItems} disabled={isLoading} className="gap-2">
          <RefreshCwIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('ideas.refresh')}
        </Button>
      </div>

      {(() => {
        if (isLoading) return <div className="flex justify-center py-16"><Loader2Icon className="h-8 w-8 animate-spin text-emerald-500" /></div>;
        if (items.length === 0) return <p className="py-16 text-center text-gray-400">{t('ideas.empty')}</p>;
        return (
          <div className="grid gap-4">
            {items.map((item) => <AdminIdeaRow key={item.id} item={item} onStatusChange={handleStatusChange} />)}
          </div>
        );
      })()}

      <AdminIdeasPagination page={page} totalPages={totalPages} onPage={setPage} />
    </div>
  );
}
