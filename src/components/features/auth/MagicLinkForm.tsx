'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input } from '@/components/ui';
import { sendMagicLinkAction } from '@/app/actions/auth-recovery';
import { MailIcon } from 'lucide-react';

const schema = z.object({
    email: z.email(),
});

type FormData = z.infer<typeof schema>;

export function MagicLinkForm() {
    const { t } = useTranslation('auth');
    const [sent, setSent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: 'onTouched',
    });

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        await sendMagicLinkAction(data.email);
        setSent(true);
        setIsSubmitting(false);
    };

    if (sent) {
        return (
            <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm rounded-lg text-center">
                {t('login.magicLinkSent')}
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-2 space-y-3">
            <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                {t('login.magicLinkLabel')}
            </p>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        {...register('email')}
                        type="email"
                        placeholder={t('login.emailPlaceholder')}
                        aria-label={t('login.email')}
                        className="pl-9 text-sm"
                        error={errors.email ? t('login.errors.emailRequired') : undefined}
                    />
                </div>
                <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    isLoading={isSubmitting}
                    className="shrink-0"
                >
                    {t('login.magicLinkSubmit')}
                </Button>
            </div>
        </form>
    );
}
