import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

type ActiveBadgeProps = {
  show?: boolean | null;
  className?: string;
};

export function ActiveBadge({ show, className }: Readonly<ActiveBadgeProps>) {
  if (!show) return null;

  return (
    <Badge
      className={cn(
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
        className,
      )}
      variant="outline"
    >
      ACTIVE
    </Badge>
  );
}
