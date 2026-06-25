'use client';

// Privacy Settings Component
// Allows users to control visibility of their profile elements

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { updatePrivacySettingsAction } from '@/app/actions/profile';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button
} from '@/components/ui';
import {
    UsersIcon,
    GlobeIcon,
    LockIcon,
    MapPinIcon,
    SaveIcon
} from 'lucide-react';

type VisibilityLevel = 'PUBLIC' | 'REGISTERED' | 'CONNECTIONS' | 'PRIVATE';
type LocationPrecisionLevel = 'COUNTRY' | 'CITY' | 'EXACT';

interface PrivacySettingsProps {
    settings: {
        profileVisibility: VisibilityLevel;
        locationVisibility: VisibilityLevel;
        locationPrecision: LocationPrecisionLevel;
        emailVisibility: VisibilityLevel;
        showOnMap: boolean;
        allowConnectionRequests: boolean;
        allowMessages: boolean;
    };
    onSave?: (settings: PrivacySettingsProps['settings']) => void;
}

const locationPrecisionOptions: LocationPrecisionLevel[] = ['COUNTRY', 'CITY', 'EXACT'];

const visibilityOptions: { value: VisibilityLevel; icon: React.ElementType; labelKey: string }[] = [
    { value: 'PUBLIC', icon: GlobeIcon, labelKey: 'privacy.levels.public' },
    { value: 'REGISTERED', icon: UsersIcon, labelKey: 'privacy.levels.registered' },
    { value: 'CONNECTIONS', icon: UsersIcon, labelKey: 'privacy.levels.connections' },
    { value: 'PRIVATE', icon: LockIcon, labelKey: 'privacy.levels.private' },
];

function VisibilitySelector({
    label,
    value,
    onChange,
    translate,
}: Readonly<{
    label: string;
    value: VisibilityLevel;
    onChange: (v: VisibilityLevel) => void;
    translate: (key: string) => string;
}>) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
            <div className="flex gap-1">
                {visibilityOptions.map((option) => {
                    const Icon = option.icon;
                    const isActive = value === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onChange(option.value)}
                            className={`p-2 rounded-lg transition-colors ${isActive
                                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
                                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            title={translate(option.labelKey)}
                            aria-label={translate(option.labelKey)}
                        >
                            <Icon className="h-4 w-4" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function LocationPrecisionSelector({
    value,
    onChange,
    translate,
}: Readonly<{
    value: LocationPrecisionLevel;
    onChange: (v: LocationPrecisionLevel) => void;
    translate: (key: string) => string;
}>) {
    return (
        <div className="py-3 border-b border-gray-100 dark:border-gray-800">
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <MapPinIcon className="h-4 w-4 text-emerald-600" />
                {translate('privacy.discoverability.locationPrecision')}
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
                {locationPrecisionOptions.map((option) => {
                    const isActive = value === option;
                    const key = option.toLowerCase();
                    return (
                        <button
                            key={option}
                            type="button"
                            data-testid={`privacy-location-precision-${key}`}
                            onClick={() => onChange(option)}
                            className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${isActive
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-100'
                                : 'border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'}`}
                            aria-pressed={isActive}
                        >
                            <span className="block font-semibold">{translate(`privacy.discoverability.precision.${key}.label`)}</span>
                            <span className="mt-1 block leading-snug">{translate(`privacy.discoverability.precision.${key}.example`)}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function ToggleSwitch({
    label,
    description,
    checked,
    onChange,
}: Readonly<{
    label: string;
    description?: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}>) {
    return (
        <div className="flex items-start justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div className="flex-1 mr-4">
                <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                {description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {description}
                    </p>
                )}
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                aria-checked={checked}
                role="switch"
            >
                <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    );
}

export function PrivacySettings({ settings: initialSettings, onSave }: Readonly<PrivacySettingsProps>) {
    const { t } = useTranslation(['profiles', 'common']);
    const router = useRouter();
    const [settings, setSettings] = useState(initialSettings);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateSetting = <K extends keyof typeof settings>(
        key: K,
        value: typeof settings[K]
    ) => {
        setSettings(prev => {
            const next = { ...prev, [key]: value };
            return next;
        });
        setIsDirty(true);
    };

    const handleSave = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const result = await updatePrivacySettingsAction(settings);
            if (!result.success) {
                setError(result.error ?? t('common:errors.generic'));
                return;
            }
            router.refresh();
            onSave?.(settings);
            setIsDirty(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <LockIcon className="h-5 w-5 text-emerald-600" />
                    {t('privacy.title')}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Visibility Settings */}
                <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        {t('privacy.visibility.title')}
                    </h4>
                    <VisibilitySelector
                        label={t('privacy.visibility.profile')}
                        value={settings.profileVisibility}
                        onChange={(v) => updateSetting('profileVisibility', v)}
                        translate={t}
                    />
                    <VisibilitySelector
                        label={t('privacy.visibility.location')}
                        value={settings.locationVisibility}
                        onChange={(v) => updateSetting('locationVisibility', v)}
                        translate={t}
                    />
                    <VisibilitySelector
                        label={t('privacy.visibility.email')}
                        value={settings.emailVisibility}
                        onChange={(v) => updateSetting('emailVisibility', v)}
                        translate={t}
                    />
                </div>

                {/* Toggle Settings */}
                <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        {t('privacy.discoverability.title')}
                    </h4>
                    <ToggleSwitch
                        label={t('privacy.discoverability.showOnMap')}
                        description={t('privacy.discoverability.showOnMapDesc')}
                        checked={settings.showOnMap}
                        onChange={(v) => updateSetting('showOnMap', v)}
                    />
                    <LocationPrecisionSelector
                        value={settings.locationPrecision}
                        onChange={(v) => updateSetting('locationPrecision', v)}
                        translate={t}
                    />
                    <ToggleSwitch
                        label={t('privacy.discoverability.allowConnections')}
                        description={t('privacy.discoverability.allowConnectionsDesc')}
                        checked={settings.allowConnectionRequests}
                        onChange={(v) => updateSetting('allowConnectionRequests', v)}
                    />
                    <ToggleSwitch
                        label={t('privacy.discoverability.allowMessages')}
                        checked={settings.allowMessages}
                        onChange={(v) => updateSetting('allowMessages', v)}
                    />
                </div>

                {error && (
                    <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                        {error}
                    </p>
                )}

                {/* Save Button */}
                {isDirty && (
                    <Button
                        onClick={handleSave}
                        className="w-full"
                        isLoading={isSubmitting}
                    >
                        <SaveIcon className="h-4 w-4" />
                        {t('common:actions.saveChanges')}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
