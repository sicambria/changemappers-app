'use client';

import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui';
import {
  ShieldAlertIcon,
  UsersIcon,
  TentIcon,
  CalendarIcon,
} from 'lucide-react';

export function AdminOverviewTab() {
  const { t } = useTranslation(['admin', 'common']);

  const stats = [
    {
      label: t('dashboard.stats.users'),
      value: 124,
      icon: UsersIcon,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      label: t('dashboard.stats.communities'),
      value: 12,
      icon: TentIcon,
      color: 'text-emerald-600 bg-emerald-100',
    },
    {
      label: t('dashboard.stats.events'),
      value: 8,
      icon: CalendarIcon,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      label: t('dashboard.stats.reports'),
      value: 2,
      icon: ShieldAlertIcon,
      color: 'text-red-600 bg-red-100',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <Icon className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
