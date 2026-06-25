'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type NodeType = 'PROBLEM' | 'PATTERN' | 'ROOT_CAUSE' | 'SOLUTION_PATTERN' | 'INTERVENTION';

interface CanvasContextMenuProps {
  position: { x: number; y: number };
  visible: boolean;
  onSelect: (type: NodeType) => void;
  onClose: () => void;
}

const NODE_TYPE_VALUES: { value: NodeType; color: string }[] = [
  { value: 'PROBLEM', color: 'bg-red-500' },
  { value: 'PATTERN', color: 'bg-amber-500' },
  { value: 'ROOT_CAUSE', color: 'bg-orange-500' },
  { value: 'SOLUTION_PATTERN', color: 'bg-green-500' },
  { value: 'INTERVENTION', color: 'bg-blue-500' },
];

export function CanvasContextMenu({ position, visible, onSelect, onClose }: Readonly<CanvasContextMenuProps>) {
  const { t } = useTranslation('canvas');
  const menuRef = useRef<HTMLDivElement>(null);

  const NODE_TYPES = NODE_TYPE_VALUES.map(nt => ({
    ...nt,
    label: t(`contextMenu.nodeTypes.${nt.value}`),
  }));
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + NODE_TYPES.length) % NODE_TYPES.length);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % NODE_TYPES.length);
          break;
        case 'Enter':
          e.preventDefault();
          onSelect(NODE_TYPES[selectedIndex].value);
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
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
  }, [visible, selectedIndex, onSelect, onClose, NODE_TYPES]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-700 shadow-2xl p-2 min-w-[180px]"
      style={{ left: position.x, top: position.y }}
    >
      <div className="text-xs text-slate-500 px-3 py-1 mb-1">{t('contextMenu.selectType')}</div>
      {NODE_TYPES.map((type, index) => (
        <button
          key={type.value}
          onClick={() => onSelect(type.value)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            index === selectedIndex
              ? 'bg-indigo-600 text-white'
              : 'text-slate-200 hover:bg-slate-700'
          }`}
        >
          <span className={`w-3 h-3 rounded ${type.color}`} />
          {type.label}
        </button>
      ))}
    </div>
  );
}
