'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Input, LanguageCombobox, MultiLanguageCombobox, ValidatedInput, PasswordStrengthIndicator, CityAutocomplete } from '@/components/ui';
import { ValidationRule } from '@/hooks/useFieldValidation';
import { UserIcon, LockIcon, EyeIcon, EyeOffIcon, ArrowRightIcon } from 'lucide-react';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { completeRegistrationAction } from '@/app/actions/lean-register';
import { resendVerificationEmailAction } from '@/app/actions/auth-recovery';
import { ensureLocalIdentitySidecar } from '@/lib/p2p/local-identity';
import { REGISTRATION_COUNTRY_OPTIONS, REGISTRATION_TIMEZONE_OPTIONS } from '@/lib/registration-location-options';

const passwordSchema = z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Uppercase letter required')
    .regex(/[a-z]/, 'Lowercase letter required')
    .regex(/\d/, 'Number required')
    .regex(/[^A-Za-z0-9]/, 'Special character required');

const schema = z
    .object({
        name: z.string().min(2, 'Name must be at least 2 characters').max(100),
        displayName: z.string().optional(),
        password: passwordSchema,
        confirmPassword: z.string(),
        primaryLanguage: z.string().min(2, 'Choose a language'),
        spokenLanguages: z.array(z.string()).min(1, 'Choose at least one language'),
        country: z.string().min(1, 'onboarding.errors.countryRequired'),
        city: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        timezone: z.string().optional(),
    })
    .refine((d) => d.password === d.confirmPassword, { // SAFE: Client-side password confirmation
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })
    .refine((d) => Boolean(d.city?.trim()) || Boolean(d.timezone?.trim()), {
        message: 'onboarding.errors.timezoneRequired',
        path: ['timezone'],
    });

type FormData = z.infer<typeof schema>;

type StepCoreIdentityInitialValues = Partial<Pick<FormData, 'displayName' | 'primaryLanguage' | 'spokenLanguages' | 'country' | 'city' | 'latitude' | 'longitude' | 'timezone'>>;
type StepCoreIdentitySessionStatus = 'ready' | 'missing-cookie' | 'invalid-cookie' | 'not-found' | 'already-complete' | 'email-unverified';

interface Props {
    onSuccess: (userId: string) => void;
    initialValues?: StepCoreIdentityInitialValues;
    sessionStatus?: StepCoreIdentitySessionStatus;
    resumeEmail?: string;
    continuationReason?: 'cookie-missing';
}

const PENDING_APPROVAL_PATH = '/account/pending-approval';
const PENDING_APPROVAL_NAVIGATION_FALLBACK_MS = 100;

type PendingApprovalRouter = {
    replace: (href: string) => void;
};

type PendingApprovalNavigationRuntime = {
    pathname: () => string;
    replace: (href: string) => void;
    setTimeout: (callback: () => void, delay: number) => number;
    clearTimeout: (timeoutId: number) => void;
};

const browserNavigationRuntime: PendingApprovalNavigationRuntime = {
    pathname: () => globalThis.location.pathname,
    replace: (href) => globalThis.location.replace(href),
    setTimeout: (callback, delay) => globalThis.setTimeout(callback, delay) as unknown as number,
    clearTimeout: (timeoutId) => globalThis.clearTimeout(timeoutId),
};

export function navigateToPendingApproval(
    router: PendingApprovalRouter,
    runtime: PendingApprovalNavigationRuntime = browserNavigationRuntime,
) {
    router.replace(PENDING_APPROVAL_PATH);
    const fallbackTimerId = runtime.setTimeout(() => {
        if (runtime.pathname() !== PENDING_APPROVAL_PATH) {
            runtime.replace(PENDING_APPROVAL_PATH);
        }
    }, PENDING_APPROVAL_NAVIGATION_FALLBACK_MS);

    return () => runtime.clearTimeout(fallbackTimerId);
}

export default function StepCoreIdentity({ onSuccess, initialValues, sessionStatus, resumeEmail = '', continuationReason }: Readonly<Props>) {
    const { t } = useTranslation(['auth', 'validation']);
    const router = useRouter();
    const { language } = useLanguage();
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingApproval, setPendingApproval] = useState(false);
    const pendingApprovalNavigationCancelRef = useRef<(() => void) | null>(null);
    const [passwordValue, setPasswordValue] = useState('');
    const [showCityNudge, setShowCityNudge] = useState(false);
    const [recoveryEmail, setRecoveryEmail] = useState(resumeEmail);
    const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
    const [recoveryError, setRecoveryError] = useState<string | null>(null);
    const [isRecovering, setIsRecovering] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    // Set when the continuation cookie expires mid-session (after this step renders
    // but before submit). Flips the view to the self-service recovery form below so
    // the user is not dead-ended on a plain error string (AUDIT-20260613-027).
    const [midSessionExpired, setMidSessionExpired] = useState(false);

    const nameRules: ValidationRule[] = [
        { type: 'required', message: t('validation:required') },
        { type: 'minLength', value: 2, message: t('validation:minLength', { min: 2 }) },
    ];

    const passwordRules: ValidationRule[] = [
        { type: 'required', message: t('validation:required') },
        { type: 'minLength', value: 12, message: t('validation:password.minLength') },
    ];

    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            displayName: initialValues?.displayName,
            primaryLanguage: initialValues?.primaryLanguage ?? 'hu',
            spokenLanguages: initialValues?.spokenLanguages && initialValues.spokenLanguages.length > 0 ? initialValues.spokenLanguages : ['hu'],
            country: initialValues?.country ?? 'Hungary',
            city: initialValues?.city,
            latitude: initialValues?.latitude,
            longitude: initialValues?.longitude,
            timezone: initialValues?.timezone ?? 'Europe/Budapest',
        },
        mode: 'onTouched',
    });

    const primaryLanguage = useWatch({ control, name: 'primaryLanguage' });
    const spokenLanguages = useWatch({ control, name: 'spokenLanguages' }) || [];
    const city = useWatch({ control, name: 'city' });
    const timezone = useWatch({ control, name: 'timezone' });
    const latitude = useWatch({ control, name: 'latitude' });

    useEffect(() => {
        setIsHydrated(true);
    }, []);
    const longitude = useWatch({ control, name: 'longitude' });

    const recoveryTitleKey = continuationReason === 'cookie-missing'
        ? 'onboarding.lean.step3.cookieMissingTitle'
        : 'onboarding.lean.step3.sessionExpiredTitle';
    const recoveryMessageKey = continuationReason === 'cookie-missing'
        ? 'onboarding.lean.step3.cookieMissingMessage'
        : 'onboarding.lean.step3.sessionExpiredMessage';

    useEffect(() => () => {
        pendingApprovalNavigationCancelRef.current?.();
    }, []);

    const handleRecoverySubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setRecoveryMessage(null);
        setRecoveryError(null);
        setIsRecovering(true);
        const result = await resendVerificationEmailAction(recoveryEmail);
        setIsRecovering(false);
        if (result.success) {
            setRecoveryMessage(t('onboarding.lean.step3.resendSuccess'));
        } else {
            setRecoveryError(result.error || t('onboarding.errors.generic'));
        }
    };

    const onSubmit = async (data: FormData) => {
        if (!data.city && !showCityNudge) {
            setShowCityNudge(true);
            return;
        }

        setIsSubmitting(true);
        setError(null);
        try {
            const identity = await ensureLocalIdentitySidecar();
            const res = await completeRegistrationAction({
                name: data.name,
                displayName: data.displayName,
                password: data.password,
                confirmPassword: data.confirmPassword,
                primaryLanguage: data.primaryLanguage,
                spokenLanguages: data.spokenLanguages,
                country: data.country,
                city: data.city,
                latitude: data.latitude,
                longitude: data.longitude,
                timezone: data.city ? undefined : data.timezone?.trim() || undefined,
                didPublicKey: identity.did,
            });
            if (res.success) {
                if (res.pendingApproval) {
                    setPendingApproval(true);
                    pendingApprovalNavigationCancelRef.current?.();
                    pendingApprovalNavigationCancelRef.current = navigateToPendingApproval(router);
                    return;
                }
                onSuccess(res.userId);
            } else if (res.code === 'session-expired') {
                setMidSessionExpired(true);
            } else {
                setError(res.error);
            }
        } catch {
            setError(t('onboarding.errors.generic'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (pendingApproval) {
        return (
            <div className="space-y-4 text-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t('onboarding.lean.pendingApproval.title')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('onboarding.lean.pendingApproval.message')}
                </p>
                <Link href={PENDING_APPROVAL_PATH} className="inline-flex text-sm font-medium text-emerald-600 hover:underline">
                    {t('onboarding.lean.step1.loginLink')}
                </Link>
            </div>
        );
    }

    if ((sessionStatus && sessionStatus !== 'ready') || midSessionExpired) {
        return (
            <form onSubmit={handleRecoverySubmit} className="space-y-4 text-center">
                <div className="flex justify-center">
                    <LanguageSwitcher variant="buttons" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t(recoveryTitleKey)}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t(recoveryMessageKey)}
                </p>
                <Input
                    type="email"
                    value={recoveryEmail}
                    onChange={(event) => setRecoveryEmail(event.target.value)}
                    placeholder={t('onboarding.lean.step1.emailPlaceholder')}
                    data-testid="lean-core-recovery-email"
                    required
                />
                {recoveryMessage && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm rounded-lg">
                        {recoveryMessage}
                    </div>
                )}
                {recoveryError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                        {recoveryError}
                    </div>
                )}
                <Button type="submit" data-testid="lean-core-resend" className="w-full" isLoading={isRecovering}>
                    {t('onboarding.lean.step3.resendButton')}
                </Button>
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" data-testid="lean-core-form" data-hydrated={isHydrated ? 'true' : 'false'}>
            <div className="text-center mb-5">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {t('onboarding.lean.step3.title')}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t('onboarding.lean.step3.subtitle')}
                </p>
            </div>

            {/* Full name */}
            <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                <ValidatedInput
                    {...register('name')}
                    data-testid="lean-core-name"
                    rules={nameRules}
                    placeholder={t('onboarding.lean.step3.namePlaceholder')}
                    className="pl-9"
                    error={errors.name?.message}
                />
            </div>

            {/* Display name (optional) */}
            <Input
                {...register('displayName')}
                data-testid="lean-core-display-name"
                placeholder={t('onboarding.lean.step3.displayNamePlaceholder')}
            />

            {/* Password */}
            <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                <ValidatedInput
                    {...register('password')}
                    data-testid="lean-core-password"
                    type={showPassword ? 'text' : 'password'}
                    rules={passwordRules}
                    placeholder={t('onboarding.lean.step3.passwordPlaceholder')}
                    className="pl-9 pr-9"
                    error={errors.password?.message}
                    onChange={(e) => setPasswordValue(e.target.value)}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                >
                    {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
            </div>
            <PasswordStrengthIndicator password={passwordValue} />

            {/* Confirm password */}
            <Input
                {...register('confirmPassword')}
                data-testid="lean-core-confirm-password"
                type="password"
                placeholder={t('onboarding.lean.step3.confirmPasswordPlaceholder')}
                error={errors.confirmPassword?.message}
            />

            {/* Primary language */}
            <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('onboarding.lean.step3.primaryLanguageLabel')}
                </label>
                <LanguageCombobox
                    locale={language}
                    value={primaryLanguage}
                    onChange={(val) => setValue('primaryLanguage', val, { shouldValidate: true })}
                    error={errors.primaryLanguage?.message as string}
                />
            </div>

            {/* Spoken languages (optional) */}
            <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('onboarding.lean.step3.spokenLanguagesLabel')}
                </label>
                <MultiLanguageCombobox
                    locale={language}
                    values={spokenLanguages}
                    onChange={(vals) => setValue('spokenLanguages', vals, { shouldValidate: true })}
                />
            </div>

            {/* Location (Country & City) */}
            <div className="space-y-3 pt-2" data-testid="lean-core-location-fields">
                <div className="space-y-1">
                    <CityAutocomplete
                        value={city ? { name: city, country: '', lat: latitude || 0, lng: longitude || 0 } : null}
                        onChange={(val) => {
                            setValue('city', val?.name || '', { shouldValidate: true });
                            setValue('latitude', val?.lat, { shouldValidate: true });
                            setValue('longitude', val?.lng, { shouldValidate: true });
                            setShowCityNudge(false);
                        }}
                        placeholder={t('onboarding.stage3.cityPlaceholder')}
                        error={errors.city?.message as string}
                    />
                    {showCityNudge && (
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-lg">
                            <p className="text-[10px] text-emerald-800 dark:text-emerald-300 leading-tight">
                                {t('onboarding.stage3.cityNudge')}
                            </p>
                            <button
                                type="button"
                                onClick={handleSubmit(onSubmit)}
                                data-testid="lean-core-city-skip"
                                className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 underline mt-1 block"
                            >
                                {t('onboarding.stage3.citySkip')}
                            </button>
                        </div>
                    )}
                </div>
                <div className="relative" data-testid="lean-core-country-row">
                    <select
                        {...register('country')}
                        data-testid="lean-core-country"
                        aria-label={t('onboarding.stage3.countryPlaceholder')}
                        className="w-full rounded-lg border border-gray-300 bg-white p-2.5 pr-6 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                        <option value="" disabled>{t('onboarding.stage3.countryPlaceholder')}</option>
                        {REGISTRATION_COUNTRY_OPTIONS.map((countryOption) => (
                            <option key={countryOption} value={countryOption}>{countryOption}</option>
                        ))}
                    </select>
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 text-xs">*</span>
                    {errors.country?.message && <p className="mt-1 text-xs text-red-600">{t(errors.country.message)}</p>}
                </div>
                {!city && (
                    <div className="relative" data-testid="lean-core-timezone-row">
                        <select
                            {...register('timezone')}
                            data-testid="lean-core-timezone"
                            aria-label={t('onboarding.stage3.timezonePlaceholder')}
                            className="w-full rounded-lg border border-gray-300 bg-white p-2.5 pr-6 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            value={timezone || ''}
                            onChange={(event) => setValue('timezone', event.target.value, { shouldValidate: true })}
                        >
                            <option value="" disabled>{t('onboarding.stage3.timezonePlaceholder')}</option>
                            {REGISTRATION_TIMEZONE_OPTIONS.map((timezoneOption) => (
                                <option key={timezoneOption} value={timezoneOption}>{timezoneOption}</option>
                            ))}
                        </select>
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 text-xs">*</span>
                        {errors.timezone?.message && <p className="mt-1 text-xs text-red-600">{t(errors.timezone.message)}</p>}
                    </div>
                )}
            </div>

            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                    {error}
                </div>
            )}

            <Button type="submit" data-testid="lean-core-submit" className="w-full mt-2" isLoading={isSubmitting}>
                {t('onboarding.lean.step3.submitButton')}
                <ArrowRightIcon className="h-4 w-4 ml-2" />
            </Button>
        </form>
    );
}
