'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface RequestCardField {
  label: string;
  value: string | null | undefined;
}

export interface RequestCardRequester {
  id: string;
  name: string;
  displayName?: string | null;
  profilePhoto?: string | null;
}

interface RequestCardProps {
  title: string;
  fields: RequestCardField[];
  createdAt: Date | string;
  requester?: RequestCardRequester;
  actions?: ReactNode;
}

export function RequestCard({ title, fields, createdAt, requester, actions }: Readonly<RequestCardProps>) {
  const { i18n } = useTranslation();
  const date = new Date(createdAt).toLocaleDateString(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold text-slate-100 leading-snug">{title}</h3>
        <span className="text-xs text-slate-500 shrink-0 pt-0.5">{date}</span>
      </div>

      {requester && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          {requester.profilePhoto ? (
            <Image
              src={requester.profilePhoto}
              alt={requester.displayName ?? requester.name}
              width={24}
              height={24}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400">
              {(requester.displayName ?? requester.name).charAt(0).toUpperCase()}
            </div>
          )}
          <span>{requester.displayName ?? requester.name}</span>
        </div>
      )}

      <dl className="space-y-1.5">
        {fields.map((f) =>
          f.value ? (
            <div key={f.label} className="text-sm">
              <dt className="inline text-slate-500">{f.label}: </dt>
              <dd className="inline text-slate-300">{f.value}</dd>
            </div>
          ) : null,
        )}
      </dl>

      {actions && <div className="pt-1 border-t border-slate-800">{actions}</div>}
    </div>
  );
}
