import Link from 'next/link';
import { useTranslation } from 'react-i18next';

type Initiative = {
  id: string;
  title: string;
  why: string;
  state: string;
  updatedAt: Date;
  createdBy: { name: string | null; profilePhoto: string | null };
  roles: { roleType: string; user: { name: string | null; profilePhoto: string | null } }[];
  _count: { updates: number };
  retrospective: { id: string } | null;
};

type Props = { initiatives: Initiative[] };

const STATE_COLUMNS = [
  'IMAGINED',
  'EXPLORING',
  'PLANNED',
  'IN_PROGRESS',
  'INTEGRATING',
  'COMPLETED',
] as const;

const STATE_KEYS: Record<string, string> = {
  IMAGINED: 'board.states.imagined',
  EXPLORING: 'board.states.exploring',
  PLANNED: 'board.states.planned',
  IN_PROGRESS: 'board.states.inProgress',
  INTEGRATING: 'board.states.integrating',
  COMPLETED: 'board.states.completed',
};

const STATE_BADGE: Record<string, string> = {
  IMAGINED: 'bg-slate-700 text-slate-300 border border-slate-600',
  EXPLORING: 'bg-purple-900/40 text-purple-300 border border-purple-700',
  PLANNED: 'bg-blue-900/40 text-blue-300 border border-blue-700',
  IN_PROGRESS: 'bg-amber-900/40 text-amber-300 border border-amber-700',
  INTEGRATING: 'bg-orange-900/40 text-orange-300 border border-orange-700',
  COMPLETED: 'bg-green-900/40 text-green-300 border border-green-700',
};

const STATE_HEADER_BORDER: Record<string, string> = {
  IMAGINED: 'border-slate-600',
  EXPLORING: 'border-purple-700',
  PLANNED: 'border-blue-700',
  IN_PROGRESS: 'border-amber-700',
  INTEGRATING: 'border-orange-700',
  COMPLETED: 'border-green-700',
};

function InitiativeKanbanCard({ initiative }: Readonly<{ initiative: Initiative }>) {
  const { t } = useTranslation('kanban');
  const whyPreview =
    initiative.why.length > 120 ? initiative.why.slice(0, 120) + '…' : initiative.why;

  return (
    <Link
      href={`/tasks/initiative/${initiative.id}`}
      className="block rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-sm transition hover:border-slate-500 hover:bg-slate-750"
    >
      <h4 className="mb-1 text-sm font-semibold text-slate-100 leading-snug">
        {initiative.title}
      </h4>

      <p className="mb-3 text-xs text-slate-400 leading-relaxed">{whyPreview}</p>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {initiative.createdBy.name && (
          <span className="truncate max-w-[8rem]">{initiative.createdBy.name}</span>
        )}
        {initiative.roles.length > 0 && (
          <span>{initiative.roles.length} {initiative.roles.length === 1 ? t('board.role', { count: 1 }) : t('board.roles', { count: initiative.roles.length })}</span>
        )}
        {initiative._count.updates > 0 && (
          <span>{initiative._count.updates} {initiative._count.updates === 1 ? t('board.update', { count: 1 }) : t('board.updates', { count: initiative._count.updates })}</span>
        )}
      </div>

      {initiative.retrospective !== null && (
        <div className="mt-3">
        <span className="inline-flex items-center gap-1 rounded-full border border-green-700 bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-300">
          ✓ {t('board.retrospective')}
          </span>
        </div>
      )}
    </Link>
  );
}

function KanbanColumn({
  state,
  initiatives,
}: Readonly<{
  state: string;
  initiatives: Initiative[];
}>) {
  const { t } = useTranslation('kanban');
  const badge = STATE_BADGE[state] ?? 'bg-slate-700 text-slate-300 border border-slate-600';
  const headerBorder = STATE_HEADER_BORDER[state] ?? 'border-slate-600';

  return (
    <div className={`flex min-w-56 w-56 flex-col gap-3 rounded-xl border ${headerBorder} bg-slate-900 p-3`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}>
          {STATE_KEYS[state] ? t(STATE_KEYS[state]) : state}
        </span>
        <span className="text-xs text-slate-500">{initiatives.length}</span>
      </div>

      <div className="flex flex-col gap-2">
        {initiatives.map((initiative) => (
          <InitiativeKanbanCard key={initiative.id} initiative={initiative} />
        ))}
        {initiatives.length === 0 && (
          <p className="text-xs text-slate-600 italic">{t('board.noInitiatives')}</p>
        )}
      </div>
    </div>
  );
}

export default function InitiativeKanban({ initiatives }: Readonly<Props>) {
  const grouped = STATE_COLUMNS.reduce<Record<string, Initiative[]>>(
    (acc, state) => ({
      ...acc,
      [state]: initiatives.filter((i) => i.state === state),
    }),
    {},
  );

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4" style={{ minWidth: `${STATE_COLUMNS.length * 240}px` }}>
        {STATE_COLUMNS.map((state) => (
          <KanbanColumn
            key={state}
            state={state}
            initiatives={grouped[state] ?? []}
          />
        ))}
      </div>
    </div>
  );
}
