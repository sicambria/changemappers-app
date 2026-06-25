'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    CalendarIcon,
    StarIcon,
    GraduationCapIcon,
    TrophyIcon,
    PlaneIcon,
    HeartCrackIcon,
    UsersIcon,
    BookOpenIcon,
    HouseIcon,
    BriefcaseIcon,
    Users2Icon,
    HeartPulseIcon,
    CheckIcon,
} from 'lucide-react';

import { YearCompassChart } from './YearCompassChart';

// ─── Local helper components ──────────────────────────────────────────────────

function Section({ icon, title, ph }: Readonly<{ icon: React.ReactNode; title: string; ph: string }>) {
    return (
        <div className="space-y-4">
            <h4 className="text-journal-secondary font-bold flex items-center gap-2">{icon} {title}</h4>
            <textarea className="journal-textarea" placeholder={ph} />
        </div>
    );
}

function SixSentenceCard({ icon, title, desc }: Readonly<{ icon: React.ReactNode; title: string; desc: string }>) {
    const { t } = useTranslation('reflect');
    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-transparent hover:border-journal-secondary transition-all space-y-4 group">
            <div className="text-journal-secondary transition-transform group-hover:scale-110">{icon}</div>
            <div className="space-y-2">
                <h4 className="font-bold text-sm text-gray-800">{title}</h4>
                <p className="text-[10px] text-gray-400 italic line-clamp-2">{desc}</p>
            </div>
            <textarea className="journal-textarea min-h-[100px]" placeholder={t('yearCompass.past.sixSentences.placeholder')} />
        </div>
    );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface YearCompassPastTabProps {
    chartData: number[];
    onChartDataChange: (newData: number[]) => void;
    onFinishPast: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function YearCompassPastTab({ chartData, onChartDataChange, onFinishPast }: Readonly<YearCompassPastTabProps>) {
    const { t } = useTranslation('reflect');

    return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Calendar Review */}
            <div className="bg-white dark:bg-zinc-900/50 p-8 rounded-lg shadow-sm border dark:border-white/5 space-y-8">
                <h3 className="font-serif text-xl font-bold flex items-center gap-3">
                    <CalendarIcon className="text-journal-secondary" /> {t('yearCompass.past.calendar.title')}
                </h3>
                <p className="text-sm text-gray-600">{t('yearCompass.past.calendar.desc')}</p>
                <div className="grid md:grid-cols-2 gap-8">
                    {(['spring', 'summer', 'autumn', 'winter'] as const).map(season => (
                        <div key={season} className="space-y-2">
                            <h4 className="font-bold text-xs text-gray-400 uppercase border-b border-journal-light pb-1">
                                {t(`yearCompass.past.calendar.${season}`)}
                            </h4>
                            <textarea className="journal-textarea w-full" placeholder={t('yearCompass.past.calendar.placeholder')} />
                        </div>
                    ))}
                </div>
            </div>

            <div className="section-divider" />

            {/* Life Areas Radar */}
            <YearCompassChart chartData={chartData} onChartDataChange={onChartDataChange} />

            {/* Detailed evaluation */}
            <div className="bg-white dark:bg-zinc-900/50 p-8 rounded-lg shadow-sm border dark:border-white/5 space-y-8">
                <h3 className="font-serif text-xl font-bold text-center">{t('yearCompass.past.lifeAreas.detailed')}</h3>
                <div className="grid md:grid-cols-2 gap-8">
                    <Section icon={<HouseIcon />} title={t('yearCompass.past.lifeAreas.labels.family')} ph={t('yearCompass.past.lifeAreas.placeholders.familyDetail')} />
                    <Section icon={<BriefcaseIcon />} title={t('yearCompass.past.lifeAreas.labels.career')} ph={t('yearCompass.past.lifeAreas.placeholders.careerDetail')} />
                    <Section icon={<Users2Icon />} title={t('yearCompass.past.lifeAreas.labels.friends')} ph={t('yearCompass.past.lifeAreas.placeholders.friendsDetail')} />
                    <Section icon={<HeartPulseIcon />} title={t('yearCompass.past.lifeAreas.labels.body')} ph={t('yearCompass.past.lifeAreas.placeholders.healthDetail')} />
                </div>
            </div>

            {/* Six Sentences Past */}
            <div className="space-y-10">
                <h3 className="font-serif text-2xl text-center">{t('yearCompass.past.sixSentences.title')}</h3>
                <div className="grid md:grid-cols-3 gap-6">
                    <SixSentenceCard icon={<GraduationCapIcon />} title={t('yearCompass.past.sixSentences.lesson')} desc={t('yearCompass.past.sixSentences.lessonDesc')} />
                    <SixSentenceCard icon={<TrophyIcon />} title={t('yearCompass.past.sixSentences.success')} desc={t('yearCompass.past.sixSentences.successDesc')} />
                    <SixSentenceCard icon={<PlaneIcon />} title={t('yearCompass.past.sixSentences.risk')} desc={t('yearCompass.past.sixSentences.riskDesc')} />
                    <SixSentenceCard icon={<HeartCrackIcon />} title={t('yearCompass.past.sixSentences.hardship')} desc={t('yearCompass.past.sixSentences.hardshipDesc')} />
                    <SixSentenceCard icon={<UsersIcon />} title={t('yearCompass.past.sixSentences.gratitude')} desc={t('yearCompass.past.sixSentences.gratitudeDesc')} />
                    <SixSentenceCard icon={<BookOpenIcon />} title={t('yearCompass.past.sixSentences.different')} desc={t('yearCompass.past.sixSentences.differentDesc')} />
                </div>
            </div>

            {/* Best Moments */}
            <div className="bg-white p-10 rounded-lg shadow-sm border-t-4 border-yellow-400 space-y-8">
                <div className="text-center space-y-2">
                    <h3 className="font-serif text-xl font-bold">{t('yearCompass.past.bestMoments.title')}</h3>
                    <p className="text-gray-500 text-sm">{t('yearCompass.past.bestMoments.desc')}</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                    {[1, 2, 3].map(n => (
                        <div key={n} className="flex flex-col items-center gap-4">
                            <StarIcon className="text-yellow-400 h-8 w-8 fill-yellow-400" />
                            <textarea className="journal-textarea w-full text-center" placeholder={t(`yearCompass.past.bestMoments.p${n}`)} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Letting Go */}
            <div className="bg-journal-light/30 p-10 rounded-lg text-center space-y-8">
                <div className="space-y-4 max-w-2xl mx-auto">
                    <h3 className="font-serif text-2xl">{t('yearCompass.past.lettingGo.title')}</h3>
                    <p className="text-gray-600">{t('yearCompass.past.lettingGo.desc')}</p>
                </div>
                <textarea
                    className="w-full max-w-2xl mx-auto p-6 rounded-lg border border-gray-200 focus:border-journal-secondary focus:outline-none bg-white min-h-[150px] shadow-sm"
                    placeholder={t('yearCompass.past.lettingGo.placeholder')}
                />
                <div className="print:hidden">
                    <button
                        onClick={() => {
                            if (confirm(t('yearCompass.past.lettingGo.confirm'))) onFinishPast();
                        }}
                        className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-lg hover:bg-journal-secondary hover:text-white transition-all flex items-center gap-2 mx-auto shadow-md border border-journal-light/20 font-bold"
                    >
                        <CheckIcon /> {t('yearCompass.actions.finishPast')}
                    </button>
                </div>
            </div>
        </div>
    );
}
