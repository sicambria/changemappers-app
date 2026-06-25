'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
} from 'lucide-react';
import { getReportsAction, updateReportStatusAction } from '@/app/actions/report';
import type { ReportStatus } from '@/lib/prisma-shared';
import { toast } from 'sonner';

type ReportStatusFilter = 'ALL' | ReportStatus;

interface ReportItem {
  id: string;
  filerName: string;
  targetName: string;
  targetType: string;
  category: string;
  description: string | null;
  status: string;
  createdAt: Date | string;
}

const STATUS_TABS: { value: ReportStatusFilter; labelKey: string; dotColor: string }[] = [
  { value: 'ALL', labelKey: 'reports.all', dotColor: 'bg-gray-400' },
  { value: 'PENDING', labelKey: 'reports.status.pending', dotColor: 'bg-yellow-400' },
  { value: 'UNDER_REVIEW', labelKey: 'reports.status.underReview', dotColor: 'bg-blue-400' },
  { value: 'RESOLVED', labelKey: 'reports.status.resolved', dotColor: 'bg-emerald-400' },
  { value: 'DISMISSED', labelKey: 'reports.status.dismissed', dotColor: 'bg-gray-400' },
];

export function AdminReportsTab() {
  const { t } = useTranslation('admin');
  const translateRef = useRef(t);
  useEffect(() => { translateRef.current = t; }); // §1B: mirror latest t for effects/callbacks below; no deps array on purpose
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>('PENDING');
  const limit = 20;


  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const statusParam = statusFilter !== 'ALL' ? (statusFilter) : undefined;
      const result = await getReportsAction(statusParam, limit, offset);
      if (result.success && result.data) {
        setReports(result.data.reports as ReportItem[]);
        setTotal(result.data.total);
      } else {
        toast.error(result.error || translateRef.current('reports.fetchError'));
      }
    } catch {
      toast.error(translateRef.current('reports.fetchError'));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, offset]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    setOffset(0);
  }, [statusFilter]);

  const handleStatusUpdate = async (reportId: string, newStatus: ReportStatus) => {
    try {
      const result = await updateReportStatusAction(reportId, newStatus);
      if (result.success) {
        toast.success(t('reports.statusUpdated'));
        fetchReports();
      } else {
        toast.error(result.error || t('reports.updateError'));
      }
    } catch {
      toast.error(t('reports.updateError'));
    }
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ShieldAlertIcon className="w-5 h-5 text-red-500" />
          {t('reports.title')} ({total})
        </h3>
        <Button variant="outline" size="sm" onClick={fetchReports} disabled={isLoading} className="gap-2">
          <RefreshCwIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {t('feedback.refresh')}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
              statusFilter === tab.value
                ? 'border-current font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800'
                : 'text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${tab.dotColor}`} />
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {(() => {
      if (isLoading) return <div className="text-center py-12 text-gray-500">{t('feedback.loading')}</div>;
      if (reports.length === 0) return <div className="text-center py-12 text-gray-500">{t('moderation.empty')}</div>;
      return (
        reports.map((report) => (
          <Card key={report.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <AlertTriangleIcon className="h-5 w-5 text-red-500" />
                {t('reports.reason')}: {t(`reports.categories.${report.category}`) || report.category}
              </CardTitle>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${(() => {
                if (report.status === 'PENDING') return 'bg-yellow-100 text-yellow-800';
                if (report.status === 'UNDER_REVIEW') return 'bg-blue-100 text-blue-800';
                if (report.status === 'RESOLVED') return 'bg-emerald-100 text-emerald-800';
                return 'bg-gray-100 text-gray-800';
              })()}`}>
                {t(`reports.status.${report.status.toLowerCase()}`) || report.status}
              </span>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">{t('reports.target')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {report.targetName} ({report.targetType})
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t('reports.filer')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {report.filerName}
                  </p>
                </div>
              </div>
              {report.description && (
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4 text-sm text-gray-700 dark:text-gray-300">
                  &quot;{report.description}&quot;
                </div>
              )}
              <div className="flex gap-2 justify-end">
                {report.status !== 'DISMISSED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-500"
                    onClick={() => handleStatusUpdate(report.id, 'DISMISSED')}
                  >
                    {t('moderation.actions.ignore')}
                  </Button>
                )}
                {report.status !== 'RESOLVED' && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => handleStatusUpdate(report.id, 'RESOLVED')}
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    {t('moderation.actions.resolve')}
                  </Button>
                )}
                {report.status === 'PENDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 hover:bg-blue-50"
                    onClick={() => handleStatusUpdate(report.id, 'UNDER_REVIEW')}
                  >
                    {t('reports.status.underReview')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      );
      })()}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            {t('feedback.previous')}
          </Button>
          <span className="text-sm font-medium">
            {t('feedback.pageOf', { page: currentPage, total: totalPages })}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + limit >= total}
            onClick={() => setOffset(offset + limit)}
          >
            {t('feedback.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
