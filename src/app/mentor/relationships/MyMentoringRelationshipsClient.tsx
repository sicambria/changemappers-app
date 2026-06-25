'use client';

import { useTranslation } from 'react-i18next';
import { closeMentoringRelationshipAction } from '@/app/actions/mentoring';
import {
  LifecycleActionButton,
  type LifecycleActionLabels,
} from '@/components/features/growth-hub/LifecycleActionButton';

interface Relationship {
  id: string;
  status: string;
  arcLength: string | null;
  currentUserId: string;
  mentor: {
    id: string;
    user: {
      id: string;
      name: string | null;
    };
  };
}

interface MyMentoringRelationshipsClientProps {
  relationships: Relationship[];
}

const STATUS_ORDER = ['EXPLORING', 'ACTIVE', 'PAUSING', 'CLOSED'] as const;
type RelationshipStatus = (typeof STATUS_ORDER)[number];

export default function MyMentoringRelationshipsClient({ relationships }: Readonly<MyMentoringRelationshipsClientProps>) {
  const { t } = useTranslation(['mentor', 'growth']);

  const getStatusLabel = (status: string): string => {
    const key = `relationship.status.${status}` as const;
    return t(key);
  };

  // closeMentoringRelationshipAction is either-party (mentor or mentee); gate on status only.
  const closeLabels: LifecycleActionLabels = {
    label: t('growth:lifecycle.close.label'),
    confirmPrompt: t('growth:lifecycle.close.confirmPrompt'),
    confirmYes: t('growth:lifecycle.close.confirmYes'),
    pendingLabel: t('growth:lifecycle.close.pending'),
    cancelLabel: t('growth:lifecycle.cancelEngagement.label'),
    errorFallback: t('growth:lifecycle.close.failed'),
  };

  const grouped = STATUS_ORDER.reduce<Record<RelationshipStatus, Relationship[]>>(
    (acc, status) => {
      acc[status] = relationships.filter((r) => r.status === status);
      return acc;
    },
    { EXPLORING: [], ACTIVE: [], PAUSING: [], CLOSED: [] }
  );

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('mentor:myMentoringRelationships')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          {t('mentor:relationshipList.subtitle')}
        </p>

        {relationships.length === 0 && (
          <p className="text-gray-400 dark:text-gray-500 text-center py-16">
            {t('mentor:relationshipList.empty')}
          </p>
        )}

        {STATUS_ORDER.map((status) => {
          const items = grouped[status];
          if (items.length === 0) return null;
          return (
            <section key={status} className="mb-8">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3">
                {getStatusLabel(status)}
              </h2>
              <div className="space-y-3">
                {items.map((rel) => {
                  const mentorName = rel.mentor.user.name ?? t('mentor:relationshipList.defaultMentorName');
                  const isOpen = rel.status === 'EXPLORING' || rel.status === 'ACTIVE' || rel.status === 'PAUSING';
                  return (
                    <div
                      key={rel.id}
                      className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4 flex flex-wrap items-center justify-between gap-3"
                    >
                      <span className="text-gray-900 dark:text-gray-100 font-medium">
                        {mentorName}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {rel.arcLength && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {rel.arcLength}
                          </span>
                        )}
                        {isOpen && (
                          <LifecycleActionButton
                            action={() => closeMentoringRelationshipAction(rel.id)}
                            labels={closeLabels}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
