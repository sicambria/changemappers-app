'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type EntityType = 'INDIVIDUAL' | 'HOUSEHOLD' | 'WORKING_GROUP' | 'COMMUNITY' | 'INSTITUTION' | 'CORPORATION' | 'NORM' | 'COMMONS' | 'INFRASTRUCTURE' | 'NARRATIVE' | 'BIOREGION' | 'NATION' | 'TREATY_BODY';
type EnergyStateType = 'EXTRACTIVE' | 'REGENERATIVE' | 'NEUTRAL' | 'CONTESTED' | 'DEPLETED' | 'CAPTURED';

interface EnergyContextMenuProps {
  position: { x: number; y: number };
  visible: boolean;
  onSelect: (entityType: string, energyState: string) => void;
  onClose: () => void;
}

const ENTITY_TYPE_KEYS: { value: EntityType; labelKey: string }[] = [
  { value: 'INDIVIDUAL', labelKey: 'entityType.individual' },
  { value: 'HOUSEHOLD', labelKey: 'entityType.household' },
  { value: 'WORKING_GROUP', labelKey: 'entityType.workingGroup' },
  { value: 'COMMUNITY', labelKey: 'entityType.community' },
  { value: 'INSTITUTION', labelKey: 'entityType.institution' },
  { value: 'CORPORATION', labelKey: 'entityType.corporation' },
  { value: 'NORM', labelKey: 'entityType.norm' },
  { value: 'COMMONS', labelKey: 'entityType.commons' },
  { value: 'INFRASTRUCTURE', labelKey: 'entityType.infrastructure' },
  { value: 'NARRATIVE', labelKey: 'entityType.narrative' },
  { value: 'BIOREGION', labelKey: 'entityType.bioregion' },
  { value: 'NATION', labelKey: 'entityType.nation' },
  { value: 'TREATY_BODY', labelKey: 'entityType.treatyBody' },
];

const ENERGY_STATE_KEYS: { value: EnergyStateType; labelKey: string; color: string }[] = [
  { value: 'EXTRACTIVE', labelKey: 'energyState.extractive', color: 'bg-red-500' },
  { value: 'REGENERATIVE', labelKey: 'energyState.regenerative', color: 'bg-emerald-500' },
  { value: 'NEUTRAL', labelKey: 'energyState.neutral', color: 'bg-gray-500' },
  { value: 'CONTESTED', labelKey: 'energyState.contested', color: 'bg-amber-500' },
  { value: 'CAPTURED', labelKey: 'energyState.captured', color: 'bg-purple-500' },
  { value: 'DEPLETED', labelKey: 'energyState.depleted', color: 'bg-slate-500' },
];

export function EnergyContextMenu({ position, visible, onSelect, onClose }: Readonly<EnergyContextMenuProps>) {
  const { t } = useTranslation('energy');
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(0);
  const [selectedStateIndex, setSelectedStateIndex] = useState(0);
  const [phase, setPhase] = useState<'type' | 'state'>('type');

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const items = phase === 'type' ? ENTITY_TYPE_KEYS : ENERGY_STATE_KEYS;
      const setIndex = phase === 'type' ? setSelectedTypeIndex : setSelectedStateIndex;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setIndex(prev => (prev - 1 + items.length) % items.length);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setIndex(prev => (prev + 1) % items.length);
          break;
        case 'ArrowLeft':
          if (phase === 'state') {
            e.preventDefault();
            setPhase('type');
          }
          break;
        case 'ArrowRight':
          if (phase === 'type') {
            e.preventDefault();
            setPhase('state');
          }
          break;
        case 'Enter':
          e.preventDefault();
          if (phase === 'type') {
            setPhase('state');
          } else {
            onSelect(ENTITY_TYPE_KEYS[selectedTypeIndex].value, ENERGY_STATE_KEYS[selectedStateIndex].value);
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (phase === 'state') {
            setPhase('type');
          } else {
            onClose();
          }
          break;
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      globalThis.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // `t` removed (§1B): this effect only (re)binds keydown/mousedown listeners and never calls t;
    // translations are read in render. Keeping t here re-bound the listeners on every t re-identity.
  }, [visible, phase, selectedTypeIndex, selectedStateIndex, onSelect, onClose]);

  useEffect(() => {
    setSelectedTypeIndex(0);
    setSelectedStateIndex(0);
    setPhase('type');
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-700 shadow-2xl p-2 min-w-[200px] flex gap-2"
      style={{ left: position.x, top: position.y }}
    >
      <div className="flex-1">
        <div className="text-xs text-slate-500 px-3 py-1 mb-1">{t('contextMenu.entityType')}</div>
        <div className="max-h-64 overflow-y-auto">
          {ENTITY_TYPE_KEYS.map((type, index) => (
            <button
              key={type.value}
              onClick={() => {
                setSelectedTypeIndex(index);
                setPhase('state');
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                index === selectedTypeIndex && phase === 'type'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-200 hover:bg-slate-700'
              }`}
            >
              {t(type.labelKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="w-px bg-slate-700" />

      <div className="flex-1">
        <div className="text-xs text-slate-500 px-3 py-1 mb-1">{t('contextMenu.energyState')}</div>
        <div className="space-y-1">
          {ENERGY_STATE_KEYS.map((state, index) => (
            <button
              key={state.value}
              onClick={() => onSelect(ENTITY_TYPE_KEYS[selectedTypeIndex].value, state.value)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                index === selectedStateIndex && phase === 'state'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-200 hover:bg-slate-700'
              }`}
            >
              <span className={`w-3 h-3 rounded ${state.color}`} />
              {t(state.labelKey)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
