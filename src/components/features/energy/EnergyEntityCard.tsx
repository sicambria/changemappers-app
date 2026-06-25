'use client';

import { useTranslation } from 'react-i18next';

export type EnergyEntity = {
  id: string;
  roleLabel: string;
  entityType: string;
  primaryScale: string;
  energyState: string;
  positionX: number;
  positionY: number;
  scaleBandY: number;
  notes: string | null;
  widgetContent: string | null;
  deletedAt?: Date | null;
};

export const ENERGY_COLORS: Record<string, { bg: string; border: string; dot: string }> = {
  EXTRACTIVE:   { bg: '#fee2e2', border: '#fca5a5', dot: '#ef4444' },
  REGENERATIVE: { bg: '#d1fae5', border: '#6ee7b7', dot: '#10b981' },
  NEUTRAL:      { bg: '#f3f4f6', border: '#d1d5db', dot: '#6b7280' },
  CONTESTED:    { bg: '#fef3c7', border: '#fcd34d', dot: '#f59e0b' },
  CAPTURED:     { bg: '#ede9fe', border: '#c4b5fd', dot: '#8b5cf6' },
  DEPLETED:     { bg: '#f8fafc', border: '#cbd5e1', dot: '#94a3b8' },
};

interface EnergyEntityCardProps {
  entity: EnergyEntity;
  isSelected: boolean;
  isDragging: boolean;
  isLinkSource: boolean;
  isInlineEditing: boolean;
  inlineEditValue: string;
  inlineInputRef: React.RefObject<HTMLTextAreaElement | null>;
  isOwner: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onInlineChange: (val: string) => void;
  onInlineBlur: () => void;
  onInlineKeyDown: (e: React.KeyboardEvent) => void;
}

function extractYouTubeId(content: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = p.exec(content);
    if (m) return m[1];
  }
  return null;
}

function getCardZIndex(isDragging: boolean, isSelected: boolean): number {
  if (isDragging) return 100;
  if (isSelected) return 10;
  return 1;
}

function getCardBorderColor(isSelected: boolean, isLinkSource: boolean, fallback: string): string {
  if (isSelected) return '#6366f1';
  if (isLinkSource) return '#22c55e';
  return fallback;
}

function getCardBoxShadow(isDragging: boolean, isSelected: boolean): string {
  if (isDragging) return '0 8px 24px rgba(0,0,0,0.15)';
  if (isSelected) return '0 0 0 2px #6366f1, 0 2px 8px rgba(0,0,0,0.08)';
  return '2px 2px 8px rgba(0,0,0,0.10)';
}

// Shared values the parent computes once and passes to the branch sub-components.
type SharedCardView = {
  colors: { bg: string; border: string; dot: string };
  isWidget: boolean;
  cardZIndex: number;
  cardBorderColor: string;
  cardBoxShadow: string;
};

// Inline-edit textarea fields the branch sub-components share. The ref is kept as a
// direct prop (not nested) so it is passed to <textarea ref={...}> as a plain
// identifier — react-hooks/refs rejects member-access ref reads during render.
type InlineEditView = {
  isInlineEditing: boolean;
  inlineEditValue: string;
  onInlineChange: (val: string) => void;
  onInlineBlur: () => void;
  onInlineKeyDown: (e: React.KeyboardEvent) => void;
};

type BranchProps = Readonly<{
  entity: EnergyEntity;
  isSelected: boolean;
  isDragging: boolean;
  isLinkSource: boolean;
  view: SharedCardView;
  edit: InlineEditView;
  inlineInputRef: React.RefObject<HTMLTextAreaElement | null>;
  onMouseDown: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  t: (key: string) => string;
}>;

function YouTubeEmbedCard({ entity, isSelected, isDragging, view, onMouseDown, onClick, t }: BranchProps) {
  const videoId = entity.widgetContent ? extractYouTubeId(entity.widgetContent) : null;
  return (
    <div // NOSONAR(S6848) — see docs/plans/todo/2026-06_FEATURE_energy-canvas-keyboard-nav.md — spatial drag target; keyboard-nav design tracked there (real gap, not hidden)
      className="absolute"
      style={{ left: entity.positionX, top: entity.positionY, zIndex: view.cardZIndex, pointerEvents: 'auto' }}
      onMouseDown={onMouseDown}
      onClick={onClick}
    >
      <div
        className="rounded-xl overflow-hidden border-2 shadow-md"
        style={{
          borderColor: isSelected ? '#6366f1' : '#e5e7eb',
          width: 320,
          boxShadow: isSelected ? '0 0 0 3px rgba(99,102,241,0.3)' : undefined,
        }}
      >
        <div className="bg-gray-100 px-3 py-1.5 flex items-center gap-2 cursor-move">
          <span className="text-xs text-gray-500 font-medium truncate flex-1">{entity.roleLabel || 'YouTube'}</span>
        </div>
        {videoId ? (
          <iframe
            title={entity.roleLabel || 'YouTube'}
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            width="320"
            height="180"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="block"
            style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
          />
        ) : (
          <div className="bg-gray-50 flex items-center justify-center text-xs text-gray-400" style={{ width: 320, height: 90 }}>
            {t('canvas.invalidYoutubeUrl')}
          </div>
        )}
      </div>
    </div>
  );
}

function OsmEmbedCard({ entity, isSelected, isDragging, view, onMouseDown, onClick, t }: BranchProps) {
  const content = entity.widgetContent ?? '';
  const latLngMatch = /(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/.exec(content);
  const embedUrl = latLngMatch
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number.parseFloat(latLngMatch[2]) - 0.01},${Number.parseFloat(latLngMatch[1]) - 0.01},${Number.parseFloat(latLngMatch[2]) + 0.01},${Number.parseFloat(latLngMatch[1]) + 0.01}&layer=mapnik`
    : null;

  return (
    <div // NOSONAR(S6848) — see docs/plans/todo/2026-06_FEATURE_energy-canvas-keyboard-nav.md — spatial drag target; keyboard-nav design tracked there (real gap, not hidden)
      className="absolute"
      style={{ left: entity.positionX, top: entity.positionY, zIndex: view.cardZIndex, pointerEvents: 'auto' }}
      onMouseDown={onMouseDown}
      onClick={onClick}
    >
      <div
        className="rounded-xl overflow-hidden border-2 shadow-md"
        style={{ borderColor: isSelected ? '#6366f1' : '#e5e7eb', width: 320, boxShadow: isSelected ? '0 0 0 3px rgba(99,102,241,0.3)' : undefined }}
      >
        <div className="bg-gray-100 px-3 py-1.5 flex items-center gap-2 cursor-move">
          <span className="text-xs text-gray-500 font-medium truncate flex-1">{entity.roleLabel || 'Map'}</span>
        </div>
        {embedUrl ? (
          <iframe title={entity.roleLabel || 'Embed'} src={embedUrl} width="320" height="180" className="block" style={{ border: 'none', pointerEvents: isDragging ? 'none' : 'auto' }} />
        ) : (
          <div className="bg-gray-50 flex items-center justify-center text-xs text-gray-400" style={{ width: 320, height: 90 }}>
            {t('canvas.enterCoordinates')}
          </div>
        )}
      </div>
    </div>
  );
}

function TextNode({ entity, isSelected, view, edit, inlineInputRef, onMouseDown, onClick, onDoubleClick }: BranchProps) {
  return (
    <div // NOSONAR(S6848) — see docs/plans/todo/2026-06_FEATURE_energy-canvas-keyboard-nav.md — spatial drag target; keyboard-nav design tracked there (real gap, not hidden)
      className="absolute"
      style={{ left: entity.positionX, top: entity.positionY, zIndex: view.cardZIndex, pointerEvents: 'auto', minWidth: 80 }}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {edit.isInlineEditing ? (
        <textarea
          ref={inlineInputRef}
          value={edit.inlineEditValue}
          onChange={e => edit.onInlineChange(e.target.value)}
          onBlur={edit.onInlineBlur}
          onKeyDown={edit.onInlineKeyDown}
          onClick={e => e.stopPropagation()}
          rows={1}
          className="text-base font-medium text-gray-800 bg-transparent outline-none resize-none border-b border-indigo-400 min-w-[80px]"
        />
      ) : (
        <span
          className={`text-base font-medium text-gray-800 cursor-move ${isSelected ? 'underline decoration-indigo-500' : ''}`}
          style={{ userSelect: 'none' }}
        >
          {entity.roleLabel}
        </span>
      )}
    </div>
  );
}

function StickyNote({ entity, isSelected, isLinkSource, view, edit, inlineInputRef, onMouseDown, onClick, onDoubleClick }: BranchProps) {
  return (
    <div // NOSONAR(S6848) — see docs/plans/todo/2026-06_FEATURE_energy-canvas-keyboard-nav.md — spatial drag target; keyboard-nav design tracked there (real gap, not hidden)
      className="absolute"
      style={{
        left: entity.positionX, top: entity.positionY,
        width: 180, minHeight: 100,
        background: 'linear-gradient(135deg, #fef9c3, #fef08a)',
        borderColor: getCardBorderColor(isSelected, isLinkSource, '#fcd34d'),
        zIndex: view.cardZIndex,
        pointerEvents: 'auto',
        boxShadow: view.cardBoxShadow,
        borderRadius: 4,
        borderWidth: 2,
        borderStyle: 'solid',
        padding: '8px 10px',
      }}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {edit.isInlineEditing ? (
        <textarea
          ref={inlineInputRef}
          value={edit.inlineEditValue}
          onChange={e => edit.onInlineChange(e.target.value)}
          onBlur={edit.onInlineBlur}
          onKeyDown={edit.onInlineKeyDown}
          onClick={e => e.stopPropagation()}
          rows={4}
          className="w-full text-sm text-yellow-900 bg-transparent outline-none resize-none font-medium"
        />
      ) : (
        <p className="text-sm font-medium text-yellow-900 cursor-move whitespace-pre-wrap" style={{ userSelect: 'none' }}>
          {entity.roleLabel}
        </p>
      )}
    </div>
  );
}

function getRegularEntityBoxShadow(isSelected: boolean, isDragging: boolean): string {
  if (isSelected) return '0 0 0 3px rgba(99,102,241,0.3), 0 2px 8px rgba(0,0,0,0.08)';
  if (isDragging) return '0 8px 24px rgba(0,0,0,0.12)';
  return '0 1px 4px rgba(0,0,0,0.06)';
}

function RegularEntity({ entity, isSelected, isDragging, view, edit, inlineInputRef, onMouseDown, onClick, onDoubleClick }: BranchProps) {
  return (
    <div // NOSONAR(S6848) — see docs/plans/todo/2026-06_FEATURE_energy-canvas-keyboard-nav.md — spatial drag target; keyboard-nav design tracked there (real gap, not hidden)
      className="absolute"
      style={{ left: entity.positionX, top: entity.positionY, zIndex: view.cardZIndex, pointerEvents: 'auto' }}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 shadow-sm whitespace-nowrap cursor-move transition-shadow"
        style={{
          backgroundColor: view.colors.bg,
          borderColor: view.cardBorderColor,
          boxShadow: getRegularEntityBoxShadow(isSelected, isDragging),
          minWidth: 120,
        }}
      >
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: view.colors.dot }} />
        <div>
          {edit.isInlineEditing ? (
            <textarea
              ref={inlineInputRef}
              value={edit.inlineEditValue}
              onChange={e => edit.onInlineChange(e.target.value)}
              onBlur={edit.onInlineBlur}
              onKeyDown={edit.onInlineKeyDown}
              onClick={e => e.stopPropagation()}
              rows={1}
              className="text-sm font-medium text-gray-800 bg-transparent outline-none resize-none border-b border-indigo-400"
              style={{ minWidth: 80 }}
            />
          ) : (
            <p className="text-sm font-medium text-gray-800 leading-tight" style={{ userSelect: 'none' }}>
              {entity.roleLabel}
            </p>
          )}
          {!view.isWidget && (
            <p className="text-xs text-gray-500 leading-tight mt-0.5" style={{ userSelect: 'none' }}>
              {entity.entityType.replaceAll('_', ' ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function EnergyEntityCard({
  entity,
  isSelected,
  isDragging,
  isLinkSource,
  isInlineEditing,
  inlineEditValue,
  inlineInputRef,
  isOwner: _isOwner,
  onMouseDown,
  onClick,
  onDoubleClick,
  onInlineChange,
  onInlineBlur,
  onInlineKeyDown,
}: Readonly<EnergyEntityCardProps>) {
  const { t } = useTranslation('energy');
  const colors = ENERGY_COLORS[entity.energyState] ?? ENERGY_COLORS.NEUTRAL;
  const isWidget = ['TEXT', 'STICKY_NOTE', 'YOUTUBE_EMBED', 'OSM_EMBED'].includes(entity.entityType);

  const view: SharedCardView = {
    colors,
    isWidget,
    cardZIndex: getCardZIndex(isDragging, isSelected),
    cardBorderColor: getCardBorderColor(isSelected, isLinkSource, colors.border),
    cardBoxShadow: getCardBoxShadow(isDragging, isSelected),
  };
  const edit: InlineEditView = {
    isInlineEditing, inlineEditValue, onInlineChange, onInlineBlur, onInlineKeyDown,
  };
  const branchProps: BranchProps = {
    entity, isSelected, isDragging, isLinkSource, view, edit, inlineInputRef, onMouseDown, onClick, onDoubleClick, t,
  };

  if (entity.entityType === 'YOUTUBE_EMBED') return <YouTubeEmbedCard {...branchProps} />;
  if (entity.entityType === 'OSM_EMBED') return <OsmEmbedCard {...branchProps} />;
  if (entity.entityType === 'TEXT') return <TextNode {...branchProps} />;
  if (entity.entityType === 'STICKY_NOTE') return <StickyNote {...branchProps} />;
  return <RegularEntity {...branchProps} />;
}
