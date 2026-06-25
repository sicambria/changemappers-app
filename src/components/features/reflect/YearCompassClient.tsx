/// <reference types="styled-jsx" />
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import {
    DownloadIcon,
    UploadIcon,
    PrinterIcon,
    ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { YearCompassPastTab } from './YearCompassPastTab';
import { YearCompassFutureTab } from './YearCompassFutureTab';
import { YearCompassStrategyTab } from './YearCompassStrategyTab';

// ─── Types ────────────────────────────────────────────────────────────────────

interface YearCompassProps {
    userId: string;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function YearCompassClient({ userId: _userId }: Readonly<YearCompassProps>) {
    const { t } = useTranslation('reflect');
    const router = useRouter();
    const [currentTab, setCurrentTab] = useState<'past' | 'future' | 'strategy'>('past');
    const [chartData, setChartData] = useState([5, 5, 5, 5, 5, 5]);
    const [activeChallenge, setActiveChallenge] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    // Dynamic state
    const [habits, setHabits] = useState([{ signal: '', action: '', reward: '' }]);
    const [beliefs, setBeliefs] = useState([{ old: '', new: '' }]);
    const [premortems, setPremortems] = useState([{ if: '', outcome: '' }]);
    const [energyMonths, setEnergyMonths] = useState<Record<string, string>>({});
    const [challengeNotes, setChallengeNotes] = useState('');

    const calculateProgress = useCallback(() => {
        let score = 0;
        if (habits.some(h => h.action.trim())) score += 20;
        if (beliefs.some(b => b.new.trim())) score += 20;
        if (premortems.some(p => p.outcome.trim())) score += 20;
        if (Object.keys(energyMonths).length > 0) score += 20;
        setProgress(Math.min(score + 20, 100));
    }, [habits, beliefs, premortems, energyMonths]);

    useEffect(() => {
        calculateProgress();
    }, [calculateProgress]);

    const switchTab = (tab: 'past' | 'future' | 'strategy') => {
        setCurrentTab(tab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const addHabit = () => setHabits([...habits, { signal: '', action: '', reward: '' }]);
    const addBelief = () => setBeliefs([...beliefs, { old: '', new: '' }]);
    const addPreMortem = () => setPremortems([...premortems, { if: '', outcome: '' }]);

    const updateHabit = (idx: number, field: string, val: string) => {
        setHabits(habits.map((h, i) => i === idx ? { ...h, [field]: val } : h));
    };

    const updateBelief = (idx: number, field: string, val: string) => {
        setBeliefs(beliefs.map((b, i) => i === idx ? { ...b, [field]: val } : b));
    };

    const updatePreMortem = (idx: number, field: string, val: string) => {
        setPremortems(premortems.map((p, i) => i === idx ? { ...p, [field]: val } : p));
    };

    return (
        <div className="bg-journal-bg min-h-screen text-journal-text font-sans selection:bg-journal-secondary selection:text-white pb-12">
            {/* Top Bar */}
            <div className="bg-journal-dark text-white text-center py-3 px-4 shadow-md print:hidden">
                <p className="text-sm font-medium">
                    {t('yearCompass.officialLink')}
                    <a href="https://yearcompass.com/hu/" target="_blank" className="underline text-journal-secondary hover:text-white transition-colors font-bold ml-2">
                        {t('yearCompass.officialSiteName')}
                    </a>
                </p>
            </div>

            {/* Back Button Top */}
            <div className="max-w-6xl mx-auto px-4 pt-6 print:hidden">
                <button
                    onClick={() => router.push('/reflect')}
                    className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-journal-secondary transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                    {t('yearCompass.actions.backToReflect')}
                </button>
            </div>

            {/* Header */}
            <header className="bg-white dark:bg-zinc-900/50 border dark:border-white/5 shadow-sm sticky top-0 z-50 print:relative print:shadow-none">
                <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                        <h1 className="font-serif text-2xl font-bold text-gray-800">
                            {t('yearCompass.title').includes(' ')
                                ? (<>
                                    {t('yearCompass.title').split(' ')[0]}
                                    <span className="text-journal-secondary ml-1">{t('yearCompass.title').slice(t('yearCompass.title').indexOf(' ') + 1).replace('+', '')}</span>
                                    <span className="text-journal-accent text-lg ml-1">+</span>
                                  </>)
                                : t('yearCompass.title')
                            }
                        </h1>
                        <p className="text-xs text-gray-500 tracking-widest uppercase">{t('yearCompass.subtitle')}</p>
                    </div>

                    <nav className="hidden md:flex space-x-6 items-center">
                        {(['past', 'future', 'strategy'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => switchTab(tab)}
                                className={cn(
                                    "px-4 py-2 transition-all rounded-md text-sm font-medium",
                                    currentTab === tab
                                        ? "bg-journal-secondary text-journal-dark shadow-sm font-bold"
                                        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                                )}
                            >
                                {t(`yearCompass.tabs.${tab}`)}
                            </button>
                        ))}
                    </nav>

                    <div className="flex flex-wrap items-center gap-3 print:hidden">
                        <button className="text-gray-500 hover:text-journal-secondary transition p-2 border rounded flex items-center gap-2 text-sm bg-white">
                            <DownloadIcon className="h-4 w-4" /> {t('yearCompass.actions.save')}
                        </button>
                        <button className="text-gray-500 hover:text-journal-secondary transition p-2 border rounded flex items-center gap-2 text-sm bg-white">
                            <UploadIcon className="h-4 w-4" /> {t('yearCompass.actions.load')}
                        </button>
                        <div className="h-6 w-px bg-gray-300 mx-2" />
                        <button onClick={() => globalThis.print()} className="bg-journal-dark text-white px-4 py-2 rounded hover:bg-gray-700 transition flex items-center gap-2 shadow-sm">
                            <PrinterIcon className="h-4 w-4" /> {t('yearCompass.actions.print')}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-12 space-y-16">
                {/* Intro */}
                <section className="text-center space-y-4">
                    <h2 className="font-serif text-3xl">{t('yearCompass.introTitle')}</h2>
                    <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
                        {t('yearCompass.introDesc')}
                    </p>
                </section>

                {/* TAB 1: PAST */}
                {currentTab === 'past' && (
                    <YearCompassPastTab
                        chartData={chartData}
                        onChartDataChange={setChartData}
                        onFinishPast={() => switchTab('future')}
                    />
                )}

                {/* TAB 2: FUTURE */}
                {currentTab === 'future' && (
                    <YearCompassFutureTab onNext={() => switchTab('strategy')} />
                )}

                {/* TAB 3: STRATEGY */}
                {currentTab === 'strategy' && (
                    <YearCompassStrategyTab
                        progress={progress}
                        habits={habits}
                        beliefs={beliefs}
                        premortems={premortems}
                        energyMonths={energyMonths}
                        challengeNotes={challengeNotes}
                        activeChallenge={activeChallenge}
                        onAddHabit={addHabit}
                        onUpdateHabit={updateHabit}
                        onAddBelief={addBelief}
                        onUpdateBelief={updateBelief}
                        onAddPreMortem={addPreMortem}
                        onUpdatePreMortem={updatePreMortem}
                        onEnergyMonthsChange={setEnergyMonths}
                        onChallengeNotesChange={setChallengeNotes}
                        onActiveChallengeChange={setActiveChallenge}
                    />
                )}
            </main>

            <footer className="max-w-6xl mx-auto px-4 text-center py-20 print:hidden space-y-4 border-t border-journal-light mt-20">
<p className="font-serif text-gray-400 italic">
  {t('yearCompass.footer.brandName')} • <span className="text-journal-secondary">{t('yearCompass.footer.motto')}</span>
</p>
<div className="text-[10px] text-gray-300 space-y-1">
  <p>
    <a href="https://yearcompass.com/hu/" target="_blank" className="hover:underline text-journal-secondary">{t('yearCompass.footer.website')}</a>
    <span> • {t('yearCompass.footer.credit')}</span>
  </p>
  <p>{t('yearCompass.footer.license')}</p>
</div>
            </footer>

            <style jsx>{`
                .journal-textarea {
                    background: transparent;
                    border: none;
                    border-bottom: 1px dashed #A0A0A0;
                    padding: 8px 0;
                    font-family: inherit;
                    font-size: 14px;
                    line-height: 1.6;
                    color: #333;
                    transition: all 0.2s;
                    width: 100%;
                }
                .journal-textarea:focus {
                    outline: none;
                    border-bottom: 1px solid #D4A373;
                    background: rgba(212, 163, 115, 0.02);
                }
                .journal-input {
                    background: transparent;
                    border: none;
                    border-bottom: 1px dashed #A0A0A0;
                    padding: 4px 0;
                    font-family: inherit;
                    color: inherit;
                    transition: border-color 0.2s;
                }
                .journal-input:focus {
                    outline: none;
                    border-bottom: 1px solid #D4A373;
                }
                .section-divider {
                   border-bottom: 1px solid #E6E2DD;
                   margin: 2rem 0;
                   opacity: 0.5;
                }
                @media print {
                   .print-hidden { display: none !important; }
                }
            `}</style>
        </div>
    );
}
