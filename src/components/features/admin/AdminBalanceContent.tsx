'use client';

import { AlertCircleIcon, ShieldAlertIcon, TrendingUpIcon, UsersIcon } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

type BurnoutItem = {
  archetype: string;
  RESTING_percentage: number;
};

type RejectionItem = {
  from: string;
  to: string;
  count: number;
};

type BalanceData = {
  burnoutData: BurnoutItem[];
  rejectionData: RejectionItem[];
  highRiskRetention: number;
  totalDepletingFlags: number;
};

type AdminBalanceContentProps = {
  data: BalanceData | null;
  error?: string | null;
};

export function AdminBalanceContent({ data, error }: Readonly<AdminBalanceContentProps>) {
  const { t } = useTranslation('admin');

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-red-50 text-red-800 p-6 rounded-lg flex items-center gap-3">
          <AlertCircleIcon className="w-6 h-6" />
          <div>
            <h2 className="font-semibold text-lg">{t('balance.errorTitle')}</h2>
            <p>{error || t('balance.errorDefault')}</p>
          </div>
        </div>
        <div className="mt-4">
          <Link href="/" className="text-emerald-600 hover:underline">{t('balance.backToHome')}</Link>
        </div>
      </div>
    );
  }

  const { burnoutData, rejectionData, highRiskRetention, totalDepletingFlags } = data;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <ShieldAlertIcon className="h-4 w-4 text-amber-500" />
          <span>{t('balance.title')}</span>
        </div>
        <Link href="/admin" className="text-sm font-medium text-emerald-600 hover:underline">
          {t('balance.backToAdmin')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <TrendingUpIcon className="w-5 h-5 text-emerald-500" />
            {t('balance.systemResilience')}
          </h2>

          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('balance.highRiskRetention')}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900 dark:text-white">
                  {highRiskRetention.toFixed(1)}%
                </span>
                <span className="text-sm text-gray-400">{t('balance.sdLpArchetypes')}</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('balance.networkDepletion')}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className={`text-3xl font-black ${totalDepletingFlags > 50 ? 'text-rose-600' : 'text-amber-600'}`}>
                  {totalDepletingFlags}
                </span>
                <span className="text-sm text-gray-400">{t('balance.activatedFunctions')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-blue-500" />
            {t('balance.burnoutIndexByArchetype')}
          </h2>
          <p className="text-xs text-gray-500 mb-4">{t('balance.restingPercentage')}</p>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
            {burnoutData.map((b) => {
              let burnoutBarColor: string;
              if (b.RESTING_percentage > 30) { burnoutBarColor = 'bg-rose-500'; }
              else if (b.RESTING_percentage > 15) { burnoutBarColor = 'bg-amber-400'; }
              else { burnoutBarColor = 'bg-emerald-400'; }
              return (
                <div key={b.archetype} className="flex justify-between items-center group">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-amber-600 transition-colors">
                    {b.archetype}
                  </span>
                  <div className="flex items-center gap-3 w-1/2">
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${burnoutBarColor}`}
                        style={{ width: `${b.RESTING_percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold w-10 text-right text-gray-900 dark:text-gray-100">
                      {b.RESTING_percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col h-full">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <AlertCircleIcon className="w-5 h-5 text-rose-500" />
          {t('balance.forcedAsymmetries')}
        </h2>
        <p className="text-xs text-gray-500 mb-6 max-w-2xl">
          {t('balance.asymmetryDescription')}
        </p>

        {rejectionData.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-sm text-gray-500">{t('balance.noRejectionData')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('balance.targetRejector')}</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{t('balance.mercilessUseful')}</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('balance.initiator')}</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('balance.eventCount')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {rejectionData.map((r) => (
                  <tr key={`${r.from}-${r.to}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {r.from}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      &larr; <span className="text-xs border rounded-full px-2 py-0.5 border-rose-200 text-rose-600 bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:bg-rose-900/30">{t('balance.didNotRequest')}</span> &larr;
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-300">
                      {r.to}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900 dark:text-gray-100">
                      {r.count} db
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
