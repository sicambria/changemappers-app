'use client';

import { useCallback, useEffect, useRef, useState, WheelEvent } from 'react';
import {
  createEnergyEntityAction,
  updateEnergyEntityAction,
  updateEnergyEntityPositionAction,
  softDeleteEnergyEntityAction,
} from '@/app/actions/energy/entity';
import {
  createEnergyRelationAction,
  softDeleteEnergyRelationAction,
} from '@/app/actions/energy/relation';
import { EnergyContextMenu } from './EnergyContextMenu';
import { EnergyEditSidebar } from './EnergyEditSidebar';
import { EnergyEntityCard, type EnergyEntity } from './EnergyEntityCard';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import {
  MousePointer2, Type, StickyNote, Link2, Youtube, MapPin, ZoomIn, ZoomOut, Maximize2, HelpCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type EnergyRelation = {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  energyFlow: string;
  powerDistance: string;
  informationFlow: string;
  consent: string;
  energyMagnitude: string;
  notes: string | null;
  deletedAt?: Date | null;
};

type Props = {
  canvasId: string;
  initialEntities: EnergyEntity[];
  initialRelations: EnergyRelation[];
  isOwner: boolean;
  privacy?: string;
  onPrivacyChange?: (p: string) => void;
};

type Tool = 'SELECT' | 'TEXT' | 'STICKY_NOTE' | 'LINK' | 'YOUTUBE' | 'OSM';

const DEFAULT_BAND_HEIGHT = 130;
const NUM_BANDS = 7;
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.08;

const SCALE_BANDS = [
  'canvas.scale.planetary',
  'canvas.scale.supranational',
  'canvas.scale.national',
  'canvas.scale.stateRegional',
  'canvas.scale.bioregional',
  'canvas.scale.community',
  'canvas.scale.localGroup',
];

const FLOW_COLORS: Record<string, { stroke: string; labelKey: string }> = {
  EXTRACTIVE_FLOW: { stroke: '#ef4444', labelKey: 'canvas.flow.extractive' },
  GENERATIVE_FLOW: { stroke: '#10b981', labelKey: 'canvas.flow.generative' },
  CAPTURED_FLOW: { stroke: '#8b5cf6', labelKey: 'canvas.flow.captured' },
  DIVERTED_FLOW: { stroke: '#f59e0b', labelKey: 'canvas.flow.diverted' },
};

function getBandTop(bandHeights: number[], bandIndex: number): number {
  return bandHeights.slice(0, bandIndex).reduce((a, b) => a + b, 0);
}

function getBandFromY(bandHeights: number[], y: number): number {
  let top = 0;
  for (let i = 0; i < bandHeights.length; i++) {
    top += bandHeights[i];
    if (y < top) return i + 1;
  }
  return bandHeights.length;
}

export function EnergyCanvasClient({
  canvasId, initialEntities, initialRelations, isOwner, privacy: _privacy, onPrivacyChange: _onPrivacyChange,
}: Readonly<Props>) {
  const { t } = useTranslation('energy');
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }); // §1B: mirror latest t for effects/callbacks below; no deps array on purpose
  const [entities, setEntities] = useState<EnergyEntity[]>(initialEntities.filter(e => !e.deletedAt));
  const [relations, setRelations] = useState<EnergyRelation[]>(initialRelations);
  const [bandHeights, setBandHeights] = useState<number[]>(Array(NUM_BANDS).fill(DEFAULT_BAND_HEIGHT));

  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [bandResizing, setBandResizing] = useState<number | null>(null);
  const [bandResizeStartY, setBandResizeStartY] = useState(0);
  const [bandResizeStartHeight, setBandResizeStartHeight] = useState(0);

  const [saving, setSaving] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editedEntity, setEditedEntity] = useState<EnergyEntity | null>(null);
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState('');

  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkTo, setLinkTo] = useState<string | null>(null);
  const [linkFlow, setLinkFlow] = useState<string>('GENERATIVE_FLOW');

  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [widgetTool, setWidgetTool] = useState<'YOUTUBE' | 'OSM' | null>(null);
  const [widgetPos, setWidgetPos] = useState({ x: 0, y: 0 });
  const [widgetInput, setWidgetInput] = useState('');

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 160, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [spaceDown, setSpaceDown] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>('SELECT');

  const viewportRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inlineInputRef = useRef<HTMLTextAreaElement>(null);
  const undoRedo = useUndoRedo();

  const totalCanvasHeight = bandHeights.reduce((a, b) => a + b, 0);

  // --- Coordinate helpers ---
  const clientToCanvas = useCallback((cx: number, cy: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (cx - rect.left - pan.x) / zoom, y: (cy - rect.top - pan.y) / zoom };
  }, [pan, zoom]);

  // --- Autosave ---
  const scheduleSave = useCallback((fn: () => Promise<unknown>) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      await fn();
      setSaving(false);
    }, 500);
  }, []);

  // --- Undo/Redo ---
  const handleUndo = useCallback(() => {
    const action = undoRedo.undo();
    if (!action) return;
    const p = action.payload as { id: string };
    const inv = action.inversePayload as { id: string; positionX: number; positionY: number; scaleBandY: number };
    if (action.type === 'CREATE_ENTITY') { setEntities(prev => prev.filter(e => e.id !== p.id)); softDeleteEnergyEntityAction(p.id); }
    if (action.type === 'MOVE_ENTITY') {
      setEntities(prev => prev.map(e => e.id === p.id ? { ...e, positionX: inv.positionX, positionY: inv.positionY, scaleBandY: inv.scaleBandY } : e));
      updateEnergyEntityPositionAction(p.id, { positionX: inv.positionX, positionY: inv.positionY, scaleBandY: inv.scaleBandY });
    }
    if (action.type === 'CREATE_RELATION') { setRelations(prev => prev.filter(r => r.id !== p.id)); softDeleteEnergyRelationAction(p.id); }
  }, [undoRedo]);

  const handleRedo = useCallback(() => {
    const action = undoRedo.redo();
    if (!action) return;
    const p = action.payload as { id: string; positionX: number; positionY: number; scaleBandY: number };
    if (action.type === 'MOVE_ENTITY') {
      setEntities(prev => prev.map(e => e.id === p.id ? { ...e, positionX: p.positionX, positionY: p.positionY, scaleBandY: p.scaleBandY } : e));
      updateEnergyEntityPositionAction(p.id, { positionX: p.positionX, positionY: p.positionY, scaleBandY: p.scaleBandY });
    }
  }, [undoRedo]);

  const handleDeleteEntity = useCallback(async (entityId: string) => {
    await softDeleteEnergyEntityAction(entityId);
    setEntities(prev => prev.filter(e => e.id !== entityId));
    setRelations(prev => prev.filter(r => r.fromEntityId !== entityId && r.toEntityId !== entityId));
    if (selectedEntity === entityId) setSelectedEntity(null);
    if (editedEntity?.id === entityId) { setEditedEntity(null); setSidebarOpen(false); }
  }, [selectedEntity, editedEntity]);

  // --- Keyboard ---
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === ' ' && !inlineEditId && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault(); setSpaceDown(true);
      }
      if (!isOwner) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); if (e.shiftKey) { handleRedo(); } else { handleUndo(); } }
      if (e.key === 'Delete' && selectedEntity && !inlineEditId) handleDeleteEntity(selectedEntity);
      if (e.key === 'Escape') { setShowContextMenu(false); setInlineEditId(null); setLinkFrom(null); setShowLinkModal(false); setShowWidgetModal(false); }
    };
    const up = (e: KeyboardEvent) => { if (e.key === ' ') setSpaceDown(false); };
    globalThis.addEventListener('keydown', down);
    globalThis.addEventListener('keyup', up);
    return () => { globalThis.removeEventListener('keydown', down); globalThis.removeEventListener('keyup', up); };
  }, [isOwner, selectedEntity, inlineEditId, handleUndo, handleRedo, handleDeleteEntity]);

  useEffect(() => { return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); }; }, []);

  // Inline edit focus
  useEffect(() => { if (inlineEditId && inlineInputRef.current) { inlineInputRef.current.focus(); inlineInputRef.current.select(); } }, [inlineEditId]);

  // --- Smooth zoom ---
  const applyZoom = useCallback((delta: number, focalX: number, focalY: number) => {
    setZoom(prev => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return next;
      const fx = (focalX - rect.left - pan.x) / prev;
      const fy = (focalY - rect.top - pan.y) / prev;
      setPan({ x: focalX - rect.left - fx * next, y: focalY - rect.top - fy * next });
      return next;
    });
  }, [pan]);

  const handleWheel = useCallback((e: WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    applyZoom(e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP, e.clientX, e.clientY);
  }, [applyZoom]);

  const handleZoomIn = () => applyZoom(ZOOM_STEP * 3, window.innerWidth / 2, window.innerHeight / 2);
  const handleZoomOut = () => applyZoom(-ZOOM_STEP * 3, window.innerWidth / 2, window.innerHeight / 2);
  const handleResetView = () => { setZoom(1); setPan({ x: 160, y: 0 }); };

  // --- Mouse handlers ---
  const handleViewportMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && spaceDown)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan, spaceDown]);

  const handleEntityMouseDown = useCallback((e: React.MouseEvent, entityId: string) => {
    if (!isOwner || spaceDown || activeTool === 'LINK') return;
    e.preventDefault(); e.stopPropagation();
    const entity = entities.find(en => en.id === entityId);
    if (!entity) return;
    const cp = clientToCanvas(e.clientX, e.clientY);
    setDragging(entityId);
    setDragOffset({ x: cp.x - entity.positionX, y: cp.y - entity.positionY });
  }, [entities, isOwner, spaceDown, activeTool, clientToCanvas]);

  const handleBandResizeMouseDown = useCallback((e: React.MouseEvent, bandIndex: number) => {
    e.preventDefault(); e.stopPropagation();
    setBandResizing(bandIndex);
    setBandResizeStartY(e.clientY);
    setBandResizeStartHeight(bandHeights[bandIndex]);
  }, [bandHeights]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) { setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }); return; }

    if (bandResizing !== null) {
      const dy = (e.clientY - bandResizeStartY) / zoom;
      const newHeight = Math.max(60, bandResizeStartHeight + dy);
      setBandHeights(prev => prev.map((h, i) => i === bandResizing ? newHeight : h));
      return;
    }

    if (!dragging) return;
    const cp = clientToCanvas(e.clientX, e.clientY);
    const newX = Math.round(Math.max(0, cp.x - dragOffset.x));
    const newY = Math.round(Math.max(0, cp.y - dragOffset.y));
    const newBand = getBandFromY(bandHeights, newY + 22); // 22 = half entity height approx

    // Dynamic band expansion: expand band if entity drags near bottom
    const bandIdx = newBand - 1;
    const bandTop = getBandTop(bandHeights, bandIdx);
    const withinBand = newY - bandTop;
    if (withinBand > bandHeights[bandIdx] - 50) {
      setBandHeights(prev => prev.map((h, i) => i === bandIdx ? h + 20 : h));
    }

    setEntities(prev => prev.map(en => en.id === dragging ? { ...en, positionX: newX, positionY: newY, scaleBandY: newBand } : en));
    scheduleSave(() => updateEnergyEntityPositionAction(dragging, { positionX: newX, positionY: newY, scaleBandY: newBand }));
  }, [dragging, dragOffset, clientToCanvas, isPanning, panStart, bandResizing, bandResizeStartY, bandResizeStartHeight, zoom, bandHeights, scheduleSave]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) { setIsPanning(false); return; }
    if (bandResizing !== null) { setBandResizing(null); return; }
    if (dragging) {
      const entity = entities.find(e => e.id === dragging);
      const original = initialEntities.find(e => e.id === dragging);
      if (entity && original && (entity.positionX !== original.positionX || entity.positionY !== original.positionY)) {
        undoRedo.pushAction({
          type: 'MOVE_ENTITY',
          payload: { id: dragging, positionX: entity.positionX, positionY: entity.positionY, scaleBandY: entity.scaleBandY },
          inversePayload: { id: dragging, positionX: original.positionX, positionY: original.positionY, scaleBandY: original.scaleBandY },
        });
      }
    }
    setDragging(null);
  }, [dragging, entities, initialEntities, undoRedo, isPanning, bandResizing]);

  // --- Canvas click: tool actions ---
  const handleCanvasClick = useCallback(async (e: React.MouseEvent) => {
    if (!isOwner || dragging || isPanning || spaceDown || showContextMenu) return;
    if (activeTool === 'SELECT') {
      setSelectedEntity(null); setSidebarOpen(false); setEditedEntity(null); setLinkFrom(null);
      return;
    }
    if (activeTool === 'TEXT' || activeTool === 'STICKY_NOTE') {
      const pos = clientToCanvas(e.clientX, e.clientY);
      const type = activeTool === 'TEXT' ? 'TEXT' : 'STICKY_NOTE';
      const band = getBandFromY(bandHeights, pos.y);
      const result = await createEnergyEntityAction({
        canvasId, roleLabel: activeTool === 'TEXT' ? 'Text' : 'Note',
        entityType: type as never, primaryScale: 'COMMUNITY', energyState: 'NEUTRAL',
        visibility: 'VISIBLE', energyMagnitude: 'MEDIUM', energyRate: 'CHRONIC',
        internalPower: 'DISTRIBUTED', voiceAccess: 'FULL', boundaryPermeability: 'SEMI_PERMEABLE',
        selfDetermination: 'PRESENT', positionX: Math.round(pos.x), positionY: Math.round(pos.y), scaleBandY: band,
      });
      if (result.success && result.data) {
        const newEnt: EnergyEntity = { id: result.data.id, roleLabel: activeTool === 'TEXT' ? 'Text' : 'Note', entityType: type, primaryScale: 'COMMUNITY', energyState: 'NEUTRAL', positionX: Math.round(pos.x), positionY: Math.round(pos.y), scaleBandY: band, notes: null, widgetContent: null, deletedAt: null };
        setEntities(prev => [...prev, newEnt]);
        undoRedo.pushAction({ type: 'CREATE_ENTITY', payload: { id: result.data.id }, inversePayload: { id: result.data.id } });
        setInlineEditId(result.data.id); setInlineEditValue(newEnt.roleLabel);
      }
      setActiveTool('SELECT');
    }
    if (activeTool === 'YOUTUBE' || activeTool === 'OSM') {
      const pos = clientToCanvas(e.clientX, e.clientY);
      setWidgetPos(pos); setWidgetTool(activeTool); setWidgetInput(''); setShowWidgetModal(true);
      setActiveTool('SELECT');
    }
  }, [isOwner, activeTool, canvasId, clientToCanvas, dragging, isPanning, spaceDown, showContextMenu, bandHeights, undoRedo]);

  const handleCreateWidget = useCallback(async () => {
    if (!widgetTool) return;
    setShowWidgetModal(false);
    const band = getBandFromY(bandHeights, widgetPos.y);
    const result = await createEnergyEntityAction({
      canvasId, roleLabel: widgetTool === 'YOUTUBE' ? 'YouTube' : 'Map',
      entityType: widgetTool === 'YOUTUBE' ? 'YOUTUBE_EMBED' : 'OSM_EMBED',
      primaryScale: 'COMMUNITY', energyState: 'NEUTRAL',
      visibility: 'VISIBLE', energyMagnitude: 'MEDIUM', energyRate: 'CHRONIC',
      internalPower: 'DISTRIBUTED', voiceAccess: 'FULL', boundaryPermeability: 'SEMI_PERMEABLE',
      selfDetermination: 'PRESENT', positionX: Math.round(widgetPos.x), positionY: Math.round(widgetPos.y),
      scaleBandY: band, widgetContent: widgetInput,
    } as never);
    if (result.success && result.data) {
      const isYoutube = widgetTool === 'YOUTUBE';
      const newEnt: EnergyEntity = { id: result.data.id, roleLabel: isYoutube ? 'YouTube' : 'Map', entityType: isYoutube ? 'YOUTUBE_EMBED' : 'OSM_EMBED', primaryScale: 'COMMUNITY', energyState: 'NEUTRAL', positionX: Math.round(widgetPos.x), positionY: Math.round(widgetPos.y), scaleBandY: band, notes: null, widgetContent: widgetInput, deletedAt: null };
      setEntities(prev => [...prev, newEnt]);
      undoRedo.pushAction({ type: 'CREATE_ENTITY', payload: { id: result.data.id }, inversePayload: { id: result.data.id } });
    }
  }, [widgetTool, widgetPos, widgetInput, canvasId, bandHeights, undoRedo]);

  // --- Context menu (right-click: create energy entity) ---
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!isOwner) { return; } e.preventDefault();
    setContextMenuPos({ x: e.clientX, y: e.clientY }); setShowContextMenu(true);
  }, [isOwner]);

  const handleCreateEntity = useCallback(async (entityType: string, energyState: string) => {
    setShowContextMenu(false);
    const pos = clientToCanvas(contextMenuPos.x, contextMenuPos.y);
    const band = getBandFromY(bandHeights, pos.y);
    const newLabel = tRef.current('canvas.newEntityType', { type: entityType.replaceAll('_', ' ').toLowerCase() });
    const result = await createEnergyEntityAction({
      canvasId, roleLabel: newLabel,
      entityType: entityType as never, primaryScale: 'COMMUNITY', energyState: energyState as never,
      visibility: 'VISIBLE', energyMagnitude: 'MEDIUM', energyRate: 'CHRONIC', internalPower: 'DISTRIBUTED',
      voiceAccess: 'FULL', boundaryPermeability: 'SEMI_PERMEABLE', selfDetermination: 'PRESENT',
      positionX: Math.round(pos.x), positionY: Math.round(pos.y), scaleBandY: band,
    });
    if (result.success && result.data) {
      const newEnt: EnergyEntity = { id: result.data.id, roleLabel: newLabel, entityType, primaryScale: 'COMMUNITY', energyState, positionX: Math.round(pos.x), positionY: Math.round(pos.y), scaleBandY: band, notes: null, widgetContent: null, deletedAt: null };
      setEntities(prev => [...prev, newEnt]);
      undoRedo.pushAction({ type: 'CREATE_ENTITY', payload: { id: result.data.id }, inversePayload: { id: result.data.id } });
      setSelectedEntity(result.data.id); setEditedEntity(newEnt); setSidebarOpen(true);
    }
  }, [canvasId, contextMenuPos, clientToCanvas, bandHeights, undoRedo]);

  // --- Entity click ---
  const handleEntityClick = useCallback((e: React.MouseEvent, entityId: string) => {
    e.stopPropagation();
    if (activeTool === 'LINK' && isOwner) {
      if (!linkFrom) { setLinkFrom(entityId); return; }
      if (linkFrom !== entityId) { setLinkTo(entityId); setShowLinkModal(true); }
      return;
    }
    const entity = entities.find(en => en.id === entityId);
    if (!entity) return;
    if (selectedEntity === entityId) { setSelectedEntity(null); setSidebarOpen(false); setEditedEntity(null); }
    else { setSelectedEntity(entityId); setEditedEntity(entity); setSidebarOpen(true); }
  }, [entities, selectedEntity, activeTool, isOwner, linkFrom]);

  const handleEntityDoubleClick = useCallback((e: React.MouseEvent, entityId: string) => {
    if (!isOwner) { return; } e.stopPropagation();
    const entity = entities.find(en => en.id === entityId);
    if (!entity) return;
    setInlineEditId(entityId); setInlineEditValue(entity.roleLabel);
  }, [entities, isOwner]);

  // --- Inline edit ---
  const handleInlineBlur = useCallback(async () => {
    if (!inlineEditId) return;
    const trimmed = inlineEditValue.trim() || 'Text';
    await updateEnergyEntityAction(inlineEditId, { roleLabel: trimmed });
    setEntities(prev => prev.map(e => e.id === inlineEditId ? { ...e, roleLabel: trimmed } : e));
    if (editedEntity?.id === inlineEditId) setEditedEntity(prev => prev ? { ...prev, roleLabel: trimmed } : null);
    setInlineEditId(null);
  }, [inlineEditId, inlineEditValue, editedEntity]);

  // --- Update entity (from sidebar) ---
  const handleUpdateEntity = useCallback(async (id: string, data: { roleLabel?: string; notes?: string; widgetContent?: string }) => {
    await updateEnergyEntityAction(id, data);
    setEntities(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    if (editedEntity?.id === id) setEditedEntity(prev => prev ? { ...prev, ...data } : null);
  }, [editedEntity]);

  // --- Create relation ---
  const handleCreateRelation = useCallback(async () => {
    if (!linkFrom || !linkTo) return;
    setShowLinkModal(false);
    const result = await createEnergyRelationAction({
      canvasId, fromEntityId: linkFrom, toEntityId: linkTo,
      energyFlow: linkFlow as never, powerDistance: 'PEER', informationFlow: 'TRANSPARENT', consent: 'AGREED',
      visibility: 'VISIBLE', energyMagnitude: 'MEDIUM',
    });
    if (result.success && result.data) {
      const newRel: EnergyRelation = { id: result.data.id, fromEntityId: linkFrom, toEntityId: linkTo, energyFlow: linkFlow, powerDistance: 'PEER', informationFlow: 'TRANSPARENT', consent: 'AGREED', energyMagnitude: 'MEDIUM', notes: null };
      setRelations(prev => [...prev, newRel]);
      undoRedo.pushAction({ type: 'CREATE_RELATION', payload: { id: result.data.id }, inversePayload: { id: result.data.id } });
    }
    setLinkFrom(null); setLinkTo(null);
  }, [canvasId, linkFrom, linkTo, linkFlow, undoRedo]);

  const handleDeleteRelation = useCallback(async (relationId: string) => {
    await softDeleteEnergyRelationAction(relationId);
    setRelations(prev => prev.filter(r => r.id !== relationId));
  }, []);

  // --- Render SVG relations ---
  const renderRelations = () => relations.map(rel => {
    const from = entities.find(e => e.id === rel.fromEntityId);
    const to = entities.find(e => e.id === rel.toEntityId);
    if (!from || !to) return null;
    const fx = from.positionX + 60; const fy = from.positionY + 22;
    const tx = to.positionX + 60;   const ty = to.positionY + 22;
    const mx = (fx + tx) / 2;       const my = (fy + ty) / 2;
    const flowInfo = FLOW_COLORS[rel.energyFlow] ?? { stroke: '#6b7280', labelKey: 'canvas.flow.unknown' };
    const dx = tx - fx; const dy = ty - fy; const len = Math.hypot(dx, dy) || 1;
    const arrowX = tx - (dx / len) * 12; const arrowY = ty - (dy / len) * 12;
    return (
      <g key={rel.id} className="group" style={{ cursor: isOwner ? 'pointer' : 'default' }}>
        <line x1={fx} y1={fy} x2={arrowX} y2={arrowY} stroke={flowInfo.stroke} strokeWidth="2" strokeOpacity="0.7" markerEnd={`url(#arrow-${rel.energyFlow})`} />
        <rect x={mx - 30} y={my - 9} width={60} height={18} rx={4} fill="white" fillOpacity="0.85" />
      <text x={mx} y={my + 4} textAnchor="middle" fontSize="9" fill={flowInfo.stroke} className="pointer-events-none select-none font-medium">
        {t(flowInfo.labelKey)}
        </text>
        {isOwner && (
          <rect x={mx - 30} y={my - 9} width={60} height={18} rx={4} fill="transparent" onClick={e => { e.stopPropagation(); handleDeleteRelation(rel.id); }} />
        )}
      </g>
    );
  });

  const gridSize = 24;
  const gridOffsetX = ((pan.x % (gridSize * zoom)) + gridSize * zoom) % (gridSize * zoom);
  const gridOffsetY = ((pan.y % (gridSize * zoom)) + gridSize * zoom) % (gridSize * zoom);
  let cursorClass: string;
  if (spaceDown || isPanning) { cursorClass = 'cursor-grab'; }
  else if (bandResizing !== null) { cursorClass = 'cursor-ns-resize'; }
  else if (activeTool === 'TEXT' || activeTool === 'STICKY_NOTE' || activeTool === 'YOUTUBE' || activeTool === 'OSM') { cursorClass = 'cursor-crosshair'; }
  else if (activeTool === 'LINK') { cursorClass = 'cursor-cell'; }
  else { cursorClass = 'cursor-default'; }

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-gray-50">
      {/* Left toolbar */}
      <aside className="flex flex-col items-center gap-1 px-1.5 py-3 bg-white border-r border-gray-200 shadow-sm z-20 shrink-0">
      <ToolButton icon={<MousePointer2 size={18} />} label={t('canvas.toolbar.select')} active={activeTool === 'SELECT'} onClick={() => { setActiveTool('SELECT'); setLinkFrom(null); }} />
      <ToolButton icon={<Type size={18} />} label={t('canvas.toolbar.text')} active={activeTool === 'TEXT'} onClick={() => setActiveTool('TEXT')} />
      <ToolButton icon={<StickyNote size={18} />} label={t('canvas.toolbar.stickyNote')} active={activeTool === 'STICKY_NOTE'} onClick={() => setActiveTool('STICKY_NOTE')} />
      <ToolButton icon={<Link2 size={18} />} label={t('canvas.toolbar.connect')} active={activeTool === 'LINK'} onClick={() => { setActiveTool('LINK'); setLinkFrom(null); }} />
        <div className="w-8 h-px bg-gray-200 my-1" />
      <ToolButton icon={<Youtube size={18} />} label={t('canvas.toolbar.youtubeEmbed')} active={activeTool === 'YOUTUBE'} onClick={() => setActiveTool('YOUTUBE')} />
      <ToolButton icon={<MapPin size={18} />} label={t('canvas.toolbar.osmMapEmbed')} active={activeTool === 'OSM'} onClick={() => setActiveTool('OSM')} />
        <div className="flex-1" />
        <div className="w-8 h-px bg-gray-200 my-1" />
        <ToolButton icon={<ZoomIn size={18} />} label={t('canvas.toolbar.zoomIn')} active={false} onClick={handleZoomIn} />
        <div className="text-xs text-gray-500 font-mono w-10 text-center">{Math.round(zoom * 100)}%</div>
      <ToolButton icon={<ZoomOut size={18} />} label={t('canvas.toolbar.zoomOut')} active={false} onClick={handleZoomOut} />
      <ToolButton icon={<Maximize2 size={18} />} label={t('canvas.toolbar.resetView')} active={false} onClick={handleResetView} />
        <div className="w-8 h-px bg-gray-200 my-1" />
        <div className="relative">
          <ToolButton icon={<HelpCircle size={18} />} label={t('canvas.toolbar.help')} active={showHelp} onClick={() => setShowHelp(h => !h)} />
          {showHelp && (
            <div className="absolute left-full top-0 ml-2 bg-white rounded-xl border border-gray-200 shadow-xl p-4 w-64 text-xs text-gray-600 z-50">
            <h4 className="font-semibold text-gray-800 mb-2 text-sm">{t('canvas.help.title')}</h4>
            <ul className="space-y-1.5">
              <li><kbd className="bg-gray-100 px-1 rounded">{t('canvas.help.rightClick')}</kbd> {t('canvas.help.rightClickDesc')}</li>
              <li><kbd className="bg-gray-100 px-1 rounded">{t('canvas.help.doubleClick')}</kbd> {t('canvas.help.doubleClickDesc')}</li>
              <li><kbd className="bg-gray-100 px-1 rounded">{t('canvas.help.space')}</kbd> {t('canvas.help.spaceDesc')}</li>
              <li><kbd className="bg-gray-100 px-1 rounded">{t('canvas.help.scroll')}</kbd> {t('canvas.help.scrollDesc')}</li>
              <li><kbd className="bg-gray-100 px-1 rounded">{t('canvas.help.drag')}</kbd> {t('canvas.help.dragDesc')}</li>
              <li><kbd className="bg-gray-100 px-1 rounded">{t('common:shortcuts.undo', 'Ctrl+Z')}</kbd> {t('canvas.help.undo')} / <kbd className="bg-gray-100 px-1 rounded">{t('common:shortcuts.redo', 'Ctrl+Shift+Z')}</kbd> {t('canvas.help.redo')}</li>
              <li><kbd className="bg-gray-100 px-1 rounded">{t('canvas.help.delete')}</kbd> {t('canvas.help.deleteDesc')}</li>
              </ul>
            </div>
          )}
        </div>
      </aside>

      {/* Canvas viewport */}
      <div // NOSONAR(S6848) — see docs/plans/todo/2026-06_FEATURE_energy-canvas-keyboard-nav.md — spatial drag target; keyboard-nav design tracked there (real gap, not hidden)
        ref={viewportRef}
        className={`relative flex-1 overflow-hidden select-none ${cursorClass}`}
        style={{
          backgroundImage: `radial-gradient(circle, #cbd5e1 1px, transparent 1px)`,
          backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
          backgroundPosition: `${gridOffsetX}px ${gridOffsetY}px`,
          backgroundColor: '#f9fafb',
          touchAction: 'none',
        }}
        onWheel={handleWheel}
        onMouseDown={handleViewportMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
        onClick={handleCanvasClick}
      >
        {/* Transformed canvas */}
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', position: 'absolute', top: 0, left: 0, width: '8000px', height: `${totalCanvasHeight}px` }}>
          {/* SVG defs + relations */}
          <svg className="absolute inset-0 pointer-events-none overflow-visible" style={{ width: '100%', height: '100%', zIndex: 5 }}>
            <defs>
              {Object.entries(FLOW_COLORS).map(([key, val]) => (
                <marker key={key} id={`arrow-${key}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill={val.stroke} fillOpacity="0.7" />
                </marker>
              ))}
            </defs>
            {renderRelations()}
          </svg>

          {/* Band rows */}
          {SCALE_BANDS.map((label, index) => {
            const top = getBandTop(bandHeights, index);
            const h = bandHeights[index];
            const isEven = index % 2 === 0;
            return (
              <div key={label} className="absolute left-0 right-0 pointer-events-none" style={{ top, height: h, backgroundColor: isEven ? 'rgba(248,250,252,0.55)' : 'rgba(241,245,249,0.55)', zIndex: 0 }}>
                <div className="absolute left-3 top-3">
                  <span className="text-xs font-medium uppercase tracking-wider select-none" style={{ color: '#94a3b8' }}>{t(label)}</span>
                </div>
                {/* Resize handle */}
                <div // NOSONAR(S6848) — see docs/plans/todo/2026-06_FEATURE_energy-canvas-keyboard-nav.md — spatial drag target; keyboard-nav design tracked there (real gap, not hidden)
                  className="absolute bottom-0 left-0 right-0 pointer-events-auto cursor-ns-resize group"
                  style={{ height: 8, zIndex: 15 }}
                  onMouseDown={(e) => handleBandResizeMouseDown(e, index)}
                >
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200 group-hover:bg-indigo-400 group-hover:h-0.5 transition-all" />
                </div>
              </div>
            );
          })}

          {/* Entities */}
          {entities.map(entity => (
            <EnergyEntityCard
              key={entity.id}
              entity={entity}
              isSelected={selectedEntity === entity.id}
              isDragging={dragging === entity.id}
              isLinkSource={linkFrom === entity.id}
              isInlineEditing={inlineEditId === entity.id}
              inlineEditValue={inlineEditValue}
              inlineInputRef={inlineInputRef as React.RefObject<HTMLTextAreaElement>}
              isOwner={isOwner}
              onMouseDown={(e) => handleEntityMouseDown(e, entity.id)}
              onClick={(e) => handleEntityClick(e, entity.id)}
              onDoubleClick={(e) => handleEntityDoubleClick(e, entity.id)}
              onInlineChange={setInlineEditValue}
              onInlineBlur={handleInlineBlur}
              onInlineKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleInlineBlur(); }
                if (e.key === 'Escape') setInlineEditId(null);
                e.stopPropagation();
              }}
            />
          ))}
        </div>

        {/* Saving + hints */}
    {saving && <div className="absolute top-3 right-3 text-xs text-indigo-500 bg-white/90 border border-indigo-100 px-2 py-1 rounded-lg shadow animate-pulse z-30">{t('canvas.saving')}</div>}
    {activeTool !== 'SELECT' && (
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-500 bg-white/90 border border-gray-200 px-3 py-1.5 rounded-full shadow z-30 pointer-events-none">
        {activeTool === 'TEXT' && t('canvas.hint.clickToAddText')}
        {activeTool === 'STICKY_NOTE' && t('canvas.hint.clickToAddStickyNote')}
        {activeTool === 'LINK' && (linkFrom ? t('canvas.hint.clickTargetEntity') : t('canvas.hint.clickSourceEntity'))}
        {activeTool === 'YOUTUBE' && t('canvas.hint.clickToPlaceYoutube')}
        {activeTool === 'OSM' && t('canvas.hint.clickToPlaceOsm')}
      </div>
    )}
    {!isOwner && <div className="absolute bottom-4 right-4 text-xs text-gray-400 bg-white/80 border border-gray-200 px-2 py-1 rounded-lg shadow-sm pointer-events-none z-20">{t('canvas.viewOnly')}</div>}
      </div>

      {/* Context menu */}
      <EnergyContextMenu position={contextMenuPos} visible={showContextMenu} onSelect={handleCreateEntity} onClose={() => setShowContextMenu(false)} />

      {/* Edit sidebar */}
      <EnergyEditSidebar
        entity={editedEntity}
        isOpen={sidebarOpen}
        onClose={() => { setSidebarOpen(false); setEditedEntity(null); setSelectedEntity(null); }}
        isOwner={isOwner}
        onDelete={handleDeleteEntity}
        onUpdate={handleUpdateEntity}
      />

      {/* Link creation modal */}
      {showLinkModal && (
        <div // NOSONAR(S6848) — backdrop convenience mouse-dismiss; keyboard users close via the dialog's own close control — a native element here is a bogus tab stop
          className="fixed inset-0 bg-black/25 flex items-center justify-center z-50" onClick={() => { setShowLinkModal(false); setLinkFrom(null); setLinkTo(null); }}>
          <div // NOSONAR(S6848) — backdrop convenience mouse-dismiss; keyboard users close via the dialog's own close control — a native element here is a bogus tab stop
            className="bg-white rounded-2xl p-6 max-w-xs w-full mx-4 shadow-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-gray-900 mb-4">{t('canvas.linkModal.createRelation')}</h3>
            <div className="space-y-2 mb-4">
              {Object.entries(FLOW_COLORS).map(([key, val]) => (
                <button key={key} onClick={() => setLinkFlow(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border-2 text-sm transition-colors ${linkFlow === key ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: val.stroke }} />
                {t(val.labelKey)} {t('canvas.linkModal.flow')}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
        <button onClick={handleCreateRelation} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors">{t('canvas.linkModal.connect')}</button>
        <button onClick={() => { setShowLinkModal(false); setLinkFrom(null); setLinkTo(null); }} className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors">{t('canvas.linkModal.cancel')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Widget URL modal */}
      {showWidgetModal && (
        <div // NOSONAR(S6848) — backdrop convenience mouse-dismiss; keyboard users close via the dialog's own close control — a native element here is a bogus tab stop
          className="fixed inset-0 bg-black/25 flex items-center justify-center z-50" onClick={() => setShowWidgetModal(false)}>
          <div // NOSONAR(S6848) — backdrop convenience mouse-dismiss; keyboard users close via the dialog's own close control — a native element here is a bogus tab stop
            className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-gray-900 mb-1">{widgetTool === 'YOUTUBE' ? t('canvas.widgetModal.youtubeVideo') : t('canvas.widgetModal.openStreetMap')}</h3>
        <p className="text-xs text-gray-400 mb-4">{widgetTool === 'YOUTUBE' ? t('canvas.widgetModal.pasteYoutubeUrl') : t('canvas.widgetModal.enterCoordinates')}</p>
            <input autoFocus value={widgetInput} onChange={e => setWidgetInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { handleCreateWidget(); } if (e.key === 'Escape') { setShowWidgetModal(false); } }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={widgetTool === 'YOUTUBE' ? t('canvas.widgetModal.youtubePlaceholder') : t('canvas.widgetModal.osmPlaceholder')}
            />
            <div className="flex gap-2">
        <button onClick={handleCreateWidget} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors">{t('canvas.widgetModal.add')}</button>
        <button onClick={() => setShowWidgetModal(false)} className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors">{t('canvas.widgetModal.cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolButton({ icon, label, active, onClick, disabled }: Readonly<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void; disabled?: boolean }>) {
  const activeClass = active ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700';
  const disabledClass = disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer';
  return (
    <button onClick={onClick} disabled={disabled} title={label}
      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${activeClass} ${disabledClass}`}
    >{icon}</button>
  );
}
