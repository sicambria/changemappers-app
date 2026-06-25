'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

// ──────────────────────────────────────────────
// Step-2 options per orientation
// ──────────────────────────────────────────────

type Orientation = 'give' | 'receive' | 'sense';

const STEP2_OPTIONS: Record<Orientation, Array<{ emoji: string; labelKey: string; href: string }>> = {
  give: [
    { emoji: '🌱', labelKey: 'dashboard.compass.giveGrowth', href: '/growth/offer/new' },
    { emoji: '🎁', labelKey: 'dashboard.compass.giveContribute', href: '/contribute/offer/new' },
    { emoji: '⚡', labelKey: 'dashboard.compass.giveInitiative', href: '/tasks/initiative/new' },
  ],
  receive: [
    { emoji: '🌱', labelKey: 'dashboard.compass.receiveGrowth', href: '/growth' },
    { emoji: '🎁', labelKey: 'dashboard.compass.receiveContribute', href: '/contribute/find' },
  ],
  sense: [
    { emoji: '🗺️', labelKey: 'dashboard.compass.senseCanvas', href: '/canvas' },
    { emoji: '📊', labelKey: 'dashboard.compass.senseGraph', href: '/graph' },
    { emoji: '🌍', labelKey: 'dashboard.compass.sensePlanet', href: '/planet' },
  ],
};

const STEP1_OPTIONS: Array<{ key: Orientation; emoji: string; labelKey: string }> = [
    { key: 'give',    emoji: '🌱', labelKey: 'dashboard.compass.give' },
    { key: 'receive', emoji: '🫲', labelKey: 'dashboard.compass.receive' },
    { key: 'sense',   emoji: '🗺️', labelKey: 'dashboard.compass.sense' },
];

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export function EnergyCompassClient() {
    const { t } = useTranslation('common');
    const [dismissed, setDismissed] = useState(false);
    const [orientation, setOrientation] = useState<Orientation | null>(null);

    if (dismissed) return null;

    return (
        <div className="mb-6 rounded-2xl border border-emerald-500/25 bg-emerald-950/25 backdrop-blur-sm p-5">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="text-[10px] font-semibold text-emerald-400/70 uppercase tracking-widest mb-1">
                        {t('dashboard.compass.label')}
                    </p>
                    <p className="text-sm text-slate-200">
                        {orientation
                            ? t('dashboard.compass.step2Prompt')
                            : t('dashboard.compass.step1Prompt')}
                    </p>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="text-slate-500 hover:text-slate-300 text-xs ml-4 mt-0.5 transition-colors"
                    aria-label={t('dashboard.compass.dismiss')}
                >
                    ✕
                </button>
            </div>

            {orientation === null ? (
                <div className="flex flex-wrap gap-2">
                    {STEP1_OPTIONS.map((opt) => (
                        <button
                            key={opt.key}
                            onClick={() => setOrientation(opt.key)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-white/10 border border-white/10 text-slate-200 hover:bg-emerald-600/25 hover:border-emerald-400/30 hover:text-white transition-all"
                        >
                            {opt.emoji} {t(opt.labelKey)}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                        {STEP2_OPTIONS[orientation].map((opt) => (
                            <Link
                                key={opt.href}
                                href={opt.href}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-white/10 border border-white/10 text-slate-200 hover:bg-emerald-600/25 hover:border-emerald-400/30 hover:text-white transition-all"
                            >
                                {opt.emoji} {t(opt.labelKey)}
                            </Link>
                        ))}
                    </div>
                    <button
                        onClick={() => setOrientation(null)}
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        ← {t('dashboard.compass.back')}
                    </button>
                </div>
            )}
        </div>
    );
}
