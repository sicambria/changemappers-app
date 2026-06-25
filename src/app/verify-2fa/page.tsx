'use client';

// Two-factor verification step (AUDIT-20260613-041 #9).
// Reached after the first factor (password / magic link) when the account has TOTP
// enabled. The MFA-challenge cookie (set server-side) is the only credential here;
// submitting a valid TOTP or backup code exchanges it for a full session.

import { Suspense, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { ShieldCheckIcon } from 'lucide-react';
import { verifyTwoFactorAction } from '@/app/actions/twofa';
import { hardNavigate } from '@/lib/client-navigation';

const verifySchema = z.object({
    code: z.string().min(1),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export default function VerifyTwoFactorPage() {
    return (
        <Suspense fallback={null}>
            <VerifyTwoFactorContent />
        </Suspense>
    );
}

function VerifyTwoFactorContent() {
    const { t } = useTranslation('auth');
    const searchParams = useSearchParams();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmitInFlight = useRef(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<VerifyFormData>({
        resolver: zodResolver(verifySchema),
        mode: 'onTouched',
    });

    const redirect = searchParams.get('redirect');
    const safeRedirect =
        redirect && redirect.startsWith('/') && !redirect.startsWith('//')
            ? redirect
            : '/dashboard';

    const onSubmit = async (data: VerifyFormData) => {
        if (isSubmitInFlight.current) {
            return;
        }
        isSubmitInFlight.current = true;
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await verifyTwoFactorAction({ code: data.code });
            if (result.success) {
                hardNavigate(safeRedirect);
            } else {
                setError(result.error || t('twoFactor.verify.invalidCode'));
            }
        } catch {
            setError(t('twoFactor.verify.invalidCode'));
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
                        <ShieldCheckIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <CardTitle className="text-2xl">{t('twoFactor.verify.title')}</CardTitle>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        {t('twoFactor.verify.subtitle')}
                    </p>
                </CardHeader>

                <CardContent>
                    {error && (
                        <div data-testid="twofa-error" className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                        <div>
                            <label htmlFor="twofa-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('twoFactor.verify.codeLabel')}
                            </label>
                            <Input
                                id="twofa-code"
                                data-testid="twofa-code"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                autoFocus
                                placeholder={t('twoFactor.verify.codePlaceholder')}
                                aria-invalid={errors.code ? 'true' : 'false'}
                                {...register('code')}
                            />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                {t('twoFactor.verify.backupHint')}
                            </p>
                        </div>

                        <Button
                            type="submit"
                            data-testid="twofa-submit"
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? t('twoFactor.verify.verifying') : t('twoFactor.verify.submit')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
