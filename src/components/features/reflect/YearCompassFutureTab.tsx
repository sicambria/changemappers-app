'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    HeartIcon,
    BanIcon,
    TargetIcon,
    UsersIcon,
    GiftIcon,
    CompassIcon,
    ArrowRightIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Local helper components ──────────────────────────────────────────────────

function MagicBox({ icon, title, desc, ph, color }: Readonly<{
    icon: React.ReactNode;
    title: string;
    desc: string;
    ph: string;
    color: string;
}>) {
    return (
        <div className={cn("bg-white p-6 rounded-xl border-t-4 shadow-sm space-y-4", color)}>
            <div className="flex items-center gap-3">
                {icon}
                <h4 className="font-bold text-lg">{title}</h4>
            </div>
            <p className="text-[10px] text-gray-500 uppercase font-medium">{desc}</p>
            <div className="space-y-3">
                {[1, 2, 3].map(n => (
                    <input key={n} type="text" className="journal-input w-full" placeholder={ph} />
                ))}
            </div>
        </div>
    );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface YearCompassFutureTabProps {
    onNext: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function YearCompassFutureTab({ onNext }: Readonly<YearCompassFutureTabProps>) {
    const { t } = useTranslation('reflect');

    return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="text-center space-y-4">
                <h2 className="text-2xl font-serif font-bold text-gray-400 hidden print:block text-left mb-4">
                    {t('yearCompass.future.title')}
                </h2>
                <h3 className="font-serif text-4xl">{t('yearCompass.future.heading')}</h3>
                <p className="text-gray-600 max-w-2xl mx-auto">{t('yearCompass.future.desc')}</p>
            </section>

            {/* Dream Big */}
            <div className="bg-white p-10 rounded-lg shadow-sm border-l-4 border-journal-accent space-y-6">
                <h3 className="font-serif text-2xl font-bold">{t('yearCompass.future.dreamBig.title')}</h3>
                <p className="text-gray-600">{t('yearCompass.future.dreamBig.desc')}</p>
                <textarea className="journal-textarea w-full min-h-[200px]" placeholder={t('yearCompass.future.dreamBig.placeholder')} />
            </div>

            {/* Magic Threes */}
            <div className="space-y-12">
                <h3 className="font-serif text-2xl text-center">{t('yearCompass.future.magicThrees.title')}</h3>
                <div className="grid md:grid-cols-3 gap-6">
                    <MagicBox icon={<HeartIcon className="text-red-400" />} title={t('yearCompass.future.magicThrees.selfLove')} desc={t('yearCompass.future.magicThrees.selfLoveDesc')} ph={t('yearCompass.future.magicThrees.placeholder')} color="border-journal-secondary" />
                    <MagicBox icon={<BanIcon className="text-gray-600" />} title={t('yearCompass.future.magicThrees.noPower')} desc={t('yearCompass.future.magicThrees.noPowerDesc')} ph={t('yearCompass.future.magicThrees.placeholder')} color="border-journal-accent" />
                    <MagicBox icon={<TargetIcon className="text-blue-400" />} title={t('yearCompass.future.magicThrees.results')} desc={t('yearCompass.future.magicThrees.resultsDesc')} ph={t('yearCompass.future.magicThrees.placeholder')} color="border-blue-400" />
                    <MagicBox icon={<UsersIcon className="text-purple-400" />} title={t('yearCompass.future.magicThrees.supports')} desc={t('yearCompass.future.magicThrees.supportsDesc')} ph={t('yearCompass.future.magicThrees.placeholder')} color="border-purple-400" />
                    <MagicBox icon={<GiftIcon className="text-yellow-400" />} title={t('yearCompass.future.magicThrees.rewards')} desc={t('yearCompass.future.magicThrees.rewardsDesc')} ph={t('yearCompass.future.magicThrees.placeholder')} color="border-yellow-400" />
                    <MagicBox icon={<CompassIcon className="text-teal-400" />} title={t('yearCompass.future.magicThrees.discovery')} desc={t('yearCompass.future.magicThrees.discoveryDesc')} ph={t('yearCompass.future.magicThrees.placeholder')} color="border-teal-400" />
                </div>
            </div>

            {/* Six Sentences Future */}
            <div className="space-y-10">
                <h3 className="font-serif text-2xl text-center">{t('yearCompass.future.sixSentences.title')}</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(n => (
                        <div key={n} className="bg-white dark:bg-zinc-900/50 p-8 rounded-lg shadow-sm border dark:border-white/5 border-l-4 border-journal-secondary space-y-3">
                            <h4 className="font-bold text-sm text-gray-700">{t(`yearCompass.future.sixSentences.s${n}`)}</h4>
                            <textarea className="journal-textarea w-full" placeholder={t('yearCompass.past.sixSentences.placeholder')} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Word + Wish */}
            <div className="grid md:grid-cols-2 gap-10">
                <div className="bg-journal-dark p-16 rounded-xl text-center shadow-xl space-y-6">
                    <h3 className="font-serif text-2xl text-journal-secondary">{t('yearCompass.future.word.title')}</h3>
                    <p className="text-gray-400 text-sm">{t('yearCompass.future.word.desc')}</p>
                    <input
                        type="text"
                        className="w-full bg-transparent text-center text-4xl font-serif font-bold tracking-widest uppercase text-journal-secondary placeholder-gray-800 border-b-2 border-journal-secondary focus:outline-none"
                        placeholder={t('yearCompass.future.word.placeholder')}
                    />
                </div>
                <div className="bg-white p-12 rounded-xl text-center shadow-sm border border-journal-light flex flex-col justify-center space-y-4">
                    <h3 className="font-serif text-2xl text-journal-secondary">{t('yearCompass.future.wish.title')}</h3>
                    <p className="text-gray-500 text-sm">{t('yearCompass.future.wish.desc')}</p>
                    <textarea className="journal-textarea w-full text-center italic" placeholder={t('yearCompass.future.wish.placeholder')} />
                </div>
            </div>

            {/* Next button */}
            <div className="text-center pt-8">
                <button
                    onClick={onNext}
                    className="bg-journal-secondary text-journal-dark px-10 py-4 rounded-lg hover:brightness-110 transition-all shadow-lg flex items-center gap-2 mx-auto font-bold tracking-wide border border-journal-dark/10"
                >
                    {t('yearCompass.actions.next')} <ArrowRightIcon />
                </button>
            </div>
        </div>
    );
}
