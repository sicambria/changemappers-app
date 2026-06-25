'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';
import StepThreshold from '@/components/register/lean/StepThreshold';
import StepVerifyWall from '@/components/register/lean/StepVerifyWall';
import StepCoreIdentity from '@/components/register/lean/StepCoreIdentity';
import StepProfileTrust from '@/components/register/lean/StepProfileTrust';
import StepAgreementsAssessment from '@/components/register/lean/StepAgreementsAssessment';
import StepMatchingActivation from '@/components/register/lean/StepMatchingActivation';
import { AlertTriangleIcon } from 'lucide-react';
import type { LeanRegistrationResumeState } from '@/lib/lean-registration-resume';

interface CauseOption {
    id: string;
    title: string;
}

interface Props {
    /** 1 = Threshold, 2 = VerifyWall, 3 = CoreIdentity, 4 = ProfileTrust, 5 = AgreementsAssessment, 6 = MatchingActivation */
    initialStep: number;
    errorCode?: string;
    /** Kept for compatibility with the admin setting; invite codes are now optional but privileged. */
    requireInviteCode?: boolean;
    initialInviteCode?: string;
    initialCauses?: CauseOption[];
    initialUserId?: string | null;
    initialResumeState?: LeanRegistrationResumeState | null;
    continuationReason?: 'cookie-missing';
}

const TOTAL_STEPS = 6;
const ISSUE_REPORT_EMAIL = 'changemappers@pm.me';
const LEAN_PROGRESS_WIDTH_CLASSES: Record<number, string> = {
    1: 'w-1/6',
    2: 'w-1/3',
    3: 'w-1/2',
    4: 'w-2/3',
    5: 'w-5/6',
    6: 'w-full',
};

const ERROR_MESSAGE_KEYS: Record<string, string> = {
    'invalid-token': 'leanErrors.invalidToken',
    'token-expired': 'leanErrors.tokenExpired',
    'invalid-invite': 'leanErrors.invalidInvite',
};

function renderIssueReportText(text: string) {
    const [beforeEmail, afterEmail] = text.split(ISSUE_REPORT_EMAIL);

    if (afterEmail === undefined) {
        return text;
    }

    return (
        <>
            {beforeEmail}
            <a
                href={`mailto:${ISSUE_REPORT_EMAIL}`}
                className="underline font-medium hover:text-blue-900 dark:hover:text-blue-200"
            >
                {ISSUE_REPORT_EMAIL}
            </a>
            {afterEmail}
        </>
    );
}

export default function LeanRegisterWizard({ initialStep, errorCode, requireInviteCode = true, initialInviteCode = '', initialCauses = [], initialUserId = null, initialResumeState = null, continuationReason }: Readonly<Props>) {
    const { t } = useTranslation(['auth']);
    const issueReportText = String(t('onboarding.lean.betaNotice.contact'));

    const [step, setStep] = useState(initialStep);
    const [email, setEmail] = useState('');
    const [userId, setUserId] = useState<string | null>(initialResumeState?.status === 'ready' ? initialResumeState.userId : initialUserId);

    // Keep URL in sync for deep-link/refresh support
    useEffect(() => {
        const url = new URL(globalThis.location.href);
        if (step === 1) {
            url.searchParams.delete('step');
        } else {
            url.searchParams.set('step', String(step));
        }
        url.searchParams.delete('error');
        if (step === 3 && continuationReason === 'cookie-missing') {
            url.searchParams.set('continuation', continuationReason);
        } else {
            url.searchParams.delete('continuation');
        }
        globalThis.history.replaceState(null, '', url.toString());
    }, [step, continuationReason]);

    // Error from URL (e.g., expired token after redirect from /register/verify)
    const errorMessage = errorCode ? t(ERROR_MESSAGE_KEYS[errorCode] ?? 'leanErrors.invalidToken') : null;

    // Only show progress bar on active registration steps
    const showProgressBar = step >= 1 && step <= TOTAL_STEPS;
    const progressWidthClass = LEAN_PROGRESS_WIDTH_CLASSES[step] ?? 'w-full';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center pt-10 pb-20 px-4">
            <div className="w-full max-w-md">
                {/* Logo / Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 mb-4">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Changemappers</h1>
                </div>

                {/* Beta Testing Notice */}
                <div data-testid="beta-notice" className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                    <div className="flex gap-2 items-start">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
                                {t('onboarding.lean.betaNotice.title')}
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                                {t('onboarding.lean.betaNotice.message')}
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                                {renderIssueReportText(issueReportText)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* URL Error alert (e.g., expired verification token) */}
                {errorMessage && (
                    <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex gap-2 items-start">
                        <AlertTriangleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-sm text-amber-700 dark:text-amber-300">{errorMessage}</p>
                    </div>
                )}

                {/* Progress Bar */}
                {showProgressBar && (
                    <div className="mb-6">
                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                                data-testid="lean-register-progress-fill"
                                className={`h-full bg-emerald-500 transition-all duration-300 ease-in-out ${progressWidthClass}`}
                            />
                        </div>
                        <div className="mt-2 text-xs text-center text-gray-500 font-medium">
                            {t('onboarding.progress.stepXofY', {
                                current: step,
                                total: TOTAL_STEPS,
                            })}
                        </div>
                    </div>
                )}

                <Card className="border-gray-200 dark:border-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none">
                    <CardContent className="p-6 sm:p-8">
                        {step === 1 && (
                            <StepThreshold
                                requireInviteCode={requireInviteCode}
                                initialInviteCode={initialInviteCode}
                                onSuccess={(submittedEmail, directReady) => {
                                    setEmail(submittedEmail);
                                    setStep(directReady ? 3 : 2);
                                }}
                            />
                        )}

                        {step === 2 && (
                            <StepVerifyWall
                                email={email}
                                onChangeEmail={() => setStep(1)}
                            />
                        )}

                        {step === 3 && (
                            <StepCoreIdentity
                                initialValues={initialResumeState?.status === 'ready' ? initialResumeState.initialValues : undefined}
                                sessionStatus={initialResumeState?.status}
                                resumeEmail={initialResumeState?.email}
                                continuationReason={continuationReason}
                                onSuccess={(uid) => {
                                    setUserId(uid);
                                    setStep(4);
                                }}
                            />
                        )}

                        {step === 4 && userId && (
                            <StepProfileTrust userId={userId} onSuccess={() => setStep(5)} />
                        )}

                        {step === 5 && userId && (
                            <StepAgreementsAssessment userId={userId} onSuccess={() => setStep(6)} />
                        )}

                        {step === 6 && userId && (
                            <StepMatchingActivation userId={userId} causesList={initialCauses} />
                        )}

                        {/* Edge case: step 3 but no lean_reg cookie (cookie expired or missing) */}
                        {step === 3 && !userId && step === initialStep && (
                            // StepCoreIdentity will show its own error when the action fails
                            // because it reads the cookie server-side
                            null
                        )}
                    </CardContent>
                </Card>

                {/* Footer hint */}
                <div className="mt-6 text-center space-y-2">
                    <p className="text-xs text-gray-400">
                        {t('onboarding.lean.footer')}
                    </p>
                    <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400">
                        <Link href="/privacy" className="hover:text-emerald-600 underline underline-offset-2">
                            {t('onboarding.lean.privacyLabel')}
                        </Link>
                        <Link href="/legal/terms" className="hover:text-emerald-600 underline underline-offset-2">
                            {t('onboarding.lean.termsLabel')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
