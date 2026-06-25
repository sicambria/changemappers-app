import { NODE_TYPE_COLORS } from './NodeTypeColors';

const TYPE_LABELS: Record<string, string> = {
  PROBLEM: 'Problem',
  PATTERN: 'Pattern',
  ROOT_CAUSE: 'Root Cause',
  SOLUTION_PATTERN: 'Solution Pattern',
  INTERVENTION: 'Intervention',
};

interface NodeCardProps {
  node: {
    id: string;
    type: string;
    title: string;
    description?: string | null;
  };
}

export default function NodeCard({ node }: Readonly<NodeCardProps>) {
  const colorClass = NODE_TYPE_COLORS[node.type] ?? 'bg-gray-100 text-gray-800';
  const descriptionPreview =
    (node.description?.length ?? 0) > 140
      ? node.description?.slice(0, 140) + '…'
      : node.description;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}>
          {TYPE_LABELS[node.type] ?? node.type}
        </span>
      </div>

      <h3 className="mb-1 font-semibold text-gray-900 dark:text-gray-100">{node.title}</h3>

      {descriptionPreview && (
        <p className="text-sm text-gray-600 dark:text-gray-400">{descriptionPreview}</p>
      )}
    </div>
  );
}
