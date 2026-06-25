'use client';

// Login page with Hungarian translations
// Part of the authentication flow

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useAuth } from '@/components/providers';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { MagicLinkForm } from '@/components/features/auth/MagicLinkForm';
import { hardNavigate } from '@/lib/client-navigation';

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
});

type LoginFormData = z.infer<typeof loginSchema>;

const OAUTH_ERROR_KEYS: Record<string, string> = {
    magic_invalid: 'login.errors.magic_invalid',
    magic_expired: 'login.errors.magic_expired',
    magic_server: 'login.errors.magic_server',
    account_suspended: 'login.errors.account_suspended',
};

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginPageFallback />}>
            <LoginPageContent />
        </Suspense>
    );
}

function LoginPageContent() {
    const { t } = useTranslation('auth');
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmitInFlight = useRef(false);
    const [error, setError] = useState<string | null>(() => {
        const oauthError = searchParams.get('error');
        if (oauthError && OAUTH_ERROR_KEYS[oauthError]) {
            return t(OAUTH_ERROR_KEYS[oauthError]);
        }
        return null;
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: 'onTouched',
    });

    const redirect = searchParams.get('redirect');
    const safeRedirect =
        redirect && redirect.startsWith('/') && !redirect.startsWith('//')
            ? redirect
            : '/dashboard';

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    const onSubmit = async (data: LoginFormData) => {
        if (isSubmitInFlight.current) {
            return;
        }

        isSubmitInFlight.current = true;
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await login(data.email, data.password);

            if (result.success) {
                if (result.mfaRequired) {
                    hardNavigate(`/verify-2fa?redirect=${encodeURIComponent(safeRedirect)}`);
                } else {
                    hardNavigate(safeRedirect);
                }
            } else {
                setError(result.error || t('login.errors.invalidCredentials'));
            }
        } catch {
            setError(t('login.errors.invalidCredentials'));
        } finally {
            isSubmitInFlight.current = false;
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4">
            <Card variant="elevated" className="w-full max-w-md">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mb-4">
                        <LockIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <CardTitle className="text-2xl">{t('login.title')}</CardTitle>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        {t('login.subtitle')}
                    </p>
                </CardHeader>

                <CardContent>
                    {error && (
                        <div data-testid="login-error" className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        method="POST"
                        className="space-y-4"
                        data-testid="login-form"
                        data-hydrated={isHydrated ? 'true' : 'false'}
                    >
                        <div className="relative">
                            <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                {...register('email')}
                                type="email"
                                placeholder={t('login.emailPlaceholder')}
                                aria-label={t('login.email')}
                                className="pl-10"
                                error={errors.email ? t('login.errors.emailRequired') : undefined}
                            />
                        </div>

                        <div className="relative">
                            <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <Input
                                {...register('password')}
                                type={showPassword ? 'text' : 'password'}
                                placeholder={t('login.passwordPlaceholder')}
                                aria-label={t('login.password')}
                                className="pl-10 pr-10"
                                error={errors.password ? t('login.errors.passwordRequired') : undefined}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? (
                                    <EyeOffIcon className="h-5 w-5" />
                                ) : (
                                    <EyeIcon className="h-5 w-5" />
                                )}
                            </button>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                                />
                                <span className="text-gray-600 dark:text-gray-400">
                                    {t('login.rememberMe')}
                                </span>
                            </label>
                            <Link
                                href="/forgot-password"
                                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                            >
                                {t('login.forgotPassword')}
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            isLoading={isSubmitting}
                        >
                            {t('login.submit')}
                        </Button>
                    </form>

                    {/* Magic link */}
                    <MagicLinkForm />

                    <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        {t('login.noAccount')}{' '}
                        <Link
                            href="/register"
                            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium"
                        >
                            {t('login.registerLink')}
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function LoginPageFallback() {
    const { t } = useTranslation('common');
    return (
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4">
            {t('common:actions.loading')}
        </div>
    );
}
