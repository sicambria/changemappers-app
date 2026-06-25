'use client';

import { useTranslation } from 'react-i18next';

type Props = {
  item: {
    id: string;
    title: string;
    description: string;
    rdgGoal: string | null;
    domain: string | null;
    communityResonance: number;
    createdBy: { name: string | null };
    _count: { resonances: number };
  };
  rank: number;
};

export default function BacklogItemCard({ item, rank }: Readonly<Props>) {
  const { t } = useTranslation('coordinate');
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
      <div className="mb-3 flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-xs font-bold text-slate-300">
          {rank}
        </span>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-100 leading-snug">{item.title}</h3>
          <p className="mt-1 text-sm text-slate-400 leading-relaxed">{item.description}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1 rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1 text-sm text-slate-300">
          <span aria-label="resonances">♡</span>
          <span className="font-medium">{item._count.resonances}</span>
        </div>
      </div>

      {(item.rdgGoal || item.domain) && (
        <div className="flex flex-wrap gap-1.5 pl-10">
          {item.rdgGoal && (
            <span className="rounded-full border border-blue-700 bg-blue-900/30 px-2 py-0.5 text-xs text-blue-300">
              {item.rdgGoal}
            </span>
          )}
          {item.domain && (
            <span className="rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
              {item.domain}
            </span>
          )}
        </div>
      )}

      <p className="mt-3 pl-10 text-xs text-slate-500">
        {t('backlog.proposedBy', { name: item.createdBy.name ?? 'Unknown' })}
      </p>
    </div>
  );
}
