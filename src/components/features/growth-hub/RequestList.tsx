'use client';

import type { ReactNode } from 'react';

interface RequestListProps {
  children: ReactNode;
  emptyMessage: string;
  isEmpty: boolean;
}

export function RequestList({ children, emptyMessage, isEmpty }: Readonly<RequestListProps>) {
  if (isEmpty) {
    return (
      <div className="text-center py-16 text-slate-500 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {children}
    </div>
  );
}
