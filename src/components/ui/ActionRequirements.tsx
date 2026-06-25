import { useId } from 'react';
import { cn } from '@/lib/utils';

interface ActionRequirementsProps {
  id?: string;
  requirements: Array<string | null | false | undefined>;
  className?: string;
}

export function ActionRequirements({ id, requirements, className }: Readonly<ActionRequirementsProps>) {
  const generatedId = useId();
  const unmetRequirements = requirements.filter((item): item is string => Boolean(item));

  if (unmetRequirements.length === 0) {
    return null;
  }

  return (
    <div
      id={id ?? generatedId}
      className={cn('rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900', className)}
    >
      <ul className="list-disc space-y-1 pl-5">
        {unmetRequirements.map((requirement) => (
          <li key={requirement}>{requirement}</li>
        ))}
      </ul>
    </div>
  );
}
