'use client';

import { cn } from '@/lib/utils';

interface FieldErrorProps {
  error?: string;
  className?: string;
}

export function FieldError({ error, className }: Readonly<FieldErrorProps>) {
  if (!error) return null;

  return (
    <p className={cn('mt-1 text-sm text-red-600 dark:text-red-400', className)}>
      {error}
    </p>
  );
}
