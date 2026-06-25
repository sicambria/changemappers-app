'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { LockIcon, EyeIcon, EyeOffIcon } from 'lucide-react';
import { resetPasswordAction } from '@/app/actions/auth-recovery';

type ResetFormData = {
  password: string;
  confirmPassword: string;
};

const ERROR_KEYS: Record<string, string> = {
  reset_invalid: 'passwordReset.errors.invalid',
  reset_expired: 'passwordReset.errors.expired',
  reset_server: 'passwordReset.errors.server',
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const { t } = useTranslation('auth');
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }); // §1B: mirror latest t for effects/callbacks below; no deps array on purpose
  const resetSchema = z.object({
    password: z
      .string()
      .min(12, t('passwordReset.validation.minLength'))
      .regex(/[A-Z]/, t('passwordReset.validation.uppercase'))
      .regex(/[a-z]/, t('passwordReset.validation.lowercase'))
      .regex(/\d/, t('passwordReset.validation.number'))
      .regex(/[^A-Za-z0-9]/, t('passwordReset.validation.special')),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, { // SAFE: Client-side confirmation equality only; no stored secret or token is compared.
    message: t('passwordReset.validation.match'),
    path: ['confirmPassword'],
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    const err = searchParams.get('error');
    if (err && ERROR_KEYS[err]) {
      return t(ERROR_KEYS[err]);
    }
    return null;
  });

  const token = searchParams.get('token');
  const hasResetCookie = searchParams.get('ready') === '1';

  useEffect(() => {
    setIsHydrated(true);
    if (!token && !hasResetCookie && !error) {
      setError(tRef.current('passwordReset.errors.invalid'));
    }
  }, [token, hasResetCookie, error]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: ResetFormData) => {
    if (!token && !hasResetCookie) {
      setError(t('passwordReset.errors.invalid'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await resetPasswordAction(token ?? '', data.password);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(result.error || t('passwordReset.error'));
      }
    } catch {
      setError(t('passwordReset.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4">
        <Card variant="elevated" className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">{t('passwordReset.success')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              {t('passwordReset.redirecting')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4">
      <Card variant="elevated" className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mb-4">
            <LockIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardTitle className="text-2xl">{t('passwordReset.newPasswordTitle')}</CardTitle>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {t('passwordReset.newPasswordSubtitle')}
          </p>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            method="POST"
            className="space-y-4"
            data-testid="reset-password-form"
            data-hydrated={isHydrated ? 'true' : 'false'}
          >
            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder={t('passwordReset.newPassword')}
                aria-label={t('passwordReset.newPassword')}
                className="pl-10 pr-10"
                error={errors.password?.message}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t('passwordReset.hidePassword') : t('passwordReset.showPassword')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="relative">
              <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                {...register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                placeholder={t('passwordReset.confirmNewPassword')}
                aria-label={t('passwordReset.confirmNewPassword')}
                className="pl-10"
                error={errors.confirmPassword?.message}
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              {t('passwordReset.submitNew')}
            </Button>
          </form>

          <div className="mt-4 space-y-2 text-center text-sm">
            <Link
              href="/help/email-not-arriving"
              className="block text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              {t('emailHelp.link')}
            </Link>
            <Link
              href="/login"
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              {t('passwordReset.backToLogin')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ResetPasswordFallback() {
  const { t } = useTranslation('common');
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4">
      {t('common:actions.loading')}
    </div>
  );
}
