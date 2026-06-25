'use client';

import { useDroppable } from '@dnd-kit/core';

type Props = {
  state: string;
  children: React.ReactNode;
  isOver?: boolean;
};

export function DroppableColumn({ state, children, isOver }: Readonly<Props>) {
  const { setNodeRef, isOver: dndOver } = useDroppable({
    id: state,
    data: { state },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${isOver || dndOver ? 'bg-amber-900/20' : ''}`}
    >
      {children}
    </div>
  );
}
