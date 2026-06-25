'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type EnergyEntity = {
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

interface EnergyEditSidebarProps {
  entity: EnergyEntity | null;
  isOpen: boolean;
  onClose: () => void;
  isOwner: boolean;
  onDelete: (id: string) => Promise<void>;
  onUpdate: (id: string, data: { roleLabel?: string; notes?: string; widgetContent?: string }) => Promise<void>;
}

const ENERGY_STATE_KEYS = [
  { value: 'EXTRACTIVE', labelKey: 'energyState.extractive', color: 'bg-red-500' },
  { value: 'REGENERATIVE', labelKey: 'energyState.regenerative', color: 'bg-emerald-500' },
  { value: 'NEUTRAL', labelKey: 'energyState.neutral', color: 'bg-gray-500' },
  { value: 'CONTESTED', labelKey: 'energyState.contested', color: 'bg-amber-500' },
  { value: 'CAPTURED', labelKey: 'energyState.captured', color: 'bg-purple-500' },
  { value: 'DEPLETED', labelKey: 'energyState.depleted', color: 'bg-slate-500' },
];

const SCALE_BAND_KEYS = [
  { value: 1, labelKey: 'editSidebar.scaleBand.planetary' },
  { value: 2, labelKey: 'editSidebar.scaleBand.supranational' },
  { value: 3, labelKey: 'editSidebar.scaleBand.national' },
  { value: 4, labelKey: 'editSidebar.scaleBand.stateRegional' },
  { value: 5, labelKey: 'editSidebar.scaleBand.bioregional' },
  { value: 6, labelKey: 'editSidebar.scaleBand.community' },
  { value: 7, labelKey: 'editSidebar.scaleBand.localGroup' },
];

const WIDGET_TYPES = new Set(['TEXT', 'STICKY_NOTE', 'YOUTUBE_EMBED', 'OSM_EMBED']);

export function EnergyEditSidebar({ entity, isOpen, onClose, isOwner, onDelete, onUpdate }: Readonly<EnergyEditSidebarProps>) {
  const { t } = useTranslation('energy');
  const [roleLabel, setRoleLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [widgetContent, setWidgetContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const roleSaveRef = useRef<NodeJS.Timeout | null>(null);
  const notesSaveRef = useRef<NodeJS.Timeout | null>(null);
  const widgetSaveRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (entity) {
      setRoleLabel(entity.roleLabel);
      setNotes(entity.notes ?? '');
      setWidgetContent(entity.widgetContent ?? '');
    }
  }, [entity?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    globalThis.addEventListener('keydown', handleEscape);
    return () => globalThis.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    const r = roleSaveRef;
    const n = notesSaveRef;
    const w = widgetSaveRef;
    return () => {
      if (r.current) clearTimeout(r.current);
      if (n.current) clearTimeout(n.current);
      if (w.current) clearTimeout(w.current);
    };
  }, []);

  const debounce = useCallback((ref: React.RefObject<NodeJS.Timeout | null>, fn: () => Promise<void>) => {
    if (ref.current) clearTimeout(ref.current);
    ref.current = setTimeout(async () => { setSaving(true); await fn(); setSaving(false); }, 600);
  }, []);

  const handleRoleLabelChange = useCallback((val: string) => {
    setRoleLabel(val);
    if (!entity || !isOwner) return;
    debounce(roleSaveRef, () => onUpdate(entity.id, { roleLabel: val.trim() || entity.roleLabel }));
  }, [entity, isOwner, debounce, onUpdate]);

  const handleNotesChange = useCallback((val: string) => {
    setNotes(val);
    if (!entity || !isOwner) return;
    debounce(notesSaveRef, () => onUpdate(entity.id, { notes: val }));
  }, [entity, isOwner, debounce, onUpdate]);

  const handleWidgetContentChange = useCallback((val: string) => {
    setWidgetContent(val);
    if (!entity || !isOwner) return;
    debounce(widgetSaveRef, () => onUpdate(entity.id, { widgetContent: val }));
  }, [entity, isOwner, debounce, onUpdate]);

  const handleDelete = async () => {
    if (!entity || !confirm(t('editSidebar.deleteConfirm'))) return;
    await onDelete(entity.id);
    onClose();
  };

  if (!entity) return null;

  const stateInfo = ENERGY_STATE_KEYS.find(s => s.value === entity.energyState) ?? ENERGY_STATE_KEYS[2];
  const scaleInfo = SCALE_BAND_KEYS.find(s => s.value === entity.scaleBandY) ?? SCALE_BAND_KEYS[3];
  const isWidget = WIDGET_TYPES.has(entity.entityType);

  const sidebarClasses = isMobile
    ? 'fixed bottom-0 left-0 right-0 max-h-[70vh] bg-white rounded-t-2xl border-t border-gray-200 z-50 transition-transform duration-300 ease-out shadow-2xl'
    : 'fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 z-50 transition-transform duration-300 ease-out shadow-xl';

  let transform: string;
  if (isOpen) { transform = 'translate-x-0 translate-y-0'; }
  else if (isMobile) { transform = 'translate-y-full'; }
  else { transform = 'translate-x-full'; }

  return (
    <div className={`${sidebarClasses} ${transform}`}>
      {isMobile && <div className="flex justify-center py-2"><div className="w-12 h-1.5 rounded-full bg-gray-300" /></div>}

      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">
          {isWidget ? entity.entityType.replaceAll('_', ' ') : t('editSidebar.editEntity')}
        </h2>
        <div className="flex items-center gap-2">
          {saving && <span className="text-xs text-indigo-400 animate-pulse">{t('editSidebar.saving')}</span>}
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-lg leading-none">×</button>
        </div>
      </div>

      <div className="p-4 overflow-y-auto" style={{ maxHeight: isMobile ? 'calc(70vh - 60px)' : 'calc(100vh - 60px)' }}>
        <div className="space-y-4">

          {/* Role label / title */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {isWidget ? t('editSidebar.label') : t('editSidebar.name')}
            </label>
            <input
              type="text"
              value={roleLabel}
              onChange={e => handleRoleLabelChange(e.target.value)}
              disabled={!isOwner}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-gray-100"
              placeholder={t('editSidebar.namePlaceholder')}
            />
          </div>

          {/* Description / notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('editSidebar.description')}</label>
            <textarea
              value={notes}
              onChange={e => handleNotesChange(e.target.value)}
              disabled={!isOwner}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-gray-100 resize-none"
              placeholder={t('editSidebar.descriptionPlaceholder')}
            />
          </div>

          {/* Widget content (YouTube/OSM) */}
          {(entity.entityType === 'YOUTUBE_EMBED' || entity.entityType === 'OSM_EMBED') && (
            <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            {entity.entityType === 'YOUTUBE_EMBED' ? t('editSidebar.youtubeUrl') : t('editSidebar.latLngCoordinates')}
          </label>
              <input
                type="text"
                value={widgetContent}
                onChange={e => handleWidgetContentChange(e.target.value)}
                disabled={!isOwner}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-gray-100"
                placeholder={entity.entityType === 'YOUTUBE_EMBED' ? t('editSidebar.youtubeUrlPlaceholder') : t('editSidebar.latLngPlaceholder')}
              />
            </div>
          )}

          {/* Energy state (non-widget only) */}
          {!isWidget && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('editSidebar.energyState')}</label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200">
                <span className={`w-3 h-3 rounded-full ${stateInfo.color}`} />
                <span className="text-sm text-gray-700">{t(stateInfo.labelKey)}</span>
              </div>
            </div>
          )}

          {/* Entity type (non-widget) */}
          {!isWidget && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('editSidebar.type')}</label>
              <div className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700">
                {entity.entityType.replaceAll('_', ' ')}
              </div>
            </div>
          )}

          {/* Scale band (non-widget) */}
          {!isWidget && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t('editSidebar.scaleBand')}</label>
              <div className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700">
                {t(scaleInfo.labelKey)}
              </div>
            </div>
          )}

          {/* Delete */}
          {isOwner && (
            <div className="pt-3 border-t border-gray-100">
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors border border-red-200"
              >
                {t('editSidebar.delete')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
