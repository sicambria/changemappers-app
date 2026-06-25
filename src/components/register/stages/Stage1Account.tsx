'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, LanguageCombobox, MultiLanguageCombobox, ValidatedInput, PasswordStrengthIndicator } from '@/components/ui';
import { ValidationRule } from '@/hooks/useFieldValidation';
import { registerAction } from '@/app/actions/auth';
import { completeFullRegistrationAccountAction } from '@/app/actions/full-register';
import { ensureLocalIdentitySidecar } from '@/lib/p2p/local-identity';
import { UserIcon, MailIcon, LockIcon, EyeIcon, EyeOffIcon, ArrowRightIcon } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';

const basicsSchema = z.object({
    name: z.string().min(2, 'onboarding.errors.nameMin'),
    displayName: z.string().optional(),
    email: z.email('onboarding.errors.invalidEmail'),
    password: z.string().min(12, 'onboarding.errors.passwordMin'),
    confirmPassword: z.string(),
    invitationCode: z.string().optional(),
    primaryLanguage: z.string().min(2, 'onboarding.errors.primaryLanguage'),
    spokenLanguages: z.array(z.string()).min(1, 'onboarding.errors.spokenLanguages'),
    termsAccepted: z.boolean().refine((value) => value === true, 'register.errors.termsRequired'),
    confirmedAge16Plus: z.boolean().refine((value) => value === true, 'register.errors.ageRequired'),
}).refine((d) => d.password === d.confirmPassword, { // SAFE: Client-side password confirmation
    message: 'onboarding.errors.passwordMismatch',
    path: ['confirmPassword'],
});

type BasicsFormData = z.infer<typeof basicsSchema>;

interface Props {
    onSuccess: (userId: string) => void;
    fullRegistration?: {
        email: string;
        invitationCode?: string;
        account?: { name: string; displayName: string; primaryLanguage: string; spokenLanguages: string[] } | null;
    };
}

const FULL_REG_STAGE1_DRAFT_VERSION = 1;

type FullRegistrationStage1Draft = {
    version: number;
    name: string;
    displayName: string;
    invitationCode: string;
    primaryLanguage: string;
    spokenLanguages: string[];
};

function getFullRegistrationDraftKey(email: string) {
    return `full-registration-stage1-draft:${email.trim().toLowerCase()}`;
}

function clearFullRegistrationDraft(email: string) {
    if (globalThis.window === undefined) return;
    try {
        globalThis.sessionStorage.removeItem(getFullRegistrationDraftKey(email));
    } catch {
        // sessionStorage may be unavailable in private or restricted contexts.
    }
}

function asDraftString(value: unknown, fallback: string) {
    return typeof value === 'string' ? value : fallback;
}

function asDraftStringArray(value: unknown, fallback: string[]) {
    return Array.isArray(value) && value.every((entry) => typeof entry === 'string') ? value : fallback;
}

export default function Stage1Account({ onSuccess, fullRegistration }: Readonly<Props>) {
  const { t } = useTranslation(['auth', 'common', 'validation']);
  const router = useRouter();
  const { language } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);

  const nameRules: ValidationRule[] = [
    { type: 'required', message: t('validation:required') },
    { type: 'minLength', value: 2, message: t('validation:minLength', { min: 2 }) },
  ];

  const emailRules: ValidationRule[] = [
    { type: 'required', message: t('validation:required') },
    { type: 'email', message: t('validation:email') },
  ];

const passwordRules: ValidationRule[] = [
{ type: 'required', message: t('validation:required') },
{ type: 'minLength', value: 12, message: t('validation:password.minLength') },
];

  const stage1DefaultValues: BasicsFormData = { name: fullRegistration?.account?.name ?? '', displayName: fullRegistration?.account?.displayName ?? '', email: fullRegistration?.email ?? '', password: '', confirmPassword: '', invitationCode: fullRegistration?.invitationCode ?? '', primaryLanguage: fullRegistration?.account?.primaryLanguage ?? 'en', spokenLanguages: fullRegistration?.account?.spokenLanguages ?? ['en'], termsAccepted: Boolean(fullRegistration), confirmedAge16Plus: Boolean(fullRegistration) };
  const hasFullRegistration = Boolean(fullRegistration);
  const fullRegistrationEmail = fullRegistration?.email ?? '';
  const fullRegistrationInvitationCode = fullRegistration?.invitationCode ?? '';
  const fullRegistrationAccountName = fullRegistration?.account?.name;
  const fullRegistrationAccountDisplayName = fullRegistration?.account?.displayName;
  const fullRegistrationAccountPrimaryLanguage = fullRegistration?.account?.primaryLanguage;
  const fullRegistrationAccountSpokenLanguages = fullRegistration?.account?.spokenLanguages;
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    getValues,
    reset,
    watch,
  } = useForm<BasicsFormData>({
    resolver: zodResolver(basicsSchema),
    defaultValues: stage1DefaultValues,
    mode: 'onTouched',
  });


    useEffect(() => {
        setIsHydrated(true);
    }, []);
    useEffect(() => {
        if (!hasFullRegistration) return;

        const current = getValues();
        const serverValues: BasicsFormData = {
            ...current,
            name: fullRegistrationAccountName ?? current.name,
            displayName: fullRegistrationAccountDisplayName ?? current.displayName ?? '',
            invitationCode: fullRegistrationInvitationCode || current.invitationCode || '',
            primaryLanguage: fullRegistrationAccountPrimaryLanguage ?? current.primaryLanguage,
            spokenLanguages: fullRegistrationAccountSpokenLanguages ?? current.spokenLanguages,
            email: fullRegistrationEmail,
            password: '',
            confirmPassword: '',
            termsAccepted: true,
            confirmedAge16Plus: true,
        };

        if (globalThis.window === undefined) {
            reset(serverValues);
            return;
        }

        try {
            const stored = globalThis.sessionStorage.getItem(getFullRegistrationDraftKey(fullRegistrationEmail));
            if (!stored) {
                reset(serverValues);
                return;
            }

            const draft = JSON.parse(stored) as Partial<FullRegistrationStage1Draft>;
            if (draft.version !== FULL_REG_STAGE1_DRAFT_VERSION) {
                reset(serverValues);
                return;
            }

            reset({
                ...serverValues,
                name: asDraftString(draft.name, serverValues.name),
                displayName: asDraftString(draft.displayName, serverValues.displayName ?? ''),
                invitationCode: asDraftString(draft.invitationCode, serverValues.invitationCode ?? ''),
                primaryLanguage: asDraftString(draft.primaryLanguage, serverValues.primaryLanguage),
                spokenLanguages: asDraftStringArray(draft.spokenLanguages, serverValues.spokenLanguages),
                email: fullRegistrationEmail,
                password: '',
                confirmPassword: '',
                termsAccepted: true,
                confirmedAge16Plus: true,
            });
        } catch {
            reset(serverValues);
        }
    }, [
        fullRegistrationAccountDisplayName,
        fullRegistrationAccountName,
        fullRegistrationAccountPrimaryLanguage,
        fullRegistrationAccountSpokenLanguages,
        fullRegistrationEmail,
        fullRegistrationInvitationCode,
        getValues,
        hasFullRegistration,
        reset,
    ]);

    useEffect(() => {
        if (!fullRegistration || globalThis.window === undefined) return;

        const subscription = watch((value) => {
            try {
                const draft: FullRegistrationStage1Draft = {
                    version: FULL_REG_STAGE1_DRAFT_VERSION,
                    name: typeof value.name === 'string' ? value.name : '',
                    displayName: typeof value.displayName === 'string' ? value.displayName : '',
                    invitationCode: typeof value.invitationCode === 'string' ? value.invitationCode : '',
                    primaryLanguage: typeof value.primaryLanguage === 'string' ? value.primaryLanguage : 'en',
                    spokenLanguages: Array.isArray(value.spokenLanguages) ? value.spokenLanguages.filter((entry): entry is string => typeof entry === 'string') : ['en'],
                };
                globalThis.sessionStorage.setItem(getFullRegistrationDraftKey(fullRegistration.email), JSON.stringify(draft));
            } catch {
                // Ignore sessionStorage write failures.
            }
        });

        return () => subscription.unsubscribe();
    }, [fullRegistration, watch]);

    const passwordRegistration = register('password');
    const fullRegistrationEmailValue = useWatch({ control, name: 'email' });
    const primaryLanguage = useWatch({ control, name: 'primaryLanguage' });
    const spokenLanguages = useWatch({ control, name: 'spokenLanguages' }) || [];

    const handleStage1Submit = async (data: BasicsFormData) => {
        setIsSubmitting(true);
        setError(null);
        setPendingApproval(false);
        try {
            const identity = await ensureLocalIdentitySidecar();
            if (fullRegistration) {
                const result = await completeFullRegistrationAccountAction({
                    name: data.name,
                    displayName: data.displayName,
                    password: data.password,
                    confirmPassword: data.confirmPassword,
                    invitationCode: data.invitationCode ?? '',
                    primaryLanguage: data.primaryLanguage,
                    spokenLanguages: data.spokenLanguages,
                    didPublicKey: identity.did,
                });
                if (result.success && result.pendingApproval) {
                    clearFullRegistrationDraft(fullRegistration.email);
                    setPendingApproval(true);
                    router.replace('/account/pending-approval');
                } else if (result.success) {
                    clearFullRegistrationDraft(fullRegistration.email);
                    onSuccess(result.userId);
                } else {
                    setError(result.error || t('onboarding.errors.registrationFailed'));
                }
                return;
            }

            const result = await registerAction({
                email: data.email,
                password: data.password,
                name: data.name,
                displayName: data.displayName,
                invitationCode: data.invitationCode ?? '',
                primaryLanguage: data.primaryLanguage,
                spokenLanguages: data.spokenLanguages,
                termsAccepted: data.termsAccepted,
                confirmedAge16Plus: data.confirmedAge16Plus,
                bio: '',
                profilePhoto: '',
                didPublicKey: identity.did,
            });
            if (result.success && result.pendingApproval) {
                setPendingApproval(true);
                router.replace('/account/pending-approval');
            } else if (result.success && result.data?.user.id) {
                onSuccess(result.data.user.id);
            } else {
                setError(result.error || t('onboarding.errors.registrationFailed'));
            }
        } catch {
            setError(t('onboarding.errors.generic'));
        } finally {
            setIsSubmitting(false);
        }
    };

  return (
    <form onSubmit={handleSubmit(handleStage1Submit)} className="space-y-4" data-testid="onboarding-stage1" data-hydrated={isHydrated ? 'true' : 'false'}>
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('onboarding.stage1.title')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('onboarding.stage1.subtitle')}</p>
      </div>

      <div className="relative">
        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
        <ValidatedInput
          {...register('name')}
          data-testid="onboarding-stage1-name"
          rules={nameRules}
          placeholder={t('onboarding.stage1.namePlaceholder')}
          className="pl-9"
          error={errors.name?.message ? t(errors.name.message) : undefined}
        />
      </div>

      <Input {...register('displayName')} data-testid="onboarding-stage1-display-name" placeholder={t('onboarding.stage1.displayNamePlaceholder')} />

      <div className="relative">
        <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
        <ValidatedInput
          {...register('email')}
          data-testid="onboarding-stage1-email"
          type="email"
          rules={emailRules}
          placeholder={t('onboarding.stage1.emailPlaceholder')}
          className="pl-9"
          value={hasFullRegistration ? (fullRegistrationEmail || fullRegistrationEmailValue || '') : undefined}
          readOnly={Boolean(fullRegistration)}
          aria-readonly={Boolean(fullRegistration)}
          error={errors.email?.message ? t(errors.email.message) : undefined}
        />
      </div>

      <div className="relative">
        <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
        <ValidatedInput
          {...passwordRegistration}
          data-testid="onboarding-stage1-password"
          type={showPassword ? 'text' : 'password'}
          rules={passwordRules}
          placeholder={t('onboarding.stage1.passwordPlaceholder')}
          className="pl-9 pr-9"
          error={errors.password?.message ? t(errors.password.message) : undefined}
          onChange={(e) => {
            passwordRegistration.onChange(e);
            setPasswordValue(e.target.value);
          }}
        />
        <button type="button" onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10">
          {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
        </button>
      </div>
      <PasswordStrengthIndicator password={passwordValue} />

      <Input {...register('confirmPassword')} data-testid="onboarding-stage1-confirm-password" type="password" placeholder={t('onboarding.stage1.confirmPasswordPlaceholder')} error={errors.confirmPassword?.message ? t(errors.confirmPassword.message) : undefined} />

      <Input {...register('invitationCode')} data-testid="onboarding-stage1-invite" placeholder={t('onboarding.stage1.invitationCodePlaceholder')} />

      {!fullRegistration && (
        <>
          <label className="flex items-start gap-3 text-xs text-gray-600 dark:text-gray-400">
            <input
              {...register('termsAccepted')}
              data-testid="onboarding-stage1-terms"
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>{t('register.termsAccept')}<Link href="/legal/terms" className="text-emerald-600 hover:underline">{t('register.termsLink')}</Link> {t('register.termsAnd')} <Link href="/privacy" className="text-emerald-600 hover:underline">{t('register.privacyLink')}</Link>.</span>
          </label>
          {errors.termsAccepted && <p className="text-red-500 text-xs">{t(errors.termsAccepted.message as string)}</p>}

          <label className="flex items-start gap-3 text-xs text-gray-600 dark:text-gray-400">
            <input
              {...register('confirmedAge16Plus')}
              data-testid="onboarding-stage1-age"
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>{t('register.age16Confirm')}</span>
          </label>
          {errors.confirmedAge16Plus && <p className="text-red-500 text-xs">{t(errors.confirmedAge16Plus.message as string)}</p>}
        </>
      )}

            <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('onboarding.stage1.primaryLanguageLabel')}
                </label>
                <LanguageCombobox
                    locale={language}
                    value={primaryLanguage}
                    onChange={(val) => setValue('primaryLanguage', val, { shouldValidate: true })}
                    error={errors.primaryLanguage?.message as string}
                />
                {errors.primaryLanguage && <p className="text-red-500 text-xs mt-1">{t(errors.primaryLanguage.message as string)}</p>}
            </div>

            <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('onboarding.stage1.spokenLanguagesLabel')}
                </label>
                <MultiLanguageCombobox
                    locale={language}
                    values={spokenLanguages}
                    onChange={(vals) => setValue('spokenLanguages', vals, { shouldValidate: true })}
                    error={errors.spokenLanguages?.message as string}
                />
                {errors.spokenLanguages && <p className="text-red-500 text-xs mt-1">{t(errors.spokenLanguages.message as string)}</p>}
            </div>

            {pendingApproval && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm rounded-lg" data-testid="onboarding-stage1-pending-approval">
                    <p className="font-semibold">{t('onboarding.lean.pendingApproval.title')}</p>
                    <p>{t('onboarding.lean.pendingApproval.message')}</p>
                </div>
            )}

            {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">{error}</div>}

            <Button type="submit" className="w-full" isLoading={isSubmitting} data-testid="onboarding-stage1-submit">
                {t('onboarding.stage1.nextButton')} <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>

            <p className="text-center text-sm text-gray-500">
                {t('onboarding.stage1.alreadyHaveAccount')}
                <Link href="/login" className="text-emerald-600 hover:underline font-medium ml-1">{t('onboarding.stage1.loginLink')}</Link>
            </p>
        </form>
    );
}
