'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';
import { MailCheckIcon, RefreshCwIcon } from 'lucide-react';
import { resendVerificationEmailAction } from '@/app/actions/auth-recovery';

interface Props {
    email: string;
    onChangeEmail: () => void;
}

export default function StepVerifyWall({ email, onChangeEmail }: Readonly<Props>) {
    const { t } = useTranslation(['auth']);
    const [isResending, setIsResending] = useState(false);
    const [resendStatus, setResendStatus] = useState<'idle' | 'sent' | 'error'>('idle');

    const handleResend = async () => {
        setIsResending(true);
        setResendStatus('idle');
        try {
            const res = await resendVerificationEmailAction(email);
            setResendStatus(res.success ? 'sent' : 'error');
        } catch {
            setResendStatus('error');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="text-center space-y-6 py-4">
            {/* Icon */}
            <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <MailCheckIcon className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
            </div>

            {/* Heading */}
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t('onboarding.lean.step2.title')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('onboarding.lean.step2.subtitle', { email })}
                </p>
            </div>

            {/* Instruction */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <p className="text-sm text-emerald-800 dark:text-emerald-300 leading-relaxed">
                    {t('onboarding.lean.step2.instruction')}
                </p>
            </div>

            {/* Resend status */}
            {resendStatus === 'sent' && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {t('onboarding.lean.step2.resendSuccess')}
                </p>
            )}
            {resendStatus === 'error' && (
                <p className="text-sm text-red-600 dark:text-red-400">
                    {t('onboarding.errors.generic')}
                </p>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-2">
                <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleResend}
                    isLoading={isResending}
                    disabled={resendStatus === 'sent'}
                >
                    <RefreshCwIcon className="h-4 w-4 mr-2" />
                    {t('onboarding.lean.step2.resendButton')}
                </Button>

                <button
                    type="button"
                    onClick={onChangeEmail}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors py-1"
                >
                    {t('onboarding.lean.step2.changeEmail')}
                </button>
            </div>
        </div>
    );
}
