'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ZapIcon, SearchIcon, LeafIcon, GlobeIcon } from 'lucide-react';
import { useProfileCompleteness } from '@/hooks/useProfileCompleteness';
import { ProfileCompletenessModal } from '@/components/features/profile/ProfileCompletenessModal';
import { LeanOnboardingBanner } from './LeanOnboardingBanner';
import type { DashboardTile } from '@/types/dashboard';
import { ONBOARDING_JOURNEY_STEPS, type OnboardingJourneyProgress } from '@/lib/onboarding-journey';
import { useTranslation } from 'react-i18next';

const DEFAULT_ONBOARDING_PROGRESS: OnboardingJourneyProgress = {
    totalSteps: ONBOARDING_JOURNEY_STEPS.length,
    completedCount: 0,
    percentage: 0,
    nextStep: ONBOARDING_JOURNEY_STEPS[0],
};

interface Props {
    initialLayout?: DashboardTile[];
    userName: string;
    onboardingProgress?: OnboardingJourneyProgress;
    showOnboardingBanner?: boolean;
    cmapLevel?: number | null;
    requiresLeanRegistrationCompletion?: boolean;
    leanRegistrationResumeStep?: 4 | 5 | 6;
    user?: {
        id: string;
        displayName?: string | null;
        bio?: string | null;
        city?: string | null;
        country?: string | null;
        profilePhoto?: string | null;
        archetypes?: string[];
        skills?: Array<{ skillType: string; skill: string }>;
        values?: Array<{ value: string }>;
        interests?: Array<{ interest: string }>;
        website?: string | null;
        socialLinks?: unknown;
        enjoyDoing?: string | null;
        currentIntention?: string | null;
        collaborationPreference?: string[];
        availabilityDetails?: unknown;
        isRemoteCapable?: boolean | null;
        mainCauses?: Array<{ id: string; title: string }>;
        interestedCauses?: Array<{ id: string; title: string }>;
        isEmailVerified?: boolean | null;
    } | null;
}

export function ActionRouterClient({ userName, user, onboardingProgress = DEFAULT_ONBOARDING_PROGRESS, showOnboardingBanner, cmapLevel, requiresLeanRegistrationCompletion = false, leanRegistrationResumeStep = 4 }: Readonly<Props>) {
    const { t } = useTranslation('dashboard');
    const { percentage, items } = useProfileCompleteness(user);
    const [isCompletenessModalOpen, setIsCompletenessModalOpen] = useState(false);

    // We map 'brand' from the mock to Tailwind's default 'green'
    // Custom shadows from mock
    const customShadows = {
        soft: '0 10px 40px -10px rgba(0,0,0,0.05)'
    };

    return (
        <div className="dashboard-action-router min-h-screen flex flex-col antialiased text-slate-800 dark:text-slate-100 dark:text-slate-100">
            <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

                {/* ONBOARDING PROGRESS BAR */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('onboardingProgress')}</span>
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{onboardingProgress.percentage}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
                            style={{ width: `${onboardingProgress.percentage}%` }}
                        />
                    </div>
                    <div className="mt-2 flex flex-col gap-2 text-xs text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                        <p>
                            {t('onboardingJourneySummary', {
                                completed: onboardingProgress.completedCount,
                                total: onboardingProgress.totalSteps,
                            })}
                        </p>
                        <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                            <Link
                                href="/onboarding"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            >
                                {t('openOnboardingJourney')}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            {onboardingProgress.nextStep && (
                                <Link
                                    href={onboardingProgress.nextStep.href}
                                    className="inline-flex items-center justify-center font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 sm:justify-start"
                                >
                                    {t('nextOnboardingStep')}: {t(`onboardingSteps.${onboardingProgress.nextStep.id}`)}
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* DASHBOARD STATUS ROW: Compact Onboarding & Profile */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8 sm:mb-10">

                    {/* Compact Card 1: Onboarding Journey */}
                    {showOnboardingBanner ? (
                        <LeanOnboardingBanner userName={userName} cmapLevel={cmapLevel ?? null} requiresRegistrationCompletion={requiresLeanRegistrationCompletion} registrationResumeStep={leanRegistrationResumeStep} />
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/60 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center gap-4 group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none"></div>

                            <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 flex items-center justify-center text-xl flex-shrink-0 relative z-10">
                                🚀
                            </div>

                            <div className="flex-grow relative z-10">
                                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-0.5">{t('welcome', { name: userName.split(' ')[0] })}</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed sm:line-clamp-1 pr-2">{t('readyToContinue')}</p>
                            </div>

                            <Link href="/reflect" className="w-full sm:w-auto whitespace-nowrap px-4 py-2 bg-cyan-50 dark:bg-cyan-500/15 hover:bg-cyan-100 dark:hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-300 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 flex-shrink-0 relative z-10">
                                {t('reflection')} <ArrowRight className="w-4 h-4 font-bold" />
                            </Link>
                        </div>
                    )}

                    {/* Compact Card 2: Profile Completeness */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/60 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center gap-4 group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none"></div>

                        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-300 flex items-center justify-center text-xl flex-shrink-0 relative z-10">
                            ⭐️
                        </div>

                        <div className="flex-grow w-full relative z-10">
                            <div className="flex items-center justify-between mb-1.5">
                                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('profileCompleteness')}</h2>
                                <span className="text-xs font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-500/15 px-2 py-0.5 rounded-md">{percentage}%</span>
                            </div>

                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1.5">
                                <div className="h-full bg-green-500 rounded-full relative transition-all duration-500" style={{ width: `${percentage}%` }}>
                                    <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite]"></div>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t('addSkillsToReach100')}</p>
                        </div>

                        <button
                            onClick={() => setIsCompletenessModalOpen(true)}
                            className="w-full sm:w-auto whitespace-nowrap px-5 py-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 text-sm font-bold rounded-xl transition-all shadow-sm flex items-center justify-center flex-shrink-0 relative z-10 mt-2 sm:mt-0"
                        >
                            {t('editProfile')}
                        </button>
                    </div>

                </div>

                {/* HERO HEADER */}
                <div className="mb-6">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                            {t('whatsCallingYou')}
                        </h1>
                        {/* Section quick-nav icons */}
                        <div className="flex items-center gap-2 ml-auto">
                            <a href="#section-act" title={t('giveAct')} className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 transition-colors" aria-label={t('giveAct')}>
                                <ZapIcon className="h-5 w-5" />
                                <span className="text-xs font-bold tracking-wide">ACT</span>
                            </a>
                            <a href="#section-learn" title={t('findLearn')} className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 transition-colors" aria-label={t('findLearn')}>
                                <SearchIcon className="h-5 w-5" />
                                <span className="text-xs font-bold tracking-wide">FIND</span>
                            </a>
                            <a href="#section-slow" title={t('slowDown')} className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 transition-colors" aria-label={t('slowDown')}>
                                <LeafIcon className="h-5 w-5" />
                                <span className="text-xs font-bold tracking-wide">REFLECT</span>
                            </a>
                            <a href="#section-big" title={t('biggerPicture')} className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 transition-colors" aria-label={t('biggerPicture')}>
                                <GlobeIcon className="h-5 w-5" />
                                <span className="text-xs font-bold tracking-wide">SEE</span>
                            </a>
                        </div>
                    </div>
                </div>

                {/* INTENTION PATHS (Hierarchical Structure) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

                    {/* PATH 1: I know what I want to do */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 sm:p-8 border border-slate-200/60 dark:border-slate-700 flex flex-col h-full relative overflow-hidden" style={{ boxShadow: customShadows.soft }}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-50/50 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        <div className="relative z-10 flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 flex items-center justify-center text-2xl shadow-sm border border-cyan-200">
                                🎯
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('knowWhatIWantToDo')}</h2>
                        </div>

                        <div className="space-y-4 flex-grow relative z-10">

                            {/* Subcategory: Give / Act */}
                            <div id="section-act" className="group bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 hover:border-rose-200 hover:shadow-md transition-all duration-300">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 flex items-center justify-center text-sm shadow-sm">⚡</div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-rose-600 transition-colors">{t('giveAct')}</h3>
                                </div>
                                <div className="flex flex-col gap-2.5 sm:ml-11">
                                    <Link href="/contribute/offer/new" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-rose-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/><path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8v-5"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-rose-600 transition-colors leading-tight mb-0.5">{t('tiles.offerSomething.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.offerSomething.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/causes" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-rose-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-rose-600 transition-colors leading-tight mb-0.5">{t('tiles.actions.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.actions.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/tasks" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-rose-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="3" width="5" height="18" rx="1"/><rect x="9.5" y="3" width="5" height="11" rx="1"/><rect x="17" y="3" width="5" height="14" rx="1"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-rose-600 transition-colors leading-tight mb-0.5">{t('tiles.kanban.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.kanban.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/contribute" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-rose-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 10H3"/><path d="M21 6H3"/><path d="M21 14H3"/><path d="M17 18H3"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-rose-600 transition-colors leading-tight mb-0.5">{t('tiles.mentor.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.mentor.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/volunteer" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-rose-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s-6-4.35-8.5-8.03C1.4 9.88 2.3 6 5.9 5.2c2.03-.45 3.33.43 4.1 1.5.77-1.07 2.07-1.95 4.1-1.5 3.6.8 4.5 4.68 2.4 7.77C18 16.65 12 21 12 21Z"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-rose-600 transition-colors leading-tight mb-0.5">{t('tiles.volunteer.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.volunteer.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/meet" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-rose-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="16" y1="3" x2="16" y2="7"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="3" y1="11" x2="21" y2="11"/><path d="M9 15h6"/><path d="M12 13v4"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-rose-600 transition-colors leading-tight mb-0.5">{t('tiles.meet.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.meet.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/canvas" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-rose-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9l20-7z"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-rose-600 transition-colors leading-tight mb-0.5">{t('tiles.pitch.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.pitch.desc')}</span>
                                        </div>
                                    </Link>
                                </div>
                            </div>

                            {/* Subcategory: Find / Learn */}
                            <div id="section-learn" className="group bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 hover:border-amber-200 hover:shadow-md transition-all duration-300">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center text-sm shadow-sm">🔍</div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 transition-colors">{t('findLearn')}</h3>
                                </div>
                                <div className="flex flex-col gap-2.5 sm:ml-11">
                                    <Link href="/matchmaking" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-amber-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-amber-600 transition-colors leading-tight mb-0.5">{t('tiles.findPeople.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.findPeople.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/stories" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-amber-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-amber-600 transition-colors leading-tight mb-0.5">{t('tiles.stories.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.stories.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/learn" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-amber-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-amber-600 transition-colors leading-tight mb-0.5">{t('tiles.learning.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.learning.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/training" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-amber-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-amber-600 transition-colors leading-tight mb-0.5">{t('tiles.training.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.training.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/events" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-amber-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="16" r="2"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-amber-600 transition-colors leading-tight mb-0.5">{t('tiles.events.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.events.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/glossary" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-amber-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="13" y2="13"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-amber-600 transition-colors leading-tight mb-0.5">{t('tiles.glossary.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.glossary.desc')}</span>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PATH 2: I'm still figuring it out */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl p-6 sm:p-8 border border-slate-200/60 dark:border-slate-700 flex flex-col h-full relative overflow-hidden" style={{ boxShadow: customShadows.soft }}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        <div className="relative z-10 flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-2xl shadow-sm border border-emerald-200">
                                🌱
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('stillFiguringItOut')}</h2>
                        </div>

                        <div className="space-y-4 flex-grow relative z-10">

                            {/* Subcategory: Slow Down */}
                            <div id="section-slow" className="group bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 hover:border-emerald-200 hover:shadow-md transition-all duration-300">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-sm shadow-sm">🌿</div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">{t('slowDown')}</h3>
                                </div>
                                <div className="flex flex-col gap-2.5 sm:ml-11">
                                    <Link href="/reflect" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-emerald-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M19 3v4"/><path d="M21 5h-4"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-emerald-600 transition-colors leading-tight mb-0.5">{t('tiles.reflect.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.reflect.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/coachme" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-emerald-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 20c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.657.66 3.18 1.764 4.39L4 20l3.26-1.304A8.8 8.8 0 0 0 12 20Z"/><path d="M9 13c.5 1 1.5 1.5 3 1.5s2.5-.5 3-1.5"/><circle cx="9" cy="10" r=".75" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r=".75" fill="currentColor" stroke="none"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-emerald-600 transition-colors leading-tight mb-0.5">{t('tiles.coachMe.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.coachMe.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/compass" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-emerald-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="m14.5 9.5-5 5"/><path d="m10 14 4-4"/><path d="M14.5 9.5 16 8l-1.5 1.5Z"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-emerald-600 transition-colors leading-tight mb-0.5">{t('tiles.compass.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.compass.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/connect-nature" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-emerald-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22V12"/><path d="M8 6l4-4 4 4"/><path d="M6 10l6-4 6 4"/><path d="M4 14l8-4 8 4"/><path d="M2 18l10-4 10 4"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-emerald-600 transition-colors leading-tight mb-0.5">{t('tiles.connectNature.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.connectNature.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/matchmaking" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-emerald-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22V12"/><path d="M8.5 9.5C9 8 10.5 7 12 7c1.5 0 3 1 3.5 2.5"/><path d="M5 19c0-3.87 3.13-7 7-7s7 3.13 7 7"/><line x1="2" y1="22" x2="22" y2="22"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-emerald-600 transition-colors leading-tight mb-0.5">{t('tiles.peerCircles.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.peerCircles.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/growth" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-emerald-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-emerald-600 transition-colors leading-tight mb-0.5">{t('tiles.growthHub.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.growthHub.desc')}</span>
                                        </div>
                                    </Link>
                                </div>
                            </div>

                            {/* Subcategory: Bigger Picture */}
                            <div id="section-big" className="group bg-slate-50/70 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 hover:border-cyan-200 hover:shadow-md transition-all duration-300">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 flex items-center justify-center text-sm shadow-sm">🔭</div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-cyan-600 transition-colors">{t('biggerPicture')}</h3>
                                </div>
                                <div className="flex flex-col gap-2.5 sm:ml-11">
                                    <Link href="/planet" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-cyan-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-cyan-600 transition-colors leading-tight mb-0.5">{t('tiles.map.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.map.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/map" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-cyan-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"/><path d="M9 3v15"/><path d="M15 6v15"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-cyan-600 transition-colors leading-tight mb-0.5">{t('tiles.peopleMap.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.peopleMap.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/graph" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-cyan-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><line x1="7" y1="11.5" x2="17" y2="6"/><line x1="7" y1="12.5" x2="17" y2="18"/><line x1="19" y1="7" x2="19" y2="17"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-cyan-600 transition-colors leading-tight mb-0.5">{t('tiles.graph.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.graph.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/energy" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-cyan-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-cyan-600 transition-colors leading-tight mb-0.5">{t('tiles.energy.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.energy.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/social-issues" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-cyan-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="2 12 6 12 8 5 10 19 12 12 14 15 16 12 22 12"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-cyan-600 transition-colors leading-tight mb-0.5">{t('tiles.socialIssues.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.socialIssues.desc')}</span>
                                        </div>
                                    </Link>
                                    <Link href="/signals" className="group/chip flex items-center gap-3.5 p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-cyan-200 hover:shadow-sm transition-all text-left">
                                        <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 flex items-center justify-center flex-shrink-0 group-hover/chip:scale-110 transition-transform shadow-sm">
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12h2"/><path d="M20 12h2"/><path d="M12 2v2"/><path d="M12 20v2"/><circle cx="12" cy="12" r="4"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M17.66 6.34l1.41-1.41"/><path d="M4.93 19.07l1.41-1.41"/></svg>
                                        </div>
                                        <div className="flex flex-col justify-center">
                                            <span className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover/chip:text-cyan-600 transition-colors leading-tight mb-0.5">{t('tiles.signals.title')}</span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{t('tiles.signals.desc')}</span>
                                        </div>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            <ProfileCompletenessModal
                isOpen={isCompletenessModalOpen}
                onClose={() => setIsCompletenessModalOpen(false)}
                percentage={percentage}
                items={items}
                onEditProfile={() => {
                    globalThis.location.href = '/profile';
                }}
            />
        </div>
    );
}
