'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { ArrowRightIcon, CheckIcon } from 'lucide-react';
import { saveAgreementsAction, saveAssessmentAction } from '@/app/actions/onboarding';

// Agreement keys match the existing onboarding action
const AGREEMENT_KEYS = [
    'pledge_contributor',
    'pledge_difference',
    'pledge_friction',
    'pledge_share',
    'pledge_notice',
    'pledge_accountability',
    'charter_accepted',
] as const;

interface Props {
    userId: string;
    onSuccess?: () => void;
}

export default function StepAgreementsAssessment({ userId, onSuccess }: Readonly<Props>) {
    const { t } = useTranslation(['auth']);
    const router = useRouter();

    const [agreements, setAgreements] = useState<Record<string, boolean>>({});
    const [assessment, setAssessment] = useState<{
        q2_focus: string | null;
        q3_activity: number;
        q4_project: string | null;
        q5_systemic: number;
        seekingLocalEcoCommunity: boolean;
        seekingIntentionalCommunity: boolean;
        highStakesProjectHelp: boolean;
        strictNoRomance: boolean;
    }>({
        q2_focus: null,
        q3_activity: 1,
        q4_project: null,
        q5_systemic: 1,
        seekingLocalEcoCommunity: false,
        seekingIntentionalCommunity: false,
        highStakesProjectHelp: false,
        strictNoRomance: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const allAgreed = AGREEMENT_KEYS.every((k) => agreements[k]);

    const handleSubmit = async () => {
        if (!allAgreed) {
            setError(t('onboarding.errors.stage2_agreements'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Save agreements
            const fd = new FormData();
            AGREEMENT_KEYS.forEach((k) => fd.append(k, 'on'));
            const agreementsRes = await saveAgreementsAction(fd, userId);
            if (!agreementsRes.success) {
                setError(agreementsRes.error ?? t('onboarding.errors.saveAgreementsFailed'));
                return;
            }

            // Save assessment
            const assessmentRes = await saveAssessmentAction(
                {
                    q2_focus: assessment.q2_focus ?? undefined,
                    q3_activity: assessment.q3_activity,
                    q4_project: assessment.q4_project ?? undefined,
                    q5_systemic: assessment.q5_systemic,
                    seekingLocalEcoCommunity: assessment.seekingLocalEcoCommunity,
                    seekingIntentionalCommunity: assessment.seekingIntentionalCommunity,
                    highStakesProjectHelp: assessment.highStakesProjectHelp,
                    strictNoRomance: assessment.strictNoRomance,
                },
                userId
            );
            if (!assessmentRes.success) {
                setError(assessmentRes.error ?? t('onboarding.errors.saveAssessmentFailed'));
                return;
            }
            if (onSuccess) {
                onSuccess();
            } else {
                router.push('/dashboard');
            }
        } catch {
            setError(t('onboarding.errors.generic'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t('onboarding.lean.step5.title')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t('onboarding.lean.step5.subtitle')}
                </p>
            </div>

            {/* ── Agreements ── */}
            <section>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
                    {t('onboarding.lean.step5.agreementsTitle')}
                </h3>
                <div className="space-y-2">
                    {AGREEMENT_KEYS.map((key, idx) => (
                        <label
                            key={key}
                            data-testid={`lean-agreement-${key}`}
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                                agreements[key]
                                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <div
                                className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${
                                    agreements[key]
                                        ? 'bg-emerald-500 border-emerald-500'
                                        : 'border-gray-300 dark:border-gray-600'
                                }`}
                            >
                                {agreements[key] && <CheckIcon className="w-3 h-3 text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={!!agreements[key]}
                                onChange={(e) =>
                                    setAgreements((prev) => ({ ...prev, [key]: e.target.checked }))
                                }
                            />
                            <div>
                                {key === 'charter_accepted' && (
                                    <p className="text-xs text-emerald-600">
                                        <Link
                                            href="/about/governance/charter"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:underline"
                                        >
                                            {t('onboarding.static.charterLink')}
                                        </Link>
                                    </p>
                                )}
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {t(`onboarding.static.agreements.${idx}.title`)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    {t(`onboarding.static.agreements.${idx}.text`)}
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
                <p className="text-xs text-gray-400 italic text-center mt-2">
                    {t('onboarding.lean.step5.timestampNotice')}
                </p>
            </section>

            {/* ── Assessment ── */}
            <section className="border-t border-gray-100 dark:border-gray-800 pt-5">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
                    {t('onboarding.lean.step5.assessmentTitle')}
                </h3>

                <div className="space-y-5">
                    {/* Q1: Focus */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            {t('onboarding.stage2_5.q1_focus')}
                        </label>
                        <select
                            data-testid="lean-assessment-focus"
                            value={assessment.q2_focus ?? ''}
                            onChange={(e) =>
                                setAssessment((prev) => ({ ...prev, q2_focus: e.target.value || null }))
                            }
                            className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                        >
                            <option value="" disabled>
                                {t('onboarding.stage2_5.q1_placeholder')}
                            </option>
                            <option value="local">{t('onboarding.stage2_5.q1_local')}</option>
                            <option value="regional">{t('onboarding.stage2_5.q1_regional')}</option>
                            <option value="global">{t('onboarding.stage2_5.q1_global')}</option>
                        </select>
                    </div>

                    {/* Q2: Activity */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            {t('onboarding.stage2_5.q2_activity')}
                        </label>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-400 w-16 text-right shrink-0">
                                {t('onboarding.stage2_5.q2_observer')}
                            </span>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={assessment.q3_activity}
                                onChange={(e) =>
                                    setAssessment((prev) => ({
                                        ...prev,
                                        q3_activity: Number.parseInt(e.target.value),
                                    }))
                                }
                                className="flex-1 accent-emerald-500"
                            />
                            <span className="text-xs text-gray-400 w-16 shrink-0">
                                {t('onboarding.stage2_5.q2_catalyst')}
                            </span>
                        </div>
                    </div>

                    {/* Q3: Active project */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            {t('onboarding.stage2_5.q3_project')}
                        </label>
                        <div className="flex flex-col gap-2">
                            {(['yes', 'formal', 'no'] as const).map((opt) => (
                                <label key={opt} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        data-testid={`lean-assessment-project-${opt}`}
                                        checked={assessment.q4_project === opt}
                                        onChange={() =>
                                            setAssessment((prev) => ({ ...prev, q4_project: opt }))
                                        }
                                        className="text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {(() => {
                                            if (opt === 'yes') return t('onboarding.stage2_5.q3_yes');
                                            if (opt === 'formal') return t('onboarding.stage2_5.q3_formally');
                                            return t('onboarding.stage2_5.q3_no');
                                        })()}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Q4: Systemic */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            {t('onboarding.stage2_5.q4_systemic')}
                        </label>
                        <div className="flex items-center gap-4">
                            <span className="text-xs text-gray-400 w-16 text-right shrink-0">
                                {t('onboarding.stage2_5.q4_not_at_all')}
                            </span>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={assessment.q5_systemic}
                                onChange={(e) =>
                                    setAssessment((prev) => ({
                                        ...prev,
                                        q5_systemic: Number.parseInt(e.target.value),
                                    }))
                                }
                                className="flex-1 accent-emerald-500"
                            />
                            <span className="text-xs text-gray-400 w-16 shrink-0">
                                {t('onboarding.stage2_5.q4_actively')}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Intentions & Boundaries ── */}
            <section className="border-t border-gray-100 dark:border-gray-800 pt-5">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-4">
                    {t('onboarding.lean.step5.intentionsTitle')}
                </h3>

                <div className="space-y-4">
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 cursor-pointer transition-all">
                        <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${assessment.seekingLocalEcoCommunity ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-600'}`}>
                            {assessment.seekingLocalEcoCommunity && <CheckIcon className="w-3 h-3 text-white" />}
                        </div>
                        <input
                            type="checkbox"
                            className="sr-only"
                            checked={assessment.seekingLocalEcoCommunity}
                            onChange={(e) => setAssessment(prev => ({ ...prev, seekingLocalEcoCommunity: e.target.checked }))}
                        />
                        <div className="mt-0.5">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {t('onboarding.lean.step5.q_ecoCommunity')}
                            </div>
                            <div className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                                {t('onboarding.lean.step5.q_ecoCommunityHelp')}
                            </div>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 cursor-pointer transition-all">
                        <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${assessment.seekingIntentionalCommunity ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-600'}`}>
                            {assessment.seekingIntentionalCommunity && <CheckIcon className="w-3 h-3 text-white" />}
                        </div>
                        <input
                            type="checkbox"
                            className="sr-only"
                            checked={assessment.seekingIntentionalCommunity}
                            onChange={(e) => setAssessment(prev => ({ ...prev, seekingIntentionalCommunity: e.target.checked }))}
                        />
                        <div className="mt-0.5">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {t('onboarding.lean.step5.q_intentionalCommunity')}
                            </div>
                            <div className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                                {t('onboarding.lean.step5.q_intentionalCommunityHelp')}
                            </div>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 cursor-pointer transition-all">
                        <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${assessment.highStakesProjectHelp ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-600'}`}>
                            {assessment.highStakesProjectHelp && <CheckIcon className="w-3 h-3 text-white" />}
                        </div>
                        <input
                            type="checkbox"
                            className="sr-only"
                            checked={assessment.highStakesProjectHelp}
                            onChange={(e) => setAssessment(prev => ({ ...prev, highStakesProjectHelp: e.target.checked }))}
                        />
                        <div className="mt-0.5">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {t('onboarding.lean.step5.q_highStakesProject')}
                            </div>
                            <div className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                                {t('onboarding.lean.step5.q_highStakesProjectHelp')}
                            </div>
                        </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 cursor-pointer transition-all">
                        <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-all ${assessment.strictNoRomance ? 'bg-rose-500 border-rose-500' : 'border-gray-300 dark:border-gray-600'}`}>
                            {assessment.strictNoRomance && <CheckIcon className="w-3 h-3 text-white" />}
                        </div>
                        <input
                            type="checkbox"
                            className="sr-only"
                            checked={assessment.strictNoRomance}
                            onChange={(e) => setAssessment(prev => ({ ...prev, strictNoRomance: e.target.checked }))}
                        />
                        <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {t('onboarding.lean.step5.q_strictNoRomance')}
                            </div>
                            <div className="text-xs text-rose-500 dark:text-rose-400 mt-1 font-semibold">
                                {t('onboarding.lean.step5.q_strictNoRomanceWarning')}
                            </div>
                        </div>
                    </label>
                </div>
            </section>

            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                    {error}
                </div>
            )}

            <Button
                onClick={handleSubmit}
                data-testid="lean-agreements-submit"
                isLoading={isSubmitting}
                disabled={!allAgreed}
                className="w-full"
                size="lg"
            >
                {t('onboarding.lean.step5.submitButton')}
                <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
        </div>
    );
}
