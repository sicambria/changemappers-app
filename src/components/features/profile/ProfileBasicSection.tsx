'use client';

import { UseFormRegister, UseFormSetValue, UseFormWatch, FieldErrors } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
    Input,
    Textarea,
    ValidatedInput,
    CityAutocomplete,
} from '@/components/ui';
import { ValidationRule } from '@/hooks/useFieldValidation';
import { UserIcon, UsersIcon } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

// Minimal subset of ProfileFormData needed by this section (documentation only)
interface _BasicFormFields {
    displayName: string;
    bio?: string;
    location?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    isRemoteCapable?: boolean;
    website?: string;
    mainCommunity?: string;
    [key: string]: unknown;
}

interface ProfileBasicSectionProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    register: UseFormRegister<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue: UseFormSetValue<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    watch: UseFormWatch<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    errors: FieldErrors<any>;
    displayNameRules: ValidationRule[];
    websiteRules: ValidationRule[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileBasicSection({
    register,
    setValue,
    watch,
    errors,
    displayNameRules,
    websiteRules,
}: Readonly<ProfileBasicSectionProps>) {
    const { t } = useTranslation(['profiles', 'common', 'validation']);

    return (
        <div className="space-y-4">
            {/* ── DisplayName + Location ─────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('edit.displayName')} *
                    </label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                        <ValidatedInput
                            {...register('displayName')}
                            rules={displayNameRules}
                            className="pl-10"
                            placeholder={t('edit.displayNamePlaceholder')}
                            error={errors.displayName?.message as string | undefined}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('edit.location')}
                    </label>
                    <CityAutocomplete
                        value={
                            watch('location') && watch('latitude') != null && watch('longitude') != null
                                ? { name: watch('location') || '', country: watch('country') || '', lat: watch('latitude')!, lng: watch('longitude')! }
                                : null
                        }
                        onChange={(val) => {
                            if (val) {
                                setValue('location', val.name, { shouldDirty: true });
                                setValue('country', val.country, { shouldDirty: true });
                                setValue('latitude', val.lat, { shouldDirty: true });
                                setValue('longitude', val.lng, { shouldDirty: true });
                            } else {
                                setValue('location', '', { shouldDirty: true });
                                setValue('country', '', { shouldDirty: true });
                                setValue('latitude', undefined, { shouldDirty: true });
                                setValue('longitude', undefined, { shouldDirty: true });
                            }
                        }}
                        placeholder={t('edit.locationPlaceholder', 'Search for a city...')}
                    />
                </div>
            </div>

            {/* ── Bio ───────────────────────────────────────────── */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('edit.bio')}
                </label>
                <Textarea {...register('bio')} rows={4} placeholder={t('edit.bioPlaceholder')} className="resize-none" />
                <p className="mt-1 text-xs text-gray-500">{t('edit.bioHelp')}</p>
            </div>

            {/* ── Website + Main Community ───────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('edit.website')}
                    </label>
                    <ValidatedInput
                        {...register('website')}
                        type="url"
                        rules={websiteRules}
                        placeholder={t('edit.websitePlaceholder')}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                        <UsersIcon className="h-4 w-4 text-gray-400" />
                        {t('edit.mainCommunity')}
                    </label>
                    <Input
                        {...register('mainCommunity')}
                        placeholder={t('edit.mainCommunityPlaceholder')}
                    />
                    <p className="mt-1 text-xs text-gray-400">{t('edit.mainCommunityHelp')}</p>
                </div>
            </div>

            {/* ── isRemoteCapable ────────────────────────────────── */}
            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="isRemoteCapable"
                    {...register('isRemoteCapable')}
                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <label htmlFor="isRemoteCapable" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {t('edit.isRemoteCapable')}
                </label>
            </div>
        </div>
    );
}
