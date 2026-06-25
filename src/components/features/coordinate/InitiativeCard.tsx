import Link from 'next/link';
import { STATE_COLORS } from './InitiativeStateColors';

const STATE_LABELS: Record<string, string> = {
  IMAGINED: 'Imagined',
  EXPLORING: 'Exploring',
  PLANNED: 'Planned',
  IN_PROGRESS: 'In Progress',
  INTEGRATING: 'Integrating',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

interface InitiativeCardProps {
  initiative: {
    id: string;
    title: string;
    why: string;
    state: string;
    _count: {
      roles: number;
    };
  };
}

export default function InitiativeCard({ initiative }: Readonly<InitiativeCardProps>) {
  const stateColor = STATE_COLORS[initiative.state] ?? 'bg-gray-100 text-gray-700';
  const whyPreview =
    initiative.why.length > 160 ? initiative.why.slice(0, 160) + '…' : initiative.why;

  return (
    <Link
      href={`/tasks/initiative/${initiative.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{initiative.title}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${stateColor}`}>
          {STATE_LABELS[initiative.state] ?? initiative.state}
        </span>
      </div>

      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{whyPreview}</p>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {initiative._count.roles} {initiative._count.roles === 1 ? 'role' : 'roles'}
      </p>
    </Link>
  );
}
