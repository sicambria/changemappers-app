'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input } from '@/components/ui';
import { MailIcon, KeyIcon, ArrowRightIcon } from 'lucide-react';
import { initiateRegistrationAction } from '@/app/actions/lean-register';

const schema = z.object({
    email: z.email('Invalid email address'),
    inviteCode: z.string().optional(),
    termsAccepted: z.boolean().refine((value) => value === true),
    confirmedAge16Plus: z.boolean().refine((value) => value === true),
});

type FormData = { email: string; inviteCode?: string; termsAccepted: boolean; confirmedAge16Plus: boolean };

interface Props {
    onSuccess: (email: string, directReady?: boolean) => void;
    /** Kept for compatibility with the admin setting; invite codes are now optional but privileged. */
    requireInviteCode?: boolean;
    initialInviteCode?: string;
}

export default function StepThreshold({ onSuccess, requireInviteCode: _requireInviteCode = true, initialInviteCode = '' }: Readonly<Props>) {
    const { t } = useTranslation(['auth']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: 'onTouched',
        defaultValues: { inviteCode: initialInviteCode, termsAccepted: false, confirmedAge16Plus: false },
    });

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const res = await initiateRegistrationAction(data.email, data.inviteCode ?? '', data.termsAccepted, data.confirmedAge16Plus);
            if (res.success) {
                onSuccess(data.email, res.directReady);
            } else {
                setError(res.error);
            }
        } catch {
            setError(t('onboarding.errors.generic'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form
            method="post"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            data-testid="lean-threshold-form"
            data-hydrated={isHydrated ? 'true' : 'false'}
        >
            {/* Quote */}
            <div className="text-center space-y-3 pb-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 italic leading-relaxed px-2">
                    {t('onboarding.lean.quote')}
                </p>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t('onboarding.lean.step1.title')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('onboarding.lean.step1.subtitle')}
                </p>
            </div>

            {/* Invite code is optional. Valid invites bypass admin approval. */}
            <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    {t('onboarding.lean.step1.inviteCodeLabel')}
                    <span className="ml-1 normal-case tracking-normal text-gray-400">
                        {t('onboarding.lean.step1.optionalInviteCode')}
                    </span>
                </label>
                <div className="relative">
                    <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                        {...register('inviteCode')}
                        data-testid="lean-register-invite"
                        placeholder={t('onboarding.lean.step1.inviteCodePlaceholder')}
                        className="pl-9"
                        error={errors.inviteCode?.message}
                    />
                </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    {t('onboarding.lean.step1.emailLabel')}
                </label>
                <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                        {...register('email')}
                        data-testid="lean-register-email"
                        type="email"
                        placeholder={t('onboarding.lean.step1.emailPlaceholder')}
                        className="pl-9"
                        error={errors.email?.message}
                    />
                </div>
            </div>

            <label className="flex items-start gap-3 text-xs text-gray-600 dark:text-gray-400">
                <input
                    {...register('termsAccepted')}
                    data-testid="lean-register-terms"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
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
                <input
                    {...register('confirmedAge16Plus')}
                    data-testid="lean-register-age"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>{t('register.age16Confirm')}</span>
            </label>

            {errors.confirmedAge16Plus && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                    {t('register.errors.ageRequired')}
                </div>
            )}

            {errors.termsAccepted && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                    {t('register.errors.termsRequired')}
                </div>
            )}

            {error && (
                <div data-testid="lean-register-server-error" className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                    {error}
                </div>
            )}

            <Button type="submit" data-testid="lean-register-submit" className="w-full" isLoading={isSubmitting} disabled={!isHydrated || isSubmitting}>
                {t('onboarding.lean.step1.submitButton')}
                <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                <Link href="/login" data-testid="register-login-link" className="hover:text-emerald-600 hover:underline transition-colors">
                    {t('onboarding.lean.step1.loginLink')}
                </Link>
                <Link
                    href="/register?regmode=full"
                    className="hover:text-emerald-600 hover:underline transition-colors"
                >
                    {t('onboarding.lean.step1.fullRegLink')}
                </Link>
            </div>
        </form>
    );
}
