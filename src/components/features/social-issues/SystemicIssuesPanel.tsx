'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { ChevronDownIcon, ChevronUpIcon, AlertTriangleIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { getSystemicIssues } from '@/app/actions/social-issue';
import type { SocialIssue } from '@/types/social-issue';
import { Z_CLASS } from '@/lib/z-index';

interface SystemicIssuesPanelProps {
  isOpen?: boolean;
}

function getSeverityColorClass(severity: string): string {
  if (severity === 'CRITICAL') return 'text-red-600';
  if (severity === 'HIGH') return 'text-orange-600';
  if (severity === 'MODERATE') return 'text-yellow-600';
  return 'text-green-600';
}

export function SystemicIssuesPanel({ isOpen = false }: Readonly<SystemicIssuesPanelProps>) {
  const { t } = useTranslation('social-issues');
  const [isExpanded, setIsExpanded] = useState(isOpen);
  const [issues, setIssues] = useState<SocialIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    async function loadIssues() {
      setIsLoading(true);
      const result = await getSystemicIssues();
      if (result.success && result.data) {
        setIssues(result.data);
      }
      setIsLoading(false);
    }
    loadIssues();
  }, []);

  const categories = [...new Set(issues.map((i) => i.category))];

  const filteredIssues = selectedCategory
    ? issues.filter((i) => i.category === selectedCategory)
    : issues;

  const groupedByScope = filteredIssues.reduce(
    (acc, issue) => {
      const scope = issue.scope || 'SYSTEMIC';
      if (!acc[scope]) acc[scope] = [];
      acc[scope].push(issue);
      return acc;
    },
    {} as Record<string, SocialIssue[]>
  );

  const scopeOrder = ['SYSTEMIC', 'GLOBAL', 'NATIONAL', 'BIOREGIONAL', 'LOCAL'];

  return (
    <Card className={`absolute right-4 top-4 ${Z_CLASS.mapOverlay} w-80 max-h-[60vh] overflow-hidden shadow-lg`}>
      <button
        type="button"
        aria-expanded={isExpanded}
        className="w-full flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <AlertTriangleIcon className="h-4 w-4 text-red-600" />
          <span className="font-semibold text-gray-900 dark:text-white">
            {t('filters.systemic')}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUpIcon className="h-4 w-4" />
        ) : (
          <ChevronDownIcon className="h-4 w-4" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="p-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="">{t('filters.all')}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`categories.${cat}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="max-h-[40vh] overflow-y-auto">
            {(() => {
            if (isLoading) return (
              <div className="p-4 text-center text-gray-500">
                {t('common:loading')}
              </div>
            );
            if (filteredIssues.length === 0) return (
              <div className="p-4 text-center text-gray-500">
                {t('empty.title')}
              </div>
            );
            return scopeOrder.map((scope) => {
                const scopeIssues = groupedByScope[scope];
                if (!scopeIssues || scopeIssues.length === 0) return null;

                return (
                  <div key={scope} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t(`scope.${scope}`)}
                    </div>
                    {scopeIssues.map((issue) => (
                      <Link
                        key={issue.id}
                        href={`/social-issues/${issue.id}`}
                        className="block px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangleIcon
                            className={`h-4 w-4 mt-0.5 ${getSeverityColorClass(issue.severity)}`}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {issue.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {t(`categories.${issue.category}`)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                );
              });
            })()}
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <Link href="/social-issues">
              <Button variant="ghost" size="sm" className="w-full">
                {t('viewDetails')}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </Card>
  );
}
