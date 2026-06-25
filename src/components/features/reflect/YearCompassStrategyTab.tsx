'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import {
    PrinterIcon,
    ChevronLeft,
    UsersIcon,
    Wand2Icon,
    CompassIcon,
    BrainIcon,
    BatteryMediumIcon,
    LockIcon,
    LockOpenIcon,
    NetworkIcon,
    EyeIcon,
    LifeBuoyIcon,
    BellIcon,
    PlusIcon,
    CheckCircleIcon,
    CalendarIcon,
    GemIcon,
    CrosshairIcon,
    DumbbellIcon,
    BoxIcon,
    SmartphoneIcon,
    CoinsIcon,
    ZapIcon,
    PencilIcon,
    PlusCircleIcon,
    VolumeXIcon,
    StarIcon,
    LightbulbIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAJ", "JUN", "JUL", "AUG", "SZEP", "OKT", "NOV", "DEC"];

// ─── Local helper components ──────────────────────────────────────────────────

function StrategyModule({ title, badge, scienceTitle, scienceDesc, scienceIcon, children }: Readonly<{
    title: string;
    badge: string;
    scienceTitle: string;
    scienceDesc: string;
    scienceIcon: React.ReactNode;
    children: React.ReactNode;
}>) {
    const isBasic = badge.includes('Alap');
    return (
        <div className="relative space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
            {isBasic && <div className="absolute -left-4 top-0 bottom-0 w-1 bg-journal-secondary rounded-full" />}
            <div className="flex justify-between items-center bg-journal-bg py-2 sticky top-[150px] z-30">
                <h3 className="font-serif text-2xl font-bold">{title}</h3>
                <span className={cn(
                    "text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider",
                    isBasic ? "bg-journal-secondary text-white" : "bg-journal-accent text-white"
                )}>{badge}</span>
            </div>

            <div className="bg-journal-science/30 p-6 rounded-xl border border-indigo-100 flex gap-4 text-journal-science-text">
                <div className="mt-1 opacity-60">{scienceIcon}</div>
                <div className="space-y-1">
                    <h4 className="font-bold text-xs uppercase tracking-tight">{scienceTitle}</h4>
                    <p className="text-[10px] opacity-80 leading-relaxed">{scienceDesc}</p>
                </div>
            </div>

            <div className="bg-white p-10 rounded-xl shadow-sm border border-journal-light">
                {children}
            </div>
        </div>
    );
}

function RedirItem({ color, label, ph }: Readonly<{ color: string; label: string; ph: string }>) {
    return (
        <div className={cn("p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center border", color)}>
            <span className="text-[10px] font-bold uppercase w-16 text-center">{label}</span>
            <input type="text" className="journal-input w-full bg-white/40" placeholder={ph} />
        </div>
    );
}

// ─── Section components (each kept under the 80-line function budget) ───────────

function ProgressMeter({ progress }: Readonly<{ progress: number }>) {
    const { t } = useTranslation('reflect');
    return (
        <div className="sticky top-20 z-40 bg-white/95 backdrop-blur shadow-sm border-b border-journal-secondary p-6 rounded-xl print:hidden">
            <div className="flex justify-between items-end mb-3">
                <div className="space-y-1">
                    <h3 className="font-serif text-lg font-bold text-gray-800">{t('yearCompass.strategy.meter')}</h3>
                    <p className="text-xs">
                        {(() => {
                            if (progress < 30) return <><span className="mr-1">🌱</span> <span className="font-bold text-gray-600">{t('yearCompass.strategy.progress.beginnerTitle')}</span> {t('yearCompass.strategy.progress.beginner')}</>;
                            if (progress < 70) return <><span className="mr-1">🌿</span> <span className="font-bold text-journal-secondary">{t('yearCompass.strategy.progress.consciousTitle')}</span> {t('yearCompass.strategy.progress.conscious')}</>;
                            return <><span className="mr-1">🌳</span> <span className="font-bold text-green-600">{t('yearCompass.strategy.progress.masterTitle')}</span> {t('yearCompass.strategy.progress.master')}</>;
                        })()}
                    </p>
                </div>
                <div className="text-3xl font-bold text-journal-secondary">{progress}%</div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                    className={cn(
                        "h-3 rounded-full transition-all duration-1000 ease-in-out",
                        (() => {
                            if (progress < 30) return "bg-red-400";
                            if (progress < 70) return "bg-yellow-500";
                            return "bg-green-600";
                        })()
                    )}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}

function StrategyIntro() {
    const { t } = useTranslation('reflect');
    return (
        <div className="bg-journal-accent/10 p-10 rounded-xl border border-journal-accent flex flex-col md:flex-row gap-8">
            <BrainIcon className="h-12 w-12 text-journal-accent flex-shrink-0" />
            <div className="space-y-4">
                <h3 className="font-serif text-2xl font-bold">{t('yearCompass.strategy.introTitle')}</h3>
                <p className="text-gray-700 leading-relaxed">
                    {t('yearCompass.strategy.introDesc', {
                        basic: <span className="bg-journal-secondary text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold mx-1">{t('yearCompass.strategy.badges.basic')}</span>,
                        suggested: <span className="bg-journal-accent text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold mx-1">{t('yearCompass.strategy.badges.suggested')}</span>
                    })}
                </p>
            </div>
        </div>
    );
}

function IdentityModule() {
    const { t } = useTranslation('reflect');
    return (
        <StrategyModule
            title={t('yearCompass.strategy.modules.identity.title')}
            badge={t('yearCompass.strategy.badges.basic')}
            scienceTitle={t('yearCompass.strategy.science.behavior')}
            scienceDesc={t('yearCompass.strategy.science.behaviorDesc')}
            scienceIcon={<UsersIcon />}
        >
            <div className="space-y-6">
                <p className="text-gray-500 text-sm">{t('yearCompass.strategy.modules.identity.desc')}</p>
                <div className="grid md:grid-cols-2 gap-8">
                    {[0, 1].map(col => (
                        <div key={col} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">{t('yearCompass.strategy.modules.identity.goal')}</label>
                                <input type="text" className="journal-input w-full strategy-input" placeholder={t('yearCompass.strategy.modules.identity.goalPlaceholder')} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-journal-secondary uppercase">{t('yearCompass.strategy.modules.identity.identity')}</label>
                                <input type="text" className="journal-input w-full font-bold strategy-input" placeholder={t('yearCompass.strategy.modules.identity.identityPlaceholder')} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </StrategyModule>
    );
}

function IkigaiModule() {
    const { t } = useTranslation('reflect');
    return (
        <StrategyModule
            title={t('yearCompass.strategy.modules.ikigai.title')}
            badge={t('yearCompass.strategy.badges.suggested')}
            scienceTitle={t('yearCompass.strategy.science.ikigai')}
            scienceDesc={t('yearCompass.strategy.science.ikigaiDesc')}
            scienceIcon={<CompassIcon />}
        >
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h4 className="font-bold text-gray-700 flex items-center gap-2">
                        <GemIcon className="text-journal-secondary h-4 w-4" /> {t('yearCompass.strategy.modules.ikigai.values')}
                    </h4>
                    <p className="text-xs text-gray-500">{t('yearCompass.strategy.modules.ikigai.valuesDesc')}</p>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(n => (
                            <input key={n} type="text" className="journal-input w-full" placeholder={`${n}. ertek`} />
                        ))}
                    </div>
                </div>
                <div className="space-y-4">
                    <h4 className="font-bold text-gray-700 flex items-center gap-2">
                        <CrosshairIcon className="text-journal-accent h-4 w-4" /> {t('yearCompass.strategy.modules.ikigai.ikigai')}
                    </h4>
                    <p className="text-xs text-gray-500">{t('yearCompass.strategy.modules.ikigai.ikigaiDesc')}</p>
                    <textarea className="journal-textarea w-full min-h-[160px]" placeholder={t('yearCompass.strategy.modules.ikigai.ikigaiPlaceholder')} />
                </div>
            </div>
        </StrategyModule>
    );
}

function EnergyModule({ energyMonths, onEnergyMonthsChange }: Readonly<{
    energyMonths: Record<string, string>;
    onEnergyMonthsChange: (months: Record<string, string>) => void;
}>) {
    const { t } = useTranslation('reflect');
    return (
        <StrategyModule
            title={t('yearCompass.strategy.modules.energy.title')}
            badge={t('yearCompass.strategy.badges.basic')}
            scienceTitle={t('yearCompass.strategy.science.energy')}
            scienceDesc={t('yearCompass.strategy.science.energyDesc')}
            scienceIcon={<BatteryMediumIcon />}
        >
            <div className="space-y-10">
                <div className="space-y-6">
                    <h4 className="font-bold text-gray-700">{t('yearCompass.strategy.modules.energy.heading')}</h4>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                        {MONTHS.map(m => (
                            <div
                                key={m}
                                className={cn(
                                    "p-3 border rounded-lg transition-colors text-center",
                                    (() => {
                                        if (energyMonths[m] === 'Alacsony') return "bg-orange-100 border-orange-200";
                                        if (energyMonths[m] === 'Normal') return "bg-green-100 border-green-200";
                                        if (energyMonths[m] === 'Magas') return "bg-green-200 border-green-300";
                                        return "bg-white border-gray-100";
                                    })()
                                )}
                            >
                                <div className="font-bold text-gray-500 text-xs mb-1">{m}</div>
                                <select
                                    value={energyMonths[m] || ''}
                                    onChange={(e) => onEnergyMonthsChange({ ...energyMonths, [m]: e.target.value })}
                                    className="w-full text-[10px] bg-transparent focus:outline-none cursor-pointer"
                                >
                                    <option value="">{t('yearCompass.strategy.modules.energy.select')}</option>
                                    <option value="Normal">{t('yearCompass.strategy.modules.energy.normal')}</option>
                                    <option value="Magas">{t('yearCompass.strategy.modules.energy.high')}</option>
                                    <option value="Alacsony">{t('yearCompass.strategy.modules.energy.low')}</option>
                                </select>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-1">
                        <h4 className="font-serif text-xl font-bold">{t('yearCompass.strategy.modules.energy.redirection')}</h4>
                        <p className="text-sm text-gray-600">{t('yearCompass.strategy.modules.energy.redirectionDesc')}</p>
                    </div>
                    <div className="space-y-4">
                        <RedirItem color="bg-red-50" label={t('yearCompass.strategy.modules.energy.time')} ph={t('yearCompass.strategy.modules.energy.timePlaceholder')} />
                        <RedirItem color="bg-green-50" label={t('yearCompass.strategy.modules.energy.money')} ph={t('yearCompass.strategy.modules.energy.moneyPlaceholder')} />
                        <RedirItem color="bg-yellow-50" label={t('yearCompass.strategy.modules.energy.energyLabel')} ph={t('yearCompass.strategy.modules.energy.energyPlaceholder')} />
                    </div>
                </div>
            </div>
        </StrategyModule>
    );
}

function BeliefsModule({ beliefs, onUpdateBelief, onAddBelief }: Readonly<{
    beliefs: { old: string; new: string }[];
    onUpdateBelief: (idx: number, field: string, val: string) => void;
    onAddBelief: () => void;
}>) {
    const { t } = useTranslation('reflect');
    return (
        <StrategyModule
            title={t('yearCompass.strategy.modules.belief.title')}
            badge={t('yearCompass.strategy.badges.basic')}
            scienceTitle={t('yearCompass.strategy.science.cognitive')}
            scienceDesc={t('yearCompass.strategy.science.cognitiveDesc')}
            scienceIcon={<LightbulbIcon />}
        >
            <div className="space-y-8">
                {beliefs.map((b, idx) => (
                    <div key={idx /* NOSONAR(S6479) — append-only editor (onAddBelief); rows are never reordered/inserted/removed, so the index is a stable identity */} className="grid md:grid-cols-2 gap-8 border-b border-gray-100 pb-8 last:border-0 last:pb-0">
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-red-400 flex items-center gap-2"><LockIcon size={14} /> {t('yearCompass.strategy.modules.belief.old')}</h4>
                            <textarea
                                className="journal-textarea w-full"
                                value={b.old}
                                onChange={(e) => onUpdateBelief(idx, 'old', e.target.value)}
                                placeholder={t('yearCompass.strategy.modules.belief.oldPlaceholder')}
                            />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-sm font-bold text-green-600 flex items-center gap-2"><LockOpenIcon size={14} /> {t('yearCompass.strategy.modules.belief.new')}</h4>
                            <textarea
                                className="journal-textarea w-full"
                                value={b.new}
                                onChange={(e) => onUpdateBelief(idx, 'new', e.target.value)}
                                placeholder={t('yearCompass.strategy.modules.belief.newPlaceholder')}
                            />
                        </div>
                    </div>
                ))}
                <button onClick={onAddBelief} className="text-xs text-journal-accent border border-journal-accent rounded-full px-4 py-2 hover:bg-journal-accent hover:text-white transition flex items-center gap-2 mx-auto">
                    <PlusIcon size={14} /> {t('yearCompass.strategy.modules.belief.add')}
                </button>
            </div>
        </StrategyModule>
    );
}

function ConnectionsModule() {
    const { t } = useTranslation('reflect');
    return (
        <StrategyModule
            title={t('yearCompass.strategy.modules.connection.title')}
            badge={t('yearCompass.strategy.badges.suggested')}
            scienceTitle={t('yearCompass.strategy.science.system')}
            scienceDesc={t('yearCompass.strategy.science.systemDesc')}
            scienceIcon={<NetworkIcon />}
        >
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <h4 className="font-bold text-sm text-gray-700">{t('yearCompass.strategy.modules.connection.map')}</h4>
                    <p className="text-xs text-gray-500">{t('yearCompass.strategy.modules.connection.mapDesc')}</p>
                    <textarea className="journal-textarea w-full min-h-[120px]" placeholder={t('yearCompass.strategy.modules.connection.mapPlaceholder')} />
                </div>
                <div className="space-y-3">
                    <h4 className="font-bold text-sm text-gray-700">{t('yearCompass.strategy.modules.connection.zone')}</h4>
                    <p className="text-xs text-gray-500">{t('yearCompass.strategy.modules.connection.zoneDesc')}</p>
                    <textarea className="journal-textarea w-full min-h-[120px]" placeholder={t('yearCompass.strategy.modules.connection.zonePlaceholder')} />
                </div>
            </div>
        </StrategyModule>
    );
}

function VisualizationModule() {
    const { t } = useTranslation('reflect');
    return (
        <StrategyModule
            title={t('yearCompass.strategy.modules.visualization.title')}
            badge={t('yearCompass.strategy.badges.suggested')}
            scienceTitle={t('yearCompass.strategy.science.positive')}
            scienceDesc={t('yearCompass.strategy.science.positiveDesc')}
            scienceIcon={<EyeIcon />}
        >
            <div className="border-l-4 border-purple-300 pl-6 space-y-4">
                <h4 className="font-bold text-purple-800">{t('yearCompass.strategy.modules.visualization.date')}</h4>
                <p className="text-sm text-gray-600">{t('yearCompass.strategy.modules.visualization.desc')}</p>
                <textarea className="journal-textarea w-full min-h-[120px]" placeholder={t('yearCompass.strategy.modules.visualization.placeholder')} />
            </div>
        </StrategyModule>
    );
}

function PreMortemModule({ premortems, onUpdatePreMortem, onAddPreMortem }: Readonly<{
    premortems: { if: string; outcome: string }[];
    onUpdatePreMortem: (idx: number, field: string, val: string) => void;
    onAddPreMortem: () => void;
}>) {
    const { t } = useTranslation('reflect');
    return (
        <StrategyModule
            title={t('yearCompass.strategy.modules.premortem.title')}
            badge={t('yearCompass.strategy.badges.suggested')}
            scienceTitle={t('yearCompass.strategy.science.stress')}
            scienceDesc={t('yearCompass.strategy.science.stressDesc')}
            scienceIcon={<LifeBuoyIcon />}
        >
            <div className="space-y-8">
                <p className="text-sm text-gray-600">{t('yearCompass.strategy.modules.premortem.desc')}</p>
                {premortems.map((p, idx) => (
                    <div key={idx /* NOSONAR(S6479) — append-only editor (onAddPreMortem); rows are never reordered/inserted/removed, so the index is a stable identity */} className="bg-gray-50 p-6 rounded-xl font-mono space-y-4 border border-gray-100">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-blue-600 text-sm">{t('yearCompass.strategy.modules.premortem.if')}</span>
                                <span className="text-gray-400 text-xs">[{t('yearCompass.strategy.modules.premortem.obstacleLabel')}]</span>
                            </div>
                            <textarea
                                className="journal-textarea w-full"
                                value={p.if}
                                onChange={(e) => onUpdatePreMortem(idx, 'if', e.target.value)}
                                placeholder={t('yearCompass.strategy.modules.premortem.ifPlaceholder')}
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-green-600 text-sm">{t('yearCompass.strategy.modules.premortem.then')}</span>
                                <span className="text-gray-400 text-xs">[{t('yearCompass.strategy.modules.premortem.solutionLabel')}]</span>
                            </div>
                            <textarea
                                className="journal-textarea w-full"
                                value={p.outcome}
                                onChange={(e) => onUpdatePreMortem(idx, 'outcome', e.target.value)}
                                placeholder={t('yearCompass.strategy.modules.premortem.thenPlaceholder')}
                            />
                        </div>
                    </div>
                ))}
                <button onClick={onAddPreMortem} className="text-xs text-journal-accent border border-journal-accent rounded-full px-4 py-2 hover:bg-journal-accent hover:text-white transition flex items-center gap-2 mx-auto print:hidden">
                    <PlusIcon size={14} /> {t('yearCompass.strategy.modules.premortem.add')}
                </button>
            </div>
        </StrategyModule>
    );
}

function HabitsModule({ habits, onUpdateHabit, onAddHabit }: Readonly<{
    habits: { signal: string; action: string; reward: string }[];
    onUpdateHabit: (idx: number, field: string, val: string) => void;
    onAddHabit: () => void;
}>) {
    const { t } = useTranslation('reflect');
    return (
        <StrategyModule
            title={t('yearCompass.strategy.modules.habit.title')}
            badge={t('yearCompass.strategy.badges.basic')}
            scienceTitle={t('yearCompass.strategy.science.habit')}
            scienceDesc={t('yearCompass.strategy.science.habitDesc')}
            scienceIcon={<CalendarIcon />}
        >
            <div className="space-y-12">
                {habits.map((h, idx) => (
                    <div key={idx /* NOSONAR(S6479) — append-only editor (onAddHabit); rows are never reordered/inserted/removed, so the index is a stable identity */} className="flex flex-col md:flex-row gap-6 items-center text-center">
                        <div className="flex-1 w-full p-6 border-2 border-dashed border-gray-100 rounded-xl space-y-3 bg-white">
                            <BellIcon className="mx-auto text-journal-secondary" />
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase">{t('yearCompass.strategy.modules.habit.signal')}</h4>
                            <input type="text" className="journal-input w-full text-center" value={h.signal} onChange={(e) => onUpdateHabit(idx, 'signal', e.target.value)} placeholder={t('yearCompass.strategy.modules.habit.signalPlaceholder')} />
                        </div>
                        <div className="flex-1 w-full p-8 border border-journal-accent rounded-xl space-y-4 bg-journal-accent/5 shadow-inner">
                            <Wand2Icon className="mx-auto text-journal-accent" />
                            <h4 className="text-xs font-bold uppercase">{t('yearCompass.strategy.modules.habit.action')}</h4>
                            <input type="text" className="journal-input w-full text-center font-bold" value={h.action} onChange={(e) => onUpdateHabit(idx, 'action', e.target.value)} placeholder={t('yearCompass.strategy.modules.habit.actionPlaceholder')} />
                        </div>
                        <div className="flex-1 w-full p-6 border-2 border-dashed border-gray-100 rounded-xl space-y-3 bg-white">
                            <StarIcon className="mx-auto text-yellow-500" />
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase">{t('yearCompass.strategy.modules.habit.reward')}</h4>
                            <input type="text" className="journal-input w-full text-center" value={h.reward} onChange={(e) => onUpdateHabit(idx, 'reward', e.target.value)} placeholder={t('yearCompass.strategy.modules.habit.rewardPlaceholder')} />
                        </div>
                    </div>
                ))}
                <button onClick={onAddHabit} className="text-xs text-journal-accent border border-journal-accent rounded-full px-4 py-2 hover:bg-journal-accent hover:text-white transition flex items-center gap-2 mx-auto">
                    <PlusIcon size={14} /> {t('yearCompass.strategy.modules.habit.add')}
                </button>
            </div>
        </StrategyModule>
    );
}

function ChallengesSection({ activeChallenge, onActiveChallengeChange, challengeNotes, onChallengeNotesChange }: Readonly<{
    activeChallenge: string | null;
    onActiveChallengeChange: (id: string | null) => void;
    challengeNotes: string;
    onChallengeNotesChange: (notes: string) => void;
}>) {
    const { t } = useTranslation('reflect');
    const challenges = [
        { id: 'c1', icon: <VolumeXIcon className="text-purple-500" />, label: t('yearCompass.strategy.modules.extra.c1'), desc: t('yearCompass.strategy.modules.extra.c1desc') },
        { id: 'c2', icon: <DumbbellIcon className="text-red-500" />, label: t('yearCompass.strategy.modules.extra.c2'), desc: t('yearCompass.strategy.modules.extra.c2desc') },
        { id: 'c3', icon: <BoxIcon className="text-blue-500" />, label: t('yearCompass.strategy.modules.extra.c3'), desc: t('yearCompass.strategy.modules.extra.c3desc') },
        { id: 'c4', icon: <SmartphoneIcon className="text-green-500" />, label: t('yearCompass.strategy.modules.extra.c4'), desc: t('yearCompass.strategy.modules.extra.c4desc') },
        { id: 'c5', icon: <CoinsIcon className="text-yellow-500" />, label: t('yearCompass.strategy.modules.extra.c5'), desc: t('yearCompass.strategy.modules.extra.c5desc') },
        { id: 'c6', icon: <ZapIcon className="text-gray-700" />, label: t('yearCompass.strategy.modules.extra.c6'), desc: t('yearCompass.strategy.modules.extra.c6desc') },
        { id: 'c7', icon: <PencilIcon className="text-orange-500" />, label: t('yearCompass.strategy.modules.extra.c7'), desc: t('yearCompass.strategy.modules.extra.c7desc') },
        { id: 'c8', icon: <PlusCircleIcon className="text-gray-500" />, label: t('yearCompass.strategy.modules.extra.c8'), desc: t('yearCompass.strategy.modules.extra.c8desc') },
    ];
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-serif text-xl font-bold">{t('yearCompass.strategy.modules.extra.title')}</h3>
            </div>
            <p className="text-sm text-gray-500">{t('yearCompass.strategy.modules.extra.desc')}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {challenges.map(ch => (
                    <button
                        key={ch.id}
                        onClick={() => onActiveChallengeChange(activeChallenge === ch.id ? null : ch.id)}
                        className={cn(
                            "bg-white p-4 rounded-lg shadow-sm text-left border transition-all hover:shadow-md",
                            activeChallenge === ch.id ? "border-journal-accent bg-journal-accent/5" : "border-transparent"
                        )}
                    >
                        <div className="mb-2">{ch.icon}</div>
                        <h4 className="font-bold text-sm">{ch.label}</h4>
                    </button>
                ))}
            </div>
            {activeChallenge && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-gray-400 text-sm text-gray-700">
                        {challenges.find(c => c.id === activeChallenge)?.desc}
                    </div>
                    <div className="bg-white p-6 rounded-lg border-l-4 border-journal-secondary space-y-3">
                        <h4 className="font-bold text-sm">{t('yearCompass.strategy.modules.extra.notes')}</h4>
                        <textarea
                            className="journal-textarea w-full min-h-[80px]"
                            value={challengeNotes}
                            onChange={(e) => onChallengeNotesChange(e.target.value)}
                            placeholder={t('yearCompass.strategy.modules.extra.notesPlaceholder')}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function FinishingStrategy() {
    const { t } = useTranslation('reflect');
    const router = useRouter();
    return (
        <div className="bg-white p-16 rounded-xl shadow-lg text-center space-y-8 border-2 border-journal-light">
            <div className="space-y-4">
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
                <h3 className="font-serif text-3xl">{t('yearCompass.actions.ready')}</h3>
                <p className="text-gray-500 max-w-lg mx-auto">{t('yearCompass.actions.readyDesc')}</p>
            </div>
            <button onClick={() => globalThis.print()} className="bg-journal-dark text-white px-10 py-4 rounded-lg hover:bg-gray-800 transition flex items-center gap-3 mx-auto shadow-md font-bold text-lg">
                <PrinterIcon /> {t('yearCompass.actions.printPdf')}
            </button>
            <div className="pt-4 no-print">
                <button
                    onClick={() => router.push('/reflect')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-journal-secondary transition-colors mx-auto"
                >
                    <ChevronLeft className="h-4 w-4" />
                    {t('yearCompass.actions.backToReflect')}
                </button>
            </div>
        </div>
    );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface YearCompassStrategyTabProps {
    progress: number;
    habits: { signal: string; action: string; reward: string }[];
    beliefs: { old: string; new: string }[];
    premortems: { if: string; outcome: string }[];
    energyMonths: Record<string, string>;
    challengeNotes: string;
    activeChallenge: string | null;
    onAddHabit: () => void;
    onUpdateHabit: (idx: number, field: string, val: string) => void;
    onAddBelief: () => void;
    onUpdateBelief: (idx: number, field: string, val: string) => void;
    onAddPreMortem: () => void;
    onUpdatePreMortem: (idx: number, field: string, val: string) => void;
    onEnergyMonthsChange: (months: Record<string, string>) => void;
    onChallengeNotesChange: (notes: string) => void;
    onActiveChallengeChange: (id: string | null) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function YearCompassStrategyTab({
    progress,
    habits,
    beliefs,
    premortems,
    energyMonths,
    challengeNotes,
    activeChallenge,
    onAddHabit,
    onUpdateHabit,
    onAddBelief,
    onUpdateBelief,
    onAddPreMortem,
    onUpdatePreMortem,
    onEnergyMonthsChange,
    onChallengeNotesChange,
    onActiveChallengeChange,
}: Readonly<YearCompassStrategyTabProps>) {
    return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ProgressMeter progress={progress} />
            <StrategyIntro />
            <IdentityModule />
            <IkigaiModule />
            <EnergyModule energyMonths={energyMonths} onEnergyMonthsChange={onEnergyMonthsChange} />
            <BeliefsModule beliefs={beliefs} onUpdateBelief={onUpdateBelief} onAddBelief={onAddBelief} />
            <ConnectionsModule />
            <VisualizationModule />
            <PreMortemModule premortems={premortems} onUpdatePreMortem={onUpdatePreMortem} onAddPreMortem={onAddPreMortem} />
            <HabitsModule habits={habits} onUpdateHabit={onUpdateHabit} onAddHabit={onAddHabit} />
            <ChallengesSection
                activeChallenge={activeChallenge}
                onActiveChallengeChange={onActiveChallengeChange}
                challengeNotes={challengeNotes}
                onChallengeNotesChange={onChallengeNotesChange}
            />
            <FinishingStrategy />
        </div>
    );
}
