'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

type Initiative = {
  id: string;
  title: string;
  why: string;
  state: string;
  createdAt: Date;
  updatedAt: Date;
  assigneeId: string | null;
  assignee: { id: string; name: string | null; profilePhoto: string | null } | null;
  createdBy: { id: string; name: string | null; profilePhoto: string | null };
  roles: { roleType: string; user: { name: string | null; profilePhoto: string | null } }[];
  _count: { updates: number; roles: number };
  retrospective: { id: string } | null;
};

function getTaskAge(updatedAt: Date, now: Date): { value: number; unit: string; color: string } {
  const diffMs = now.getTime() - updatedAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 365) return { value: Math.floor(diffDays / 365), unit: 'y', color: 'bg-red-500' };
  if (diffDays >= 30) return { value: Math.floor(diffDays / 30), unit: 'mo', color: 'bg-red-500' };
  if (diffDays >= 7) return { value: Math.floor(diffDays / 7), unit: 'w', color: 'bg-amber-500' };
  if (diffDays >= 1) return { value: diffDays, unit: 'd', color: 'bg-amber-500' };
  return { value: Math.floor(diffMs / (1000 * 60 * 60)), unit: 'h', color: 'bg-green-500' };
}

export function TaskAgeBadge({ updatedAt, now }: Readonly<{ updatedAt: Date; now: Date }>) {
  const age = getTaskAge(updatedAt, now);
  return (
    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white ${age.color}`}>
      {age.value}{age.unit}
    </span>
  );
}

function AvatarStack({ users }: Readonly<{ users: Array<{ name: string | null; profilePhoto: string | null }> }>) {
  const visibleUsers = users.slice(0, 3);
  const remaining = users.length - 3;

  return (
    <div className="flex -space-x-2">
      {visibleUsers.map((user) => (
        <div
          key={user.name ?? user.profilePhoto ?? 'unknown'}
          className="h-6 w-6 rounded-full border-2 border-slate-800 overflow-hidden bg-slate-700 flex items-center justify-center"
        >
          {user.profilePhoto ? (
            <Image src={user.profilePhoto} alt={user.name ?? ''} width={24} height={24} className="object-cover" />
          ) : (
            <span className="text-[10px] font-medium text-slate-300">
              {user.name?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div className="h-6 w-6 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center">
          <span className="text-[10px] font-medium text-slate-300">+{remaining}</span>
        </div>
      )}
    </div>
  );
}

type Props = {
  initiative: Initiative;
  isDragging?: boolean;
  now: Date;
};

export default function InitiativeCard({ initiative, isDragging, now }: Readonly<Props>) {
  const { t } = useTranslation('coordinate');
  const whyPreview = initiative.why.length > 120 ? initiative.why.slice(0, 120) + '…' : initiative.why;
  const allUsers = [
    ...(initiative.assignee ? [initiative.assignee] : []),
    ...initiative.roles.map((r) => r.user),
  ];

  return (
    <Link
      href={`/tasks/initiative/${initiative.id}`}
      className={`block rounded-xl border bg-slate-800 p-4 shadow-sm transition hover:border-slate-500 hover:bg-slate-750 ${
        isDragging ? 'border-amber-500 shadow-lg shadow-amber-500/20' : 'border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-semibold text-slate-100 leading-snug flex-1">
          {initiative.title}
        </h4>
        <TaskAgeBadge updatedAt={initiative.updatedAt} now={now} />
      </div>

      <p className="mb-3 text-xs text-slate-400 leading-relaxed">{whyPreview}</p>

      <div className="flex items-center justify-between">
        <AvatarStack users={allUsers} />

        {initiative._count.updates > 0 && (
          <span className="text-xs text-slate-500">
            {initiative._count.updates} {initiative._count.updates === 1 ? 'update' : 'updates'}
          </span>
        )}
      </div>

      {initiative.retrospective !== null && (
        <div className="mt-3">
          <span className="inline-flex items-center gap-1 rounded-full border border-green-700 bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-300">
            {t('card.retrospective')}
          </span>
        </div>
      )}
    </Link>
  );
}
