'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { RouteIcon, SlidersIcon } from 'lucide-react';
import { updateRouteOverridesAction } from '@/app/actions/profile';
import { getAllRouteConfigsForClient } from '@/app/actions/admin/routes';
import { ExperimentalFeaturesSection } from './ExperimentalFeaturesSection';
import type { AuthUserProfile } from './profile-page-types';

export function ProfileAdvancedTab({ user }: Readonly<{ user: AuthUserProfile }>) {
    const { t } = useTranslation(['profiles', 'common']);
    const [routeOverrides, setRouteOverrides] = useState<Record<string, boolean>>({});
    const [softDisabledRoutes, setSoftDisabledRoutes] = useState<{ routeId: string; path: string; userCanOverride: boolean }[]>([]);
    const [savingOverrides, setSavingOverrides] = useState(false);
    const [overrideSaved, setOverrideSaved] = useState(false);
    const [overrideSaveError, setOverrideSaveError] = useState<string | null>(null);
    const overrideSavedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (overrideSavedTimeoutRef.current) {
                clearTimeout(overrideSavedTimeoutRef.current);
            }
        };
    }, []);

    // Load route configs when the advanced tab mounts
    useEffect(() => {
        getAllRouteConfigsForClient().then(configs => {
            const overridable = configs.softDisabled
                .filter(id => configs.userCanOverride.includes(id))
                .map(id => ({
                    routeId: id,
                    path: `/${id}`,
                    userCanOverride: true,
                }));
            setSoftDisabledRoutes(overridable);
            // Merge existing user overrides
            setRouteOverrides((user?.routeOverrides as Record<string, boolean>) ?? {});
        });
    }, [user?.routeOverrides]);

    const handleSaveOverrides = async () => {
        if (overrideSavedTimeoutRef.current) {
            clearTimeout(overrideSavedTimeoutRef.current);
            overrideSavedTimeoutRef.current = null;
        }

        setSavingOverrides(true);
        setOverrideSaved(false);
        setOverrideSaveError(null);

        try {
            const result = await updateRouteOverridesAction(routeOverrides);
            if (!isMountedRef.current) return;

            if (!result.success) {
                setOverrideSaveError(result.error || t('profile.page.saveSettings'));
                return;
            }

            setOverrideSaved(true);
            overrideSavedTimeoutRef.current = setTimeout(() => {
                if (isMountedRef.current) {
                    setOverrideSaved(false);
                    overrideSavedTimeoutRef.current = null;
                }
            }, 2000);
        } catch {
            if (isMountedRef.current) {
                setOverrideSaveError(t('profile.page.saveSettings'));
            }
        } finally {
            if (isMountedRef.current) {
                setSavingOverrides(false);
            }
        }
    };

    return (
        <div className="space-y-6">
            <section id="route-overrides">
                <div className="flex items-center gap-2 mb-3">
                    <RouteIcon className="w-4 h-4 text-indigo-500" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('profile.page.routeOverridesTitle')}</h2>
                </div>

                {softDisabledRoutes.length === 0 ? (
                    <Card className="bg-gray-50 dark:bg-gray-900 border-dashed">
                        <CardContent className="p-6 text-center text-gray-400">
                            <RouteIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">{t('profile.page.routeOverridesEmpty')}</p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <SlidersIcon className="w-4 h-4 text-indigo-500" />
                                {t('profile.page.routeOverridesCardTitle')}
                            </CardTitle>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('profile.page.routeOverridesDesc')}
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {softDisabledRoutes.map(route => {
                                const isEnabled = routeOverrides[route.routeId] ?? false;
                                return (
                                    <div
                                        key={route.routeId}
                                        className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <RouteIcon className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                                    <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">{route.path}</code>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-medium ${isEnabled ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                {isEnabled ? t('profile.page.routeEnabled') : t('profile.page.routeDisabled')}
                                            </span>
                                            <div
                                                role="switch"
                                                aria-checked={isEnabled}
                                                aria-label={route.path}
                                                onClick={() => setRouteOverrides(prev => ({ ...prev, [route.routeId]: !isEnabled }))}
                                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setRouteOverrides(prev => ({ ...prev, [route.routeId]: !isEnabled })); }}
                                                tabIndex={0}
                                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${isEnabled ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-600'}`}
                                            >
                                                <span aria-hidden="true" className={`block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${isEnabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="pt-3 flex items-center gap-3">
                                <Button
                                    onClick={handleSaveOverrides}
                                    disabled={savingOverrides}
                                    className="bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {savingOverrides ? t('profile.page.savingLabel') : t('profile.page.saveSettings')}
                                </Button>
                                {overrideSaved && (
                                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{t('profile.page.savedConfirmation')}</span>
                                )}
                                {overrideSaveError && (
                                    <span role="alert" className="text-sm text-red-600 dark:text-red-400 font-medium">{overrideSaveError}</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </section>

            <ExperimentalFeaturesSection />
        </div>
    );
}
