'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import {
  AlertTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
} from 'lucide-react';

/**
 * Placeholder moderation view backed by static mock reports. The live, server-backed
 * moderation queue lives in `AdminReportsTab`; this preserves the dashboard's existing
 * preview behavior until that is wired up here.
 */
export function AdminMockReportsTab() {
  const { t } = useTranslation(['admin', 'common']);

  const mockReports = [
    {
      id: 'rep-1',
      filerName: t('dashboard.reports.author1'),
      targetName: t('dashboard.reports.mock1_target'),
      targetType: 'USER',
      category: 'SPAM',
      description: t('dashboard.reports.mock1'),
      status: 'PENDING',
      createdAt: '2026-02-03T10:00:00Z',
    },
    {
      id: 'rep-2',
      filerName: t('dashboard.reports.author2'),
      targetName: t('dashboard.reports.mock2_target'),
      targetType: 'EVENT',
      category: 'MISINFORMATION',
      description: t('dashboard.reports.mock2'),
      status: 'PENDING',
      createdAt: '2026-02-04T09:30:00Z',
    },
  ];

  return (
    <div className="space-y-4">
      {mockReports.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {t('moderation.empty')}
        </div>
      ) : (
        mockReports.map((report) => (
          <Card key={report.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <AlertTriangleIcon className="h-5 w-5 text-red-500" />
                {t(`reports.reason`)}:{' '}
                {t(`admin:reports.categories.${report.category}`) ||
                  report.category}
              </CardTitle>
              <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium">
                {t(`reports.status.${report.status.toLowerCase()}`)}
              </span>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">
                    {t('reports.target')}
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {report.targetName} (
                    {t(`reports.targetTypes.${report.targetType}`) ||
                      report.targetType}
                    )
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t('reports.filer')}
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {report.filerName}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-4 text-sm text-gray-700 dark:text-gray-300">
                &quot;{report.description}&quot;
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-500"
                >
                  {t('moderation.actions.ignore')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                >
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  {t('moderation.actions.ban')}
                </Button>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  {t('moderation.actions.resolve')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
