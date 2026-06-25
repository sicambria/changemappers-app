'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { MailIcon } from 'lucide-react';
import { requestPasswordResetAction } from '@/app/actions/auth-recovery';

const forgotSchema = z.object({
  email: z.email(),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: ForgotFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await requestPasswordResetAction(data.email);
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.error || t('passwordReset.error'));
      }
    } catch {
      setError(t('passwordReset.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4">
        <Card variant="elevated" className="w-full max-w-md">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">{t('passwordReset.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 text-center">
              {t('passwordReset.sent')}
            </p>
            <p className="mt-4 text-center text-sm">
              <a href="/help/email-not-arriving" className="text-emerald-600 hover:underline">{t('emailHelp.link')}</a>
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
            <MailIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardTitle className="text-2xl">{t('passwordReset.title')}</CardTitle>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {t('passwordReset.subtitle')}
          </p>
        </CardHeader>

        <CardContent>
          {error && (
            <div data-testid="forgot-password-error" className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="relative">
              <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                {...register('email')}
                type="email"
                placeholder={t('passwordReset.email')}
                aria-label={t('passwordReset.email')}
                className="pl-10"
                error={errors.email ? t('onboarding.validation.validEmail') : undefined}
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              {t('passwordReset.submit')}
            </Button>
            <p className="text-center text-sm">
              <a href="/help/email-not-arriving" className="text-emerald-600 hover:underline">{t('emailHelp.link')}</a>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
