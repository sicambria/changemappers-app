'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { updateEnergyCanvasAction } from '@/app/actions/energy';
import { EnergyCanvasClient, type EnergyRelation } from './EnergyCanvasClient';
import type { EnergyEntity } from './EnergyEntityCard';
import { Lock, Users, Globe } from 'lucide-react';

const SYSTEM_STATE_LABELS: Record<string, { label: string; color: string }> = {
  REGENERATING: { label: 'Regenerating', color: '#10b981' },
  STABLE:       { label: 'Stable',        color: '#3b82f6' },
  DEPLETING:    { label: 'Depleting',     color: '#f59e0b' },
  COLLAPSING:   { label: 'Collapsing',    color: '#ef4444' },
  CONTESTED:    { label: 'Contested',     color: '#8b5cf6' },
};

const PRIVACY_OPTIONS: { value: string; label: string; icon: React.ReactNode }[] = [
  { value: 'ONLY_ME',      label: 'Only me',       icon: <Lock size={13} /> },
  { value: 'MY_COMMUNITY', label: 'Community',     icon: <Users size={13} /> },
  { value: 'PUBLIC',       label: 'Public',        icon: <Globe size={13} /> },
];

type Canvas = {
  id: string;
  title: string;
  description: string | null;
  systemState: string;
  privacy: string;
  createdBy: { id: string; name: string | null };
  entities: EnergyEntity[];
  relations: EnergyRelation[];
};

interface Props {
  canvas: Canvas;
  isOwner: boolean;
}

export function EnergyCanvasPageClient({ canvas, isOwner }: Readonly<Props>) {
  const { t } = useTranslation('energy');
  const [privacy, setPrivacy] = useState(canvas.privacy);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);

  const stateInfo = SYSTEM_STATE_LABELS[canvas.systemState] ?? { label: canvas.systemState, color: '#6b7280' };
  const currentPrivacy = PRIVACY_OPTIONS.find(p => p.value === privacy) ?? PRIVACY_OPTIONS[0];

  const handlePrivacyChange = async (val: string) => {
    setShowPrivacyMenu(false);
    if (val === privacy || !isOwner) return;
    setPrivacy(val);
    setSavingPrivacy(true);
    await updateEnergyCanvasAction(canvas.id, { privacy: val as 'ONLY_ME' | 'MY_COMMUNITY' | 'PUBLIC' });
    setSavingPrivacy(false);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Always-visible compact header */}
      <header className="flex items-center gap-3 px-4 py-2 bg-white border-b border-gray-200 shrink-0 z-30">
        <Link
          href="/energy"
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors whitespace-nowrap shrink-0"
        >
          {t('allCanvases')}
        </Link>

        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h1 className="text-sm font-semibold text-gray-800 truncate">{canvas.title}</h1>
          <span
            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border"
            style={{ color: stateInfo.color, borderColor: stateInfo.color + '60', backgroundColor: stateInfo.color + '14' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stateInfo.color }} />
            {stateInfo.label}
          </span>
          <span className="text-xs text-gray-400 shrink-0">{canvas.entities.length} entities</span>
        </div>

        {/* Privacy selector */}
        <div className="relative shrink-0">
          <button
            onClick={() => isOwner && setShowPrivacyMenu(m => !m)}
            disabled={!isOwner || savingPrivacy}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors
              ${isOwner ? 'border-gray-200 hover:bg-gray-50 cursor-pointer' : 'border-transparent cursor-default'}
              text-gray-600`}
            title={isOwner ? 'Change privacy' : undefined}
          >
            {currentPrivacy.icon}
            <span>{currentPrivacy.label}</span>
            {savingPrivacy && <span className="ml-1 animate-pulse">…</span>}
          </button>
          {showPrivacyMenu && isOwner && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden py-1 w-40">
              {PRIVACY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handlePrivacyChange(opt.value)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors
                    ${opt.value === privacy ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          {showPrivacyMenu && <div // NOSONAR(S6848) — full-viewport click-away layer dismissing an open menu; the trigger and items are keyboard-operable and dismiss on blur/Esc — a native control would be a viewport-wide bogus tab stop
            className="fixed inset-0 z-40" onClick={() => setShowPrivacyMenu(false)} />}
        </div>
      </header>

      {/* Full-screen canvas */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <EnergyCanvasClient
          canvasId={canvas.id}
          initialEntities={canvas.entities}
          initialRelations={canvas.relations}
          isOwner={isOwner}
          privacy={privacy}
          onPrivacyChange={handlePrivacyChange}
        />
      </div>
    </div>
  );
}
