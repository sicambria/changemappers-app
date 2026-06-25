'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui';
import Stage1Account from '@/components/register/stages/Stage1Account';
import Stage2Agreements from '@/components/register/stages/Stage2Agreements';
import Stage25Assessment from '@/components/register/stages/Stage25Assessment';
import Stage3Presence from '@/components/register/stages/Stage3Presence';
import Stage4Skills from '@/components/register/stages/Stage4Skills';
import Stage45Archetype from '@/components/register/stages/Stage45Archetype';
import Stage5Functional from '@/components/register/stages/Stage5Functional';
import Stage6Depth from '@/components/register/stages/Stage6Depth';
import Stage7Orientation from '@/components/register/stages/Stage7Orientation';
import { initiateFullRegistrationAction } from '@/app/actions/full-register';
import type { FullRegistrationResumeState } from '@/lib/full-registration-resume';
import { useValidationErrors } from '@/hooks/useValidationErrors';

interface CauseProps {
    id: string;
    title: string;
}

interface Props {
    initialCauses: CauseProps[];
    initialResumeState?: FullRegistrationResumeState | null;
}

const LOW_LEVEL_PROGRESS_WIDTH_CLASSES: Record<number, string> = {
    1: 'w-1/6',
    2: 'w-1/3',
    3: 'w-1/2',
    4: 'w-2/3',
    5: 'w-5/6',
    6: 'w-full',
};

const HIGH_LEVEL_PROGRESS_WIDTH_CLASSES: Record<number, string> = {
    1: 'w-[12.5%]',
    2: 'w-[25%]',
    3: 'w-[37.5%]',
    4: 'w-[50%]',
    5: 'w-[62.5%]',
    6: 'w-[75%]',
    7: 'w-[87.5%]',
    8: 'w-full',
};

function FullRegistrationGate({ onReady }: Readonly<{ onReady: (email: string, inviteCode: string) => void }>) {
    const { t } = useTranslation(['auth', 'common']);
    const [email, setEmail] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [confirmedAge16Plus, setConfirmedAge16Plus] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
    const { formError, setErrors, clearErrors } = useValidationErrors();

    const submit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        clearErrors();
        const result = await initiateFullRegistrationAction(email, inviteCode, termsAccepted, confirmedAge16Plus);
        setIsSubmitting(false);
        if (!result.success) {
            setErrors(result);
            return;
        }
        if (result.accountReady) {
            onReady(result.email, inviteCode);
            return;
        }
        setVerificationEmail(result.email);
    };

    if (verificationEmail) {
        return (
            <div className="space-y-5 text-center" data-testid="full-register-verification-wall">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('onboarding.fullGate.checkEmailTitle')}</h2>
                <p className="text-sm text-gray-500">{t('onboarding.fullGate.checkEmailMessage', { email: verificationEmail })}</p>
                <button type="button" className="text-sm font-medium text-emerald-700 hover:underline" onClick={() => setVerificationEmail(null)}>
                    {t('onboarding.fullGate.differentEmail')}
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="space-y-4" data-testid="full-register-email-gate">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('onboarding.fullGate.title')}</h2>
                <p className="text-sm text-gray-500 mt-1">{t('onboarding.fullGate.subtitle')}</p>
            </div>
            <input
                data-testid="full-register-gate-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('onboarding.stage1.emailPlaceholder')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                required
            />
            <input
                data-testid="full-register-gate-invite"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
                placeholder={t('onboarding.stage1.invitationCodePlaceholder')}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            />
            <label className="flex items-start gap-3 text-xs text-gray-600 dark:text-gray-400">
                <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600" />
                <span>
                    {t('register.termsAccept')}
                    <Link href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                        {t('register.termsLink')}
                    </Link>
                    {' '}{t('register.termsAnd')}{' '}
                    <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                        {t('register.privacyLink')}
                    </Link>.
                </span>
            </label>
            <label className="flex items-start gap-3 text-xs text-gray-600 dark:text-gray-400">
                <input data-testid="full-register-gate-age" type="checkbox" checked={confirmedAge16Plus} onChange={(event) => setConfirmedAge16Plus(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600" />
                <span>{t('register.age16Confirm')}</span>
            </label>
            {formError && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">{formError}</div>}
            <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                {isSubmitting ? t('common:loading') : t('onboarding.fullGate.continueButton')}
            </button>
        </form>
    );
}

export default function RegisterWizardClient({ initialCauses, initialResumeState }: Readonly<Props>) {
    const { t } = useTranslation(['auth', 'common']);
    const resumeInitialStep = initialResumeState?.initialStep;
    const resumeUserId = initialResumeState?.userId ?? null;
    const resumeCmapLevel = initialResumeState?.cmapLevel;
    const resumeEmail = initialResumeState?.email;
    const resumeInviteCode = initialResumeState?.inviteCode;
    const [currentStep, setCurrentStep] = useState(resumeInitialStep ?? 0);
    const [registeredUserId, setRegisteredUserId] = useState<string | null>(resumeUserId);
    const [cmapLevel, setCmapLevel] = useState<number>(resumeCmapLevel ?? 0);
    const [verifiedEmail, setVerifiedEmail] = useState(resumeEmail ?? '');
    const [verifiedInviteCode, setVerifiedInviteCode] = useState(resumeInviteCode ?? '');

    useEffect(() => {
        if (resumeInitialStep === undefined || resumeCmapLevel === undefined || resumeEmail === undefined || resumeInviteCode === undefined) return;
        setCurrentStep(resumeInitialStep);
        setRegisteredUserId(resumeUserId);
        setCmapLevel(resumeCmapLevel);
        setVerifiedEmail(resumeEmail);
        setVerifiedInviteCode(resumeInviteCode);
    }, [resumeInitialStep, resumeUserId, resumeCmapLevel, resumeEmail, resumeInviteCode]);

    const stage1FullRegistration = {
        email: verifiedEmail || resumeEmail || '',
        invitationCode: verifiedInviteCode || resumeInviteCode || '',
        account: initialResumeState?.account ?? null,
    };

    const next = () => setCurrentStep(curr => curr + 1);
    const back = () => setCurrentStep(curr => curr - 1);
    const skip = () => setCurrentStep(curr => curr + 1);
    const skipToOrientation = () => setCurrentStep(8);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center pt-10 pb-20 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 mb-4">CM</div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Changemappers</h1>
                </div>

                {(() => {
                    const totalSteps = cmapLevel <= 1 ? 6 : 8;
                    const orientationStep = cmapLevel <= 1 ? 8 : 10;
                    const showBar = currentStep > 1 && currentStep < orientationStep;
                    const progressStep = Math.min(Math.max(currentStep - 1, 1), totalSteps);
                    const widthClasses = cmapLevel <= 1 ? LOW_LEVEL_PROGRESS_WIDTH_CLASSES : HIGH_LEVEL_PROGRESS_WIDTH_CLASSES;
                    if (!showBar) return null;
                    return (
                        <div className="mb-6">
                            <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div data-testid="full-register-progress-fill" className={`h-full bg-emerald-500 transition-all duration-300 ease-in-out ${widthClasses[progressStep] ?? 'w-full'}`} />
                            </div>
                            <div className="mt-2 text-xs text-center text-gray-500 font-medium">
                                {t('onboarding.progress.stepXofY', { current: progressStep, total: totalSteps })}
                            </div>
                        </div>
                    );
                })()}

                <Card className="border-gray-200 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none">
                    <CardContent className="p-6 sm:p-8">
                        {currentStep === 0 && (
                            <div className="text-center space-y-6">
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">{t('onboarding.intro.title')}</h1>
                                <div className="aspect-video w-full overflow-hidden rounded-2xl shadow-inner bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                    <iframe className="w-full h-full" src="https://www.youtube-nocookie.com/embed/8Vf-vV9T7ok" title={t('onboarding.intro.iframeTitle')} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                                </div>
                                <div className="pt-4">
                                    <button onClick={next} data-testid="onboarding-intro-start" className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40">
                                        {t('onboarding.intro.startButton')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentStep === 1 && <FullRegistrationGate onReady={(email, inviteCode) => { setVerifiedEmail(email); setVerifiedInviteCode(inviteCode); setCurrentStep(2); }} />}
                        {currentStep === 2 && <Stage1Account fullRegistration={stage1FullRegistration} onSuccess={(uid) => { setRegisteredUserId(uid); setCurrentStep(3); }} />}
                        {currentStep === 3 && registeredUserId && <Stage2Agreements userId={registeredUserId} onSuccess={next} onBack={back} />}
                        {currentStep === 4 && registeredUserId && <Stage25Assessment userId={registeredUserId} onSuccess={(level) => { setCmapLevel(level); next(); }} onBack={back} />}
                        {currentStep === 5 && registeredUserId && <Stage3Presence userId={registeredUserId} cmapLevel={cmapLevel} onSuccess={next} onBack={back} onSkip={skip} />}
                        {currentStep === 6 && registeredUserId && <Stage4Skills userId={registeredUserId} cmapLevel={cmapLevel} causesList={initialCauses} onSuccess={next} onBack={back} onSkip={skip} />}
                        {currentStep === 7 && registeredUserId && (cmapLevel <= 1 ? <Stage45Archetype userId={registeredUserId} cmapLevel={cmapLevel} onSuccess={skipToOrientation} onBack={back} onSkip={skipToOrientation} /> : <Stage45Archetype userId={registeredUserId} cmapLevel={cmapLevel} onSuccess={next} onBack={back} onSkip={next} />)}
                        {currentStep === 8 && registeredUserId && cmapLevel >= 2 && <Stage5Functional userId={registeredUserId} cmapLevel={cmapLevel} onSuccess={(skipL6) => skipL6 ? setCurrentStep(10) : next()} onBack={back} />}
                        {currentStep === 8 && registeredUserId && cmapLevel <= 1 && <Stage7Orientation userId={registeredUserId} />}
                        {currentStep === 9 && registeredUserId && cmapLevel >= 2 && <Stage6Depth userId={registeredUserId} cmapLevel={cmapLevel} onSuccess={() => setCurrentStep(10)} onBack={back} />}
                        {currentStep === 10 && registeredUserId && <Stage7Orientation userId={registeredUserId} />}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
