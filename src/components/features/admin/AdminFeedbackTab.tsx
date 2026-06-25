'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Button,
  Input,
} from '@/components/ui';
import {
  MessageSquareIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  CheckCircle2Icon,
  RefreshCwIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MonitorIcon,
  GlobeIcon,
  AlertCircleIcon,
  SearchIcon,
} from 'lucide-react';
import { adminGetFeedbacks, adminUpdateFeedbackStatus } from '@/app/actions/feedback';
import type { FeedbackFilters } from '@/app/actions/feedback';
import { FeedbackStatus } from '@/lib/prisma-shared';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type FeedbackStatusFilter = 'ALL' | FeedbackStatus;

interface FeedbackWithUser {
  id: string;
  createdAt: Date | string;
  type: string;
  status: FeedbackStatus;
  expectation: string;
  reality: string;
  improvement?: string | null;
  otherComment?: string | null;
  metadata: {
    language?: string;
    url?: string;
    userAgent?: string;
    [key: string]: unknown;
  };
  User?: {
    name: string | null;
    email: string | null;
  } | null;
}

function normalizeMetadata(metadata: unknown): FeedbackWithUser['metadata'] {
  return metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? metadata as FeedbackWithUser['metadata']
    : {};
}

const STATUS_TABS: { value: FeedbackStatusFilter; labelKey: string; color: string }[] = [
  { value: 'ALL', labelKey: 'feedback.all', color: 'text-gray-600 border-gray-300' },
  { value: 'NEW', labelKey: 'feedback.new', color: 'text-blue-600 border-blue-300' },
  { value: 'IN_PROGRESS', labelKey: 'feedback.inProgress', color: 'text-amber-600 border-amber-300' },
  { value: 'DONE', labelKey: 'feedback.done', color: 'text-emerald-600 border-emerald-300' },
];

export function AdminFeedbackTab() {
  const { t, i18n } = useTranslation('admin');
  const translateRef = useRef(t);
  useEffect(() => { translateRef.current = t; }); // §1B: mirror latest t for effects/callbacks below; no deps array on purpose
  const [feedbacks, setFeedbacks] = useState<FeedbackWithUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FeedbackStatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchFeedbacks = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: FeedbackFilters = {
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        type: typeFilter ? (typeFilter as 'LIKE' | 'DISLIKE') : undefined,
        search: debouncedSearch || undefined,
      };
      const result = await adminGetFeedbacks(page, 20, filters);
      if (result.success) {
        setFeedbacks((result.data || []).map((item) => ({
          ...item,
          metadata: normalizeMetadata(item.metadata),
        })));
        setTotalCount(result.totalCount || 0);
        setTotalPages(result.totalPages || 1);
      } else {
        toast.error(result.error || translateRef.current('feedback.fetchError'));
      }
    } catch (_error) {
      toast.error(translateRef.current('feedback.fetchError'));
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, typeFilter, debouncedSearch]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, debouncedSearch]);

  const handleStatusUpdate = async (id: string, status: FeedbackStatus) => {
    try {
      const result = await adminUpdateFeedbackStatus(id, status);
      if (result.success) {
        toast.success(t('feedback.statusUpdated', { status }));
        fetchFeedbacks();
      } else {
        toast.error(result.error || t('feedback.updateError'));
      }
    } catch (_error) {
      toast.error(t('feedback.updateError'));
    }
  };

  const getStatusColor = (status: FeedbackStatus) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'IN_PROGRESS':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'DONE':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquareIcon className="w-5 h-5 text-emerald-500" />
          {t('feedback.title')} ({totalCount})
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchFeedbacks}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCwIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('feedback.refresh')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
              statusFilter === tab.value
                ? `${tab.color} bg-opacity-10 border-current font-bold`
                : 'text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
        <div className="h-6 w-px bg-gray-200 mx-1" />
        <select
          className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">{t('feedback.allTypes')}</option>
          <option value="LIKE">{t('feedback.like')}</option>
          <option value="DISLIKE">{t('feedback.dislike')}</option>
        </select>
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-9 h-8 text-sm"
            placeholder={t('feedback.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {(statusFilter !== 'ALL' || typeFilter || debouncedSearch) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setStatusFilter('ALL'); setTypeFilter(''); setSearch(''); }}
            className="text-xs text-gray-500"
          >
            {t('feedback.clearFilters')}
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {(() => {
          if (isLoading) return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2Icon className="w-10 h-10 animate-spin text-emerald-500" />
              <p className="text-gray-500 animate-pulse">{t('feedback.loading')}</p>
            </div>
          );
          if (feedbacks.length === 0) return (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
              <AlertCircleIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('feedback.empty')}</p>
            </div>
          );
          return (
            feedbacks.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${item.type === 'LIKE' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {item.type === 'LIKE' ? <ThumbsUpIcon className="w-5 h-5" /> : <ThumbsDownIcon className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {item.User?.name || t('feedback.anonymous')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(item.createdAt).toLocaleString(i18n.resolvedLanguage)} • {item.metadata.language}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{t('feedback.expectation')}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                            {item.expectation}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{t('feedback.reality')}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                            {item.reality}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {item.improvement && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{t('feedback.improvement')}</p>
                            <p className="text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                              {item.improvement}
                            </p>
                          </div>
                        )}
                        {item.otherComment && (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{t('feedback.comment')}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                              &quot;{item.otherComment}&quot;
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <GlobeIcon className="w-3.5 h-3.5" />
                          {item.metadata.url?.split('/').pop() || '/'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MonitorIcon className="w-3.5 h-3.5" />
                          {item.metadata.userAgent?.split(' ')[0]}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={item.status === 'NEW'}
                          onClick={() => handleStatusUpdate(item.id, 'NEW')}
                          className="text-xs"
                        >
                          {t('feedback.markNew')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={item.status === 'IN_PROGRESS'}
                          onClick={() => handleStatusUpdate(item.id, 'IN_PROGRESS')}
                          className="text-xs text-amber-600 border-amber-200 hover:bg-amber-50"
                        >
                          {t('feedback.inProgress')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={item.status === 'DONE'}
                          onClick={() => handleStatusUpdate(item.id, 'DONE')}
                          className="text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        >
                          <CheckCircle2Icon className="w-3.5 h-3.5 mr-1" />
                          {t('feedback.resolve')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          );
          })()}
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(prev => prev - 1)}
          >
            <ChevronLeftIcon className="w-4 h-4 mr-1" />
            {t('common:actions.back')}
          </Button>
          <span className="text-sm font-medium">
            {t('manage.totalResults', { count: totalCount })} ({t('manage.pagination', { current: page, total: totalPages })})
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(prev => prev + 1)}
          >
            {t('common:actions.next')}
            <ChevronRightIcon className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

function Loader2Icon(props: Readonly<React.SVGProps<SVGSVGElement>>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
