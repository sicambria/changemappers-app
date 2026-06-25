'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type TFunction } from 'i18next';
import Link from 'next/link';
import { XIcon, ArrowRightIcon, MapIcon } from 'lucide-react';
import { dismissOnboardingBannerAction } from '@/app/actions/lean-register';

interface Props {
    userName: string;
    cmapLevel: number | null;
    requiresRegistrationCompletion?: boolean;
    registrationResumeStep?: 4 | 5 | 6;
}

function getLevelLabel(level: number | null, t: TFunction): string {
    if (level === null || level <= 2) return t('onboarding.lean.welcome.levelExplorer');
    if (level <= 5) return t('onboarding.lean.welcome.levelPractitioner');
    return t('onboarding.lean.welcome.levelSystemsThinker');
}

function getLevelColor(level: number | null): string {
    if (level === null || level <= 2) return 'from-teal-500 to-emerald-600';
    if (level <= 5) return 'from-emerald-500 to-cyan-600';
    return 'from-teal-500 to-emerald-600';
}

function getWeek1Task(level: number | null, t: TFunction): { cta: string; href: string } {
    if (level !== null && level >= 5) {
        return {
            cta: t('onboarding.lean.welcome.ctaSystemicFocus'),
            href: '/profile?tab=functional',
        };
    }
    return {
        cta: t('onboarding.lean.welcome.ctaCompleteProfile'),
        href: '/profile',
    };
}

export function LeanOnboardingBanner({ userName, cmapLevel, requiresRegistrationCompletion = false, registrationResumeStep = 4 }: Readonly<Props>) {
    const { t } = useTranslation(['auth']);
    const [isDismissing, setIsDismissing] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    const firstName = userName.split(' ')[0];
    const levelLabel = getLevelLabel(cmapLevel, t);
    const levelColor = getLevelColor(cmapLevel);
    const week1Task = requiresRegistrationCompletion
        ? { cta: t('onboarding.lean.welcome.resumeRegistration'), href: `/register?step=${registrationResumeStep}` }
        : getWeek1Task(cmapLevel, t);

    const handleDismiss = async () => {
        setIsDismissing(true);
        // AUDIT-20260611-001: the matching-activation invitation is dismissible
        // (consent must stay freely given), but only for the session — it
        // returns on the next visit. The persistent dismiss action stays
        // reserved for the post-activation welcome banner.
        if (!requiresRegistrationCompletion) {
            await dismissOnboardingBannerAction();
        }
        setIsDismissed(true);
    };

    if (isDismissed) return null;

    return (
        <div
            className={`relative rounded-2xl bg-gradient-to-br ${levelColor} p-px mb-6 overflow-hidden`}
        >
            <div className="rounded-2xl bg-slate-900/95 p-5 sm:p-6">
                <button
                    type="button"
                    onClick={handleDismiss}
                    disabled={isDismissing}
                    aria-label={t('onboarding.lean.welcome.dismiss')}
                    className="absolute top-3 right-3 text-white/40 hover:text-white/80 transition-colors p-1 rounded"
                >
                    <XIcon className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="flex items-start gap-3 mb-4">
                    <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${levelColor} flex items-center justify-center shrink-0`}
                    >
                        <MapIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-0.5">
                            {t('onboarding.lean.welcome.weekLabel')}
                        </div>
                        <h3 className="text-white font-semibold text-base leading-snug">
                            {t('onboarding.lean.welcome.greeting', { name: firstName })}
                        </h3>
                    </div>
                </div>

                {/* Level badge */}
                <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${levelColor} text-white text-xs font-semibold mb-4`}
                >
                    <span>
                        L{cmapLevel ?? 2} · {levelLabel}
                    </span>
                </div>

                {/* Quote */}
                <p className="text-white/60 text-sm italic leading-relaxed mb-4 border-l-2 border-emerald-500/40 pl-3">
                    {t('onboarding.lean.quote')}
                </p>

                {/* Week 1 task */}
                <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
                    <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-1">
                        {t('onboarding.lean.welcome.taskLabel')}
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed">
                        {requiresRegistrationCompletion ? t('onboarding.lean.welcome.registrationTask') : t('onboarding.lean.welcome.week1Task')}
                    </p>
                </div>

                {/* CTA */}
                <Link
                    href={week1Task.href}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${levelColor} text-white text-sm font-semibold hover:opacity-90 transition-opacity`}
                >
                    {week1Task.cta}
                    <ArrowRightIcon className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
