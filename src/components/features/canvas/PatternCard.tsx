'use client';

import { useTranslation } from 'react-i18next';

type Props = {
  pattern: {
    id: string;
    name: string;
    category: string;
    applicableContexts: string[];
    requirements: string | null;
    limitations: string | null;
    examples: string | null;
    status: string;
    proposedBy: { name: string | null };
  };
};

const STATUS_BADGE: Record<string, string> = {
  PROPOSED: 'bg-amber-900/40 text-amber-300 border border-amber-700',
  VALIDATED: 'bg-green-900/40 text-green-300 border border-green-700',
  RETIRED: 'bg-slate-700 text-slate-400 border border-slate-600',
};

const STATUS_LABELS: Record<string, string> = {
  PROPOSED: 'Proposed',
  VALIDATED: 'Validated',
  RETIRED: 'Retired',
};

export default function PatternCard({ pattern }: Readonly<Props>) {
  const { t } = useTranslation('canvas');
  const statusBadge =
    STATUS_BADGE[pattern.status] ?? 'bg-slate-700 text-slate-400 border border-slate-600';
  const statusLabel = STATUS_LABELS[pattern.status] ?? pattern.status;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-slate-100">{pattern.name}</h3>
          <span className="text-xs text-slate-400">{pattern.category}</span>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge}`}>
          {statusLabel}
        </span>
      </div>

      {pattern.applicableContexts.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {pattern.applicableContexts.map((ctx) => (
            <span
              key={ctx}
              className="rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-xs text-slate-300"
            >
              {ctx}
            </span>
          ))}
        </div>
      )}

      <p className="mb-4 text-xs text-slate-500">
        {t('patterns.proposedBy', { name: pattern.proposedBy.name ?? 'Unknown' })}
      </p>

      <div className="flex flex-col gap-2">
        {pattern.requirements && (
          <details className="rounded-lg border border-slate-700 bg-slate-800">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-300 select-none">
              Requirements
            </summary>
            <p className="px-3 pb-3 pt-1 text-sm text-slate-400">{pattern.requirements}</p>
          </details>
        )}

        {pattern.limitations && (
          <details className="rounded-lg border border-slate-700 bg-slate-800">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-300 select-none">
              Limitations
            </summary>
            <p className="px-3 pb-3 pt-1 text-sm text-slate-400">{pattern.limitations}</p>
          </details>
        )}

        {pattern.examples && (
          <details className="rounded-lg border border-slate-700 bg-slate-800">
            <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-300 select-none">
              Examples
            </summary>
            <p className="px-3 pb-3 pt-1 text-sm text-slate-400">{pattern.examples}</p>
          </details>
        )}
      </div>
    </div>
  );
}
