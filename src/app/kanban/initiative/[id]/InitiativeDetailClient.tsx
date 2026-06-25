'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Role {
  id: string;
  roleType: string;
  user: { displayName: string | null; name: string | null };
}

interface Update {
  id: string;
  narrative: string;
  createdAt: Date;
  author: { name: string | null };
}

interface Initiative {
  id: string;
  title: string;
  why: string | null;
  description: string | null;
  state: string;
  roles: Role[];
  updates: Update[];
  retrospective: { publicNarrative: string } | null;
}

interface InitiativeDetailClientProps {
  initiative: Initiative | null;
}

export default function InitiativeDetailClient({ initiative }: Readonly<InitiativeDetailClientProps>) {
  const { t, i18n } = useTranslation('kanban');
  const dateLocale = i18n.resolvedLanguage || 'en';

  if (!initiative) {
    return (
      <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-12">
        <div className="max-w-3xl mx-auto text-center py-24">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t('initiativeNotFound')}
          </h1>
          <Link href="/kanban" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">
            ← {t('backToBoard')}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <Link href="/kanban" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline">
            ← {t('board')}
          </Link>
        </div>

        <div className="mb-6">
          <div className="flex items-start gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex-1">
              {initiative.title}
            </h1>
            <span className="shrink-0 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400">
              {initiative.state}
            </span>
          </div>
          {initiative.why && (
            <p className="text-gray-600 dark:text-gray-400 italic mt-2">{initiative.why}</p>
          )}
          {initiative.description && (
            <p className="text-gray-700 dark:text-gray-300 mt-3">{initiative.description}</p>
          )}
        </div>

        {initiative.roles.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              {t('roles')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {initiative.roles.map((role) => (
                <div
                  key={role.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {role.user.displayName ?? role.user.name}
                  </span>
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    {role.roleType}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {initiative.updates.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              {t('updates')}
            </h2>
            <div className="space-y-3">
              {initiative.updates.map((update) => (
                <div
                  key={update.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 bg-white dark:bg-gray-900"
                >
                  <p className="text-sm text-gray-800 dark:text-gray-200">{update.narrative}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {update.author.name} ·{' '}
                    {new Date(update.createdAt).toLocaleDateString(dateLocale)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {initiative.retrospective && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              Retrospective
            </h2>
            <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 px-4 py-3">
              <p className="text-sm text-gray-800 dark:text-gray-200">
                {initiative.retrospective.publicNarrative}
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
