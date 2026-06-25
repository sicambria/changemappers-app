'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { exportSessionJSON } from '@/app/actions/coachme';
import type { CoachMeFocusTag } from '@/lib/prisma-shared';

interface SessionSummary {
  id: string;
  createdAt: Date;
  focusTag: CoachMeFocusTag;
  customFocusTag: string | null;
  sessionUsefulness: number | null;
  actionPlanFinal: string | null;
  actionPlanV1: string | null;
}

interface ProgressClientProps {
  initialSessions: SessionSummary[];
}

export default function ProgressClient({ initialSessions }: Readonly<ProgressClientProps>) {
  const { t, i18n } = useTranslation('coachme');
  const [sessions] = useState(initialSessions);
  const [focusFilter, setFocusFilter] = useState<string>('all');

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(i18n.resolvedLanguage || i18n.language);
  };

  const getFocusLabel = (focusTag: CoachMeFocusTag, customFocusTag?: string | null) => {
    if (focusTag === 'OTHER' && customFocusTag) {
      return customFocusTag;
    }
    return t(`phases.focus.focusTags.${focusTag}`);
  };

  const handleExport = async (sessionId: string) => {
    const result = await exportSessionJSON(sessionId);
    if (result.success && result.data) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SolutionPath_${result.data.topic}_${result.data.session_date}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const filteredSessions = focusFilter === 'all'
    ? sessions
    : sessions.filter((s) => s.focusTag === focusFilter);

  const uniqueFocusTags = [...new Set(sessions.map((s) => s.focusTag))];

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        {t('progress.title')}
      </h1>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('progress.filterByFocus')}
        </label>
        <select
          value={focusFilter}
          onChange={(e) => setFocusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="all">{t('progress.allFocus')}</option>
          {uniqueFocusTags.map((tag) => (
            <option key={tag} value={tag}>
              {t(`phases.focus.focusTags.${tag}`)}
            </option>
          ))}
        </select>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {t('progress.empty')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  {t('progress.date')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  {t('progress.focus')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  {t('progress.nextStep')}
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
                  {t('progress.actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr
                  key={session.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <td className="px-4 py-3 text-gray-900 dark:text-white">
                    {formatDate(session.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">
                    {getFocusLabel(session.focusTag, session.customFocusTag)}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white max-w-xs truncate">
                    {session.actionPlanFinal || session.actionPlanV1 || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleExport(session.id)}
                      className="text-emerald-600 hover:underline text-sm"
                    >{t('progress.export')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 flex gap-4">
        <a
          href="/coachme"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
        >
          {t('progress.startNewSession')}
        </a>
      </div>
    </main>
  );
}
