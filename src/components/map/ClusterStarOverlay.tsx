'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { safeAvatarCssUrl } from '@/lib/safe-avatar-url';
import { ARCHETYPE_RING_COLOR } from '@/lib/archetype-colors';
import { Z_CLASS } from '@/lib/z-index';

export interface StarEntity {
    id: string;
    type: string;
    name: string;
    avatar?: string | null;
    archetypes?: string[];
    isRecentlyActive?: boolean;
}

interface Props {
    /** Container-relative pixel position of the cluster center */
    x: number;
    y: number;
    entities: StarEntity[];
    onSelect: (entity: StarEntity) => void;
    onClose: () => void;
}

const ENTITY_TYPE_COLOR: Record<string, string> = {
    community: '#facc15',
    event:     '#f43f5e',
    issue:     '#ef4444',
    signal:    '#a855f7',
    individual:'#38bdf8',
};

function EntityTypeIcon({ type }: Readonly<{ type: string }>) {
    const props = { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2.5 };
    if (type === 'community') return (
        <svg {...props}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    );
    if (type === 'event') return (
        <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    );
    if (type === 'issue') return (
        <svg {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>
    );
    if (type === 'signal') return (
        <svg {...props}><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/></svg>
    );
    return null;
}

const MAX_SLOTS = 8;
// Radius of the star ring (px from center)
const INDIVIDUAL_RADIUS = 96;
const OTHER_RADIUS = 84;

export function ClusterStarOverlay({ x, y, entities, onSelect, onClose }: Readonly<Props>) {
    const { t } = useTranslation('map');

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        globalThis.addEventListener('keydown', handler);
        return () => globalThis.removeEventListener('keydown', handler);
    }, [onClose]);

    // Sort: individuals first, then others
    const sorted = [...entities].sort((a, b) => {
        if (a.type === 'individual' && b.type !== 'individual') return -1;
        if (a.type !== 'individual' && b.type === 'individual') return 1;
        return 0;
    });

    const overflow = sorted.length > MAX_SLOTS ? sorted.length - (MAX_SLOTS - 1) : 0;
    const slots = overflow > 0 ? sorted.slice(0, MAX_SLOTS - 1) : sorted;
    const totalSlots = slots.length + (overflow > 0 ? 1 : 0);

    return (
        <>
            {/* Invisible backdrop to close on outside click */}
            <div
                className={`fixed inset-0 ${Z_CLASS.mapBackdrop}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Star container — positioned at cluster center */}
            <div // NOSONAR(S6819) — role="dialog"+aria-modal kept; native dialog relies on showModal()/close() which jsdom does not implement, breaking modal tests — focus/Esc handled in JS
                className={`absolute ${Z_CLASS.mapOverlay} pointer-events-none`}
                style={{ left: x, top: y }}
                role="dialog"
                aria-label={t('accessibility.clusterMembers')}
            >
                {/* Entity cards in radial layout */}
                {slots.map((entity, i) => {
                    const isIndividual = entity.type === 'individual';
                    const SIZE = isIndividual ? 44 : 36;
                    const RADIUS = isIndividual ? INDIVIDUAL_RADIUS : OTHER_RADIUS;

                    const angleDeg = (i / totalSlots) * 360 - 90; // start from top
                    const angleRad = (angleDeg * Math.PI) / 180;
                    const ex = Math.cos(angleRad) * RADIUS;
                    const ey = Math.sin(angleRad) * RADIUS;

                    const avatar = isIndividual ? safeAvatarCssUrl(entity.avatar) : null;
                    const initials = entity.name.charAt(0).toUpperCase();
                    const ringColor = isIndividual
                        ? (ARCHETYPE_RING_COLOR[entity.archetypes?.[0] ?? ''] ?? '#38bdf8')
                        : (ENTITY_TYPE_COLOR[entity.type] ?? '#9ca3af');
                    const bgColor = avatar
                        ? `url('${avatar}') center/cover no-repeat, ${ringColor}`
                        : ringColor;
                    const shortName = entity.name.length > 10
                        ? entity.name.slice(0, 9) + '…'
                        : entity.name;

                    return (
                        <div // NOSONAR(S6819) — role="button" trigger with nested button children (button-in-button blocked); a native button wrapper would be invalid button-in-button — role=button + tabIndex + keyboard handlers cover interaction
                            key={entity.id}
                            className="absolute pointer-events-auto flex flex-col items-center cursor-pointer group"
                            style={{
                                left: ex,
                                top: ey,
                                transform: 'translate(-50%, -50%)',
                            }}
                            onClick={(e) => { e.stopPropagation(); onSelect(entity); onClose(); }}
                            title={entity.name}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onSelect(entity); onClose(); } }}
                        >
                            <div
                                className="rounded-full flex items-center justify-center text-white font-bold overflow-hidden transition-transform duration-150 group-hover:scale-110"
                                style={{
                                    width: SIZE,
                                    height: SIZE,
                                    background: bgColor,
                                    boxShadow: `0 0 0 2.5px white, 0 0 0 5px ${ringColor}, 0 4px 14px rgba(0,0,0,0.55)`,
                                    fontSize: isIndividual ? 14 : 12,
                                    position: 'relative',
                                }}
                            >
                                {!avatar && (
                                    isIndividual
                                        ? initials
                                        : <EntityTypeIcon type={entity.type} />
                                )}
                                {/* Active indicator dot */}
                                {entity.isRecentlyActive && isIndividual && (
                                    <span
                                        className="absolute rounded-full bg-green-400 border border-white"
                                        style={{ width: 10, height: 10, bottom: 1, right: 1 }}
                                        aria-label={t('accessibility.recentlyActive')}
                                    />
                                )}
                            </div>
                            <span className="text-white text-[10px] font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] leading-tight mt-1 whitespace-nowrap max-w-[72px] text-center">
                                {shortName}
                            </span>
                        </div>
                    );
                })}

                {/* Overflow slot */}
                {overflow > 0 && (
                    <div
                        className="absolute pointer-events-auto flex flex-col items-center cursor-default"
                        style={{
                            left: Math.cos(((slots.length / totalSlots) * 360 - 90) * Math.PI / 180) * OTHER_RADIUS,
                            top:  Math.sin(((slots.length / totalSlots) * 360 - 90) * Math.PI / 180) * OTHER_RADIUS,
                            transform: 'translate(-50%, -50%)',
                        }}
                        title={`${overflow} more`}
                    >
                        <div
                            className="rounded-full flex items-center justify-center text-white font-bold"
                            style={{
                                width: 36,
                                height: 36,
                                background: 'rgba(15,23,42,0.85)',
                                boxShadow: '0 0 0 2.5px white, 0 4px 10px rgba(0,0,0,0.5)',
                                fontSize: 11,
                            }}
                        >
                            +{overflow}
                        </div>
                        <span className="text-white text-[10px] font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] leading-tight mt-1">
                            more
                        </span>
                    </div>
                )}

                {/* Central close button */}
                <button
                    className="absolute pointer-events-auto rounded-full bg-white/25 hover:bg-white/45 backdrop-blur-sm border border-white/60 text-white flex items-center justify-center transition-colors shadow-lg"
                    style={{
                        width: 32,
                        height: 32,
                        transform: 'translate(-50%, -50%)',
                    }}
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>
        </>
    );
}
