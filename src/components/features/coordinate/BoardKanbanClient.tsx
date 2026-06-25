'use client';

import { useState, useCallback, startTransition, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { MoreHorizontalIcon, GripVerticalIcon, ExternalLinkIcon, ArchiveIcon, PencilIcon, PlusIcon } from 'lucide-react';
import { moveInitiativeStateAction } from '@/app/actions/coordinate';
import { useTranslation } from 'react-i18next';

type Initiative = {
  id: string;
  title: string;
  why: string;
  state: string;
  createdAt: Date;
  updatedAt: Date;
  assigneeId: string | null;
  assignee: { id: string; name: string | null; profilePhoto: string | null } | null;
  createdBy: { id: string; name: string | null; profilePhoto: string | null };
  roles: { roleType: string; user: { name: string | null; profilePhoto: string | null } }[];
  _count: { updates: number; roles: number };
  retrospective: { id: string } | null;
};

type Board = {
  id: string;
  name: string;
  wipLimits: Record<string, number | null> | null;
};

type Props = {
  board: Board;
  initiatives: Initiative[];
  renderedAt: string;
};

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
  IMAGINED: 'bg-gray-100 text-gray-600 border border-gray-300',
  EXPLORING: 'bg-purple-50 text-purple-700 border border-purple-200',
  PLANNED: 'bg-blue-50 text-blue-700 border border-blue-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 border border-amber-200',
  INTEGRATING: 'bg-orange-50 text-orange-700 border border-orange-200',
  COMPLETED: 'bg-green-50 text-green-700 border border-green-200',
};

const STATE_HEADER_BORDER: Record<string, string> = {
  IMAGINED: 'border-t-gray-300',
  EXPLORING: 'border-t-purple-300',
  PLANNED: 'border-t-blue-300',
  IN_PROGRESS: 'border-t-amber-300',
  INTEGRATING: 'border-t-orange-300',
  COMPLETED: 'border-t-green-300',
};

function getTaskAge(
  updatedAt: Date,
  now: Date,
  t: (key: string) => string,
): { value: number; unit: string; color: string } {
  const diffMs = now.getTime() - updatedAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 365) return { value: Math.floor(diffDays / 365), unit: t('board.age.y'), color: 'bg-red-400' };
  if (diffDays >= 30) return { value: Math.floor(diffDays / 30), unit: t('board.age.mo'), color: 'bg-red-400' };
  if (diffDays >= 7) return { value: Math.floor(diffDays / 7), unit: t('board.age.w'), color: 'bg-amber-400' };
  if (diffDays >= 1) return { value: diffDays, unit: t('board.age.d'), color: 'bg-amber-400' };
  return { value: Math.floor(diffMs / (1000 * 60 * 60)), unit: t('board.age.h'), color: 'bg-emerald-400' };
}

function TaskAgeBadge({ updatedAt, now }: Readonly<{ updatedAt: Date; now: Date }>) {
  const { t } = useTranslation('kanban');
  const age = getTaskAge(updatedAt, now, t);
  return (
    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white ${age.color}`}>
      {age.value}{age.unit}
    </span>
  );
}

function AvatarStack({ users }: Readonly<{ users: Array<{ name: string | null; profilePhoto: string | null }> }>) {
  const visibleUsers = users.slice(0, 3);
  const remaining = users.length - 3;

  return (
    <div className="flex -space-x-2">
      {visibleUsers.map((user) => (
        <div
          key={user.name ?? user.profilePhoto ?? 'unknown'}
          className="h-6 w-6 rounded-full border-2 border-white overflow-hidden bg-gray-100 flex items-center justify-center"
        >
          {user.profilePhoto ? (
            <Image src={user.profilePhoto} alt={user.name ?? ''} width={24} height={24} className="object-cover" />
          ) : (
            <span className="text-[10px] font-medium text-gray-600">
              {user.name?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div className="h-6 w-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
          <span className="text-[10px] font-medium text-gray-600">+{remaining}</span>
        </div>
      )}
    </div>
  );
}

// ─── Context menu ───────────────────────────────────────────────────────────

type CardMenuProps = {
  initiative: Initiative;
  onArchive: (id: string) => void;
};

function CardContextMenu({ initiative, onArchive }: Readonly<CardMenuProps>) {
  const { t } = useTranslation('kanban');
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition opacity-0 group-hover/card:opacity-100 focus:opacity-100"
        aria-label={t('board.cardOptions')}
      >
        <MoreHorizontalIcon className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-6 z-50 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          <Link
            href={`/tasks/initiative/${initiative.id}`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition"
          >
          <ExternalLinkIcon className="h-3.5 w-3.5 text-gray-400" />
          {t('board.viewDetails')}
          </Link>
          <Link
            href={`/tasks/initiative/${initiative.id}?edit=1`}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 transition"
          >
          <PencilIcon className="h-3.5 w-3.5 text-gray-400" />
          {t('board.edit')}
          </Link>
          {initiative.state !== 'ARCHIVED' && initiative.state !== 'COMPLETED' && (
            <>
              <hr className="my-1 border-gray-100" />
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setOpen(false); onArchive(initiative.id); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition"
              >
          <ArchiveIcon className="h-3.5 w-3.5" />
          {t('board.archive')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Initiative card ─────────────────────────────────────────────────────────

function InitiativeCard({
  initiative,
  isDragging,
  onArchive,
  now,
}: Readonly<{
  initiative: Initiative;
  isDragging?: boolean;
  onArchive?: (id: string) => void;
  now: Date;
}>) {
  const { t } = useTranslation('kanban');
  const whyPreview = initiative.why.length > 120 ? initiative.why.slice(0, 120) + '…' : initiative.why;
  const allUsers = [
    ...(initiative.assignee ? [initiative.assignee] : []),
    ...initiative.roles.map((r) => r.user),
  ];

  return (
    <div
      className={`group/card relative block rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
        isDragging ? 'border-emerald-400 shadow-lg shadow-emerald-200' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link href={`/tasks/initiative/${initiative.id}`} className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 leading-snug hover:text-emerald-700 transition">
            {initiative.title}
          </h4>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <TaskAgeBadge updatedAt={initiative.updatedAt} now={now} />
          {onArchive && <CardContextMenu initiative={initiative} onArchive={onArchive} />}
        </div>
      </div>

      <p className="mb-3 text-xs text-gray-500 leading-relaxed">{whyPreview}</p>

      <div className="flex items-center justify-between">
        <AvatarStack users={allUsers} />
        {initiative._count.updates > 0 && (
          <span className="text-xs text-gray-400">
            {initiative._count.updates} {initiative._count.updates === 1 ? t('board.update', { count: 1 }) : t('board.updates', { count: initiative._count.updates })}
          </span>
        )}
      </div>

      {initiative.retrospective !== null && (
        <div className="mt-3">
        <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
          ✓ {t('board.retrospective')}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Draggable card wrapper ───────────────────────────────────────────────────

function DraggableCard({
  initiative,
  onArchive,
  now,
}: Readonly<{
  initiative: Initiative;
  onArchive: (id: string) => void;
  now: Date;
}>) {
  const { t } = useTranslation('kanban');
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: initiative.id,
    data: { initiative },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative group/drag cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-30 z-50' : ''}`}
      aria-label={t('board.dragToReorder')}
    >
      <div
        className="pointer-events-none absolute -left-1 top-1/2 -translate-y-1/2 p-1 opacity-0 transition group-hover/drag:opacity-100 z-10"
        aria-hidden="true"
      >
        <GripVerticalIcon className="h-4 w-4 text-gray-300" />
      </div>

      <InitiativeCard
        initiative={initiative}
        isDragging={isDragging}
        onArchive={onArchive}
        now={now}
      />
    </div>
  );
}

// ─── WIP indicator ────────────────────────────────────────────────────────────

function WipIndicator({ current, limit }: Readonly<{ current: number; limit: number | null }>) {
  if (limit === null) return null;
  const isOverLimit = current > limit;
  const isAtLimit = current >= limit;
  let wipColor: string;
  if (isOverLimit) { wipColor = 'text-red-500'; }
  else if (isAtLimit) { wipColor = 'text-amber-500'; }
  else { wipColor = 'text-gray-400'; }
  return (
    <span className={`text-xs font-medium ${wipColor}`}>
      {current}/{limit}
    </span>
  );
}

// ─── Droppable kanban column ──────────────────────────────────────────────────

function KanbanColumn({
  state,
  initiatives,
  wipLimit,
  boardId,
  onArchive,
  now,
}: Readonly<{
  state: string;
  initiatives: Initiative[];
  wipLimit: number | null;
  boardId: string;
  onArchive: (id: string) => void;
  now: Date;
}>) {
  const { t } = useTranslation('kanban');
  const { setNodeRef, isOver } = useDroppable({ id: state, data: { state } });

  const badge = STATE_BADGE[state] ?? 'bg-gray-100 text-gray-600 border border-gray-300';
  const headerBorder = STATE_HEADER_BORDER[state] ?? 'border-t-gray-300';
  const isAtLimit = wipLimit !== null && initiatives.length >= wipLimit;

  return (
    <div
      ref={setNodeRef}
      data-testid={`kanban-column-${state}`}
      className={`flex min-w-56 w-56 flex-col gap-3 rounded-xl border border-gray-200 border-t-4 ${headerBorder} p-3 shadow-sm transition-colors ${(() => {
        if (isOver && !isAtLimit) return 'bg-emerald-50 border-emerald-200';
        if (isAtLimit && isOver) return 'bg-red-50 border-red-200';
        return 'bg-gray-50';
      })()}`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}>
          {STATE_KEYS[state] ? t(STATE_KEYS[state]) : state}
        </span>
        <WipIndicator current={initiatives.length} limit={wipLimit} />
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 min-h-[100px]">
        {initiatives.map((initiative) => (
          <DraggableCard key={initiative.id} initiative={initiative} onArchive={onArchive} now={now} />
        ))}
        {initiatives.length === 0 && (
          <p className="text-xs text-gray-400 italic py-2">{t('board.dropHere')}</p>
        )}
      </div>

      {/* Quick add button */}
      {state === 'IMAGINED' && (
        <Link
          href={`/tasks/initiative/new?boardId=${boardId}`}
          className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-xs text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          {t('board.addInitiative')}
        </Link>
      )}
    </div>
  );
}

// ─── Main board component ─────────────────────────────────────────────────────

export default function BoardKanbanClient({ board, initiatives, renderedAt }: Readonly<Props>) {
  const { t } = useTranslation('kanban');
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }); // §1B: mirror latest t for effects/callbacks below; no deps array on purpose
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localInitiatives, setLocalInitiatives] = useState(initiatives);
  const renderedAtDate = useMemo(() => new Date(renderedAt), [renderedAt]);

  useEffect(() => {
    setLocalInitiatives(initiatives);
  }, [initiatives]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const grouped = useMemo(() => {
    return STATE_COLUMNS.reduce<Record<string, Initiative[]>>(
      (acc, state) => ({
        ...acc,
        [state]: localInitiatives.filter((i) => i.state === state),
      }),
      {},
    );
  }, [localInitiatives]);

  const activeInitiative = activeId ? localInitiatives.find((i) => i.id === activeId) : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      const initiativeId = active.id as string;
      const toState = over.id as string;
      const initiative = localInitiatives.find((i) => i.id === initiativeId);
      if (!initiative || initiative.state === toState) return;

      // Enforce WIP limits client-side
      const limit = board.wipLimits?.[toState];
      if (limit !== null && limit !== undefined) {
        const currentCount = grouped[toState]?.length ?? 0;
        if (currentCount >= limit) return;
      }

      const previousInitiatives = localInitiatives;
      setLocalInitiatives((current) => current.map((item) => (
        item.id === initiativeId ? { ...item, state: toState } : item
      )));

      startTransition(async () => {
        const result = await moveInitiativeStateAction({
          initiativeId,
          toState: toState as never,
        });
        if (!result.success) {
          setLocalInitiatives(previousInitiatives);
        }
      });
    },
    [board.wipLimits, grouped, localInitiatives],
  );

  const handleArchive = useCallback(
    (initiativeId: string) => {
      const initiative = localInitiatives.find((i) => i.id === initiativeId);
      if (!initiative) return;
      const previousInitiatives = localInitiatives;
      setLocalInitiatives((current) => current.map((item) => (
        item.id === initiativeId ? { ...item, state: 'ARCHIVED' } : item
      )));

      startTransition(async () => {
        const result = await moveInitiativeStateAction({
          initiativeId,
          toState: 'ARCHIVED' as never,
          archiveReason: tRef.current('board.archivedViaKanban'),
        });
        if (!result.success) {
          setLocalInitiatives(previousInitiatives);
        }
      });
    },
    [localInitiatives],
  );

  return (
    <DndContext
      id={`board-kanban-${board.id}`}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: `${STATE_COLUMNS.length * 240}px` }}>
          {STATE_COLUMNS.map((state) => (
            <KanbanColumn
              key={state}
              state={state}
              initiatives={grouped[state] ?? []}
              wipLimit={board.wipLimits?.[state] ?? null}
              boardId={board.id}
              onArchive={handleArchive}
              now={renderedAtDate}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeInitiative ? (
          <div className="rotate-2 opacity-95 shadow-xl">
            <InitiativeCard initiative={activeInitiative} isDragging now={renderedAtDate} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
