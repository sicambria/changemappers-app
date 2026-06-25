'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { PlusIcon, MapPinIcon, AlertTriangleIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getSocialIssues } from '@/app/actions/social-issue';
import type { SocialIssue, SocialIssueCategory, IssueSeverity } from '@/types/social-issue';

export function SocialIssuesList() {
	const { t } = useTranslation('social-issues');
	const [issues, setIssues] = useState<SocialIssue[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<'localizable' | 'systemic' | 'all'>('all');
	const [selectedCategory, setSelectedCategory] = useState<SocialIssueCategory | ''>('');
	const [selectedSeverity, setSelectedSeverity] = useState<IssueSeverity | ''>('');
	const [selectedScope, setSelectedScope] = useState<'LOCAL' | 'BIOREGIONAL' | 'NATIONAL' | 'GLOBAL' | 'SYSTEMIC' | ''>('');
	const [selectedRdg, setSelectedRdg] = useState<string>('');
	const [searchQuery, setSearchQuery] = useState('');

	useEffect(() => {
		async function loadIssues() {
			setIsLoading(true);
			let isLocalizable: boolean | undefined;
			if (activeTab === 'localizable') { isLocalizable = true; }
			else if (activeTab === 'systemic') { isLocalizable = false; }
			else { isLocalizable = undefined; }
			const result = await getSocialIssues({
				isLocalizable,
				category: selectedCategory || undefined,
				severity: selectedSeverity || undefined,
				scope: selectedScope || undefined,
				search: searchQuery || undefined,
			});
			if (result.success && result.data) {
				let filtered = result.data;
				if (selectedRdg) {
					filtered = filtered.filter((i) => i.relatedRdgs.includes(selectedRdg));
				}
				setIssues(filtered);
			}
			setIsLoading(false);
		}
		loadIssues();
	}, [activeTab, selectedCategory, selectedSeverity, selectedScope, selectedRdg, searchQuery]);

  const getSeverityColor = (severity: IssueSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:flex-wrap">
        <div className="flex min-w-0 flex-wrap gap-2">
          <Button
            variant={activeTab === 'all' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('all')}
          >
            {t('filters.all')}
          </Button>
          <Button
            variant={activeTab === 'localizable' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('localizable')}
          >
            {t('filters.localizable')}
          </Button>
          <Button
            variant={activeTab === 'systemic' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('systemic')}
          >
            {t('filters.systemic')}
          </Button>
        </div>

        <Link href="/social-issues/create">
          <Button variant="primary" size="sm">
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('create')}
          </Button>
        </Link>
      </div>

      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap">
        <input
          type="text"
          placeholder={t('filters.search')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as SocialIssueCategory | '')}
          className="min-w-0 rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:max-w-[12rem]"
        >
          <option value="">{t('filters.category')}</option>
          {[
            'ENVIRONMENTAL',
            'GOVERNANCE',
            'MEDIA',
            'EDUCATION',
            'ECONOMIC',
            'SOCIAL',
            'INFRASTRUCTURE',
            'HEALTH',
            'OTHER',
          ].map((cat) => (
            <option key={cat} value={cat}>
              {t(`categories.${cat}`)}
            </option>
          ))}
        </select>

        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value as IssueSeverity | '')}
          className="min-w-0 rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:max-w-[12rem]"
        >
				<option value="">{t('filters.severity')}</option>
				{['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].map((sev) => (
					<option key={sev} value={sev}>
						{t(`severity.${sev}`)}
					</option>
				))}
			</select>

			<select
				value={selectedScope}
				onChange={(e) => setSelectedScope(e.target.value as typeof selectedScope)}
				className="min-w-0 rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:max-w-[12rem]"
			>
				<option value="">{t('filters.scope')}</option>
				{['LOCAL', 'BIOREGIONAL', 'NATIONAL', 'GLOBAL', 'SYSTEMIC'].map((scope) => (
					<option key={scope} value={scope}>
						{t(`scope.${scope}`)}
					</option>
				))}
			</select>

			<select
				value={selectedRdg}
				onChange={(e) => setSelectedRdg(e.target.value)}
				className="min-w-0 rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white sm:max-w-[12rem]"
			>
				<option value="">{t('filters.rdg')}</option>
				{Array.from({ length: 30 }, (_, i) => i + 1).map((rdg) => (
					<option key={rdg} value={String(rdg)}>
						{t(`rdgs.${rdg}`)}
					</option>
				))}
			</select>
		</div>

      {(() => {
      if (isLoading) return <div className="text-center py-12 text-gray-500">{t('common:loading')}</div>;
      if (issues.length === 0) return (
        <Card className="p-8 text-center">
          <AlertTriangleIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('empty.title')}
          </h3>
          <p className="text-gray-500 mb-4">{t('empty.description')}</p>
          <Link href="/social-issues/create">
            <Button variant="primary">{t('empty.action')}</Button>
          </Link>
        </Card>
      );
      return (
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {issues.map((issue) => (
            <Link key={issue.id} href={`/social-issues/${issue.id}`}>
              <Card className="h-full min-w-0 cursor-pointer p-4 transition-shadow hover:shadow-md">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      issue.isLocalizable ? 'bg-red-100 dark:bg-red-900/50' : 'bg-purple-100 dark:bg-purple-900/50'
                    }`}
                  >
                    {issue.isLocalizable ? (
                      <MapPinIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                    ) : (
                      <AlertTriangleIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                      {issue.title}
                    </h3>

                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {t(`categories.${issue.category}`)}
                      </span>
						<span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(issue.severity)}`}>
							{t(`severity.${issue.severity}`)}
						</span>
						{issue.scope && (
							<span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
								{t(`scope.${issue.scope}`)}
							</span>
						)}
						{issue.locationName && (
							<span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
								{issue.locationName}
							</span>
						)}
						</div>

						{issue.relatedRdgs.length > 0 && (
							<div className="flex flex-wrap gap-1 mt-2">
								{issue.relatedRdgs.slice(0, 3).map((rdg) => (
									<span
										key={rdg}
										title={t(`rdgs.${rdg}`)}
										className="px-1.5 py-0.5 text-xs rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 max-w-[120px] truncate"
									>
										{t(`rdgs.${rdg}`)}
									</span>
								))}
								{issue.relatedRdgs.length > 3 && (
									<span className="text-xs text-gray-500 px-1.5 py-0.5">+{issue.relatedRdgs.length - 3} more</span>
								)}
							</div>
						)}

                    {issue.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        {issue.description}
                      </p>
                    )}

                    <div className="flex gap-4 mt-3 text-xs text-gray-500">
                      <span>{t('verification.vouchCount', { count: issue.vouchCount || 0 })}</span>
                      <span>{t('verification.disputeCount', { count: issue.disputeCount || 0 })}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      );
      })()}
    </div>
  );
}
