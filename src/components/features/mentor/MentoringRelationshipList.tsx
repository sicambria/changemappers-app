'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

type Relationship = {
  id: string;
  arcLength: string;
  checkInRhythm: string;
  status: string;
  createdAt: Date;
  closedAt: Date | null;
  mentor: { user: { name: string | null; profilePhoto: string | null } };
  request: { domain: string; inflectionPoint: string; requester: { name: string | null } };
  feedbacks: { id: string; phase: string; reflection: string }[];
};

type Props = { relationships: Relationship[] };

const STATUS_BADGE: Record<string, string> = {
  EXPLORING: 'bg-blue-900/40 text-blue-300',
  ACTIVE: 'bg-emerald-900/40 text-emerald-300',
  CLOSED: 'bg-slate-700 text-slate-400',
};

export default function MentoringRelationshipList({ relationships }: Readonly<Props>) {
  const { t } = useTranslation('mentor');

  if (relationships.length === 0) {
    return (
      <p className="text-sm text-slate-400">{t('relationshipList.empty')}</p>
    );
  }

  return (
    <ul className="space-y-4">
      {relationships.map((rel) => {
        const mentorName = rel.mentor.user.name ?? t('relationshipList.defaultMentorName');
        const mentorInitial = mentorName.charAt(0).toUpperCase();
        const badgeClass = STATUS_BADGE[rel.status] ?? 'bg-slate-700 text-slate-400';
        const needsReflection = rel.status === 'CLOSED' && rel.feedbacks.length === 0;

        return (
          <li
            key={rel.id}
            className="bg-slate-900 border border-slate-700 rounded-xl p-5"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-100">{rel.request.domain}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {t('relationshipList.arcLabel', { arc: rel.arcLength })} · {t('relationshipList.checkInLabel', { rhythm: rel.checkInRhythm })}
          </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}
              >
                {t(`relationship.status.${rel.status}`)}
              </span>
            </div>

            <div className="mb-3 flex items-center gap-2">
              {rel.mentor.user.profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={rel.mentor.user.profilePhoto}
                  alt={mentorName}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs text-slate-300">
                  {mentorInitial}
                </div>
              )}
              <span className="text-xs text-slate-400">{t('relationshipList.mentorLabel', { name: mentorName })}</span>
            </div>

            <p className="mb-3 line-clamp-2 text-xs text-slate-500">{rel.request.inflectionPoint}</p>

            {needsReflection && (
              <div className="mt-3 rounded-lg border border-emerald-700/50 bg-emerald-900/20 p-3">
          <p className="mb-2 text-sm text-emerald-300">
            {t('relationshipList.closedReflectionPrompt')}
          </p>
                <Link
                  href="/mentor/relationships"
                  className="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
                >
                  {t('relationshipList.writeReflection')}
                </Link>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
