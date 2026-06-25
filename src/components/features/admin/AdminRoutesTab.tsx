'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import {
    RouteIcon,
    EyeOffIcon,
    LockIcon,
    UserCheckIcon,
    RefreshCwIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    InfoIcon,
    SaveIcon,
} from 'lucide-react';
import { getRouteConfigsAction, upsertRouteConfigAction, type RouteConfigData } from '@/app/actions/admin/routes';

const CHANGEMAKER_LEVEL_KEYS = [
    { key: 'LEVEL_0', emoji: '😴' },
    { key: 'LEVEL_1', emoji: '👀' },
    { key: 'LEVEL_2', emoji: '♻️' },
    { key: 'LEVEL_3', emoji: '📢' },
    { key: 'LEVEL_4', emoji: '🤝' },
    { key: 'LEVEL_5', emoji: '💡' },
    { key: 'LEVEL_6', emoji: '📈' },
    { key: 'LEVEL_7', emoji: '🔗' },
    { key: 'LEVEL_8', emoji: '🌀' },
    { key: 'LEVEL_9', emoji: '🌍' },
];

type PendingChange = {
    hardDisabled?: boolean;
    softDisabled?: boolean;
    userCanOverride?: boolean;
    levelVisibility?: Record<string, boolean>;
};

export function AdminRoutesTab() {
    const { t } = useTranslation('admin');
    const changemakerLevels = useMemo(() => CHANGEMAKER_LEVEL_KEYS.map(l => {
        const levelName = l.key.split('_')[1];
        const levelLabel = `common:levels.${levelName}`;
        return { ...l, label: `${levelName} - ${t(levelLabel)}` };
    }), [t]);
    const [routes, setRoutes] = useState<RouteConfigData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());
    const [pendingChanges, setPendingChanges] = useState<Record<string, PendingChange>>({});

    const load = useCallback(async () => {
        setLoading(true);
        const res = await getRouteConfigsAction();
        if (res.success && res.data) {
            setRoutes(res.data);
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const getEffective = (route: RouteConfigData): RouteConfigData & PendingChange => ({
        ...route,
        ...pendingChanges[route.routeId],
        levelVisibility: {
            ...route.levelVisibility,
            ...pendingChanges[route.routeId]?.levelVisibility,
        },
    });

    const setPending = (routeId: string, change: Partial<PendingChange>) => {
        setPendingChanges(prev => ({
            ...prev,
            [routeId]: {
                ...prev[routeId],
                ...change,
                ...(change.levelVisibility !== undefined ? {
                    levelVisibility: {
                        ...prev[routeId]?.levelVisibility,
                        ...change.levelVisibility,
                    },
                } : {}),
            },
        }));
    };

    const saveRoute = async (routeId: string) => {
        const change = pendingChanges[routeId];
        if (!change) return;

        setSaving(routeId);
        setMessage(null);
        const res = await upsertRouteConfigAction(routeId, change);
        if (res.success) {
            setMessage({ type: 'success', text: t('routes.saved') });
            setPendingChanges(prev => {
                const next = { ...prev };
                delete next[routeId];
                return next;
            });
            await load();
        } else {
            setMessage({ type: 'error', text: res.error ?? t('routes.saveError') });
        }
        setSaving(null);
    };

    const toggleLevels = (routeId: string) => {
        setExpandedLevels(prev => {
            const next = new Set(prev);
            if (next.has(routeId)) next.delete(routeId);
            else next.add(routeId);
            return next;
        });
    };
    if (loading) {
        return (
            <div className="flex items-center justify-center py-16 text-gray-400">
                <RefreshCwIcon className="w-5 h-5 animate-spin mr-2" />
                {t('common:actions.loading')}
            </div>
        );
    }
    return (
        <div className="space-y-4">
            {/* Legend */}
            <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <EyeOffIcon className="w-4 h-4 text-amber-500" />
                            <span><strong>{t('routes.controls.soft')}:</strong> {t('routes.legend.soft')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <LockIcon className="w-4 h-4 text-red-500" />
                            <span><strong>{t('routes.controls.hard')}:</strong> {t('routes.legend.hard')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <UserCheckIcon className="w-4 h-4 text-emerald-500" />
                            <span><strong>{t('routes.controls.override')}:</strong> {t('routes.legend.override')}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {message && (
                <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                    {message.text}
                </div>
            )}

            {/* Routes list */}
            <div className="space-y-2">
                {routes.map(route => {
                    const eff = getEffective(route);
                    const hasPending = !!pendingChanges[route.routeId];
                    const isExpanded = expandedLevels.has(route.routeId);
                    const isSaving = saving === route.routeId;

                    let routeCardClass: string;
                    if (eff.hardDisabled) { routeCardClass = 'border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/5'; }
                    else if (eff.softDisabled) { routeCardClass = 'border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-900/5'; }
                    else { routeCardClass = ''; }

                    return (
                        <Card
                            key={route.routeId}
                            className={`transition-colors ${routeCardClass}`}
                        >
                            <CardContent className="p-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Route info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <RouteIcon className="w-4 h-4 text-gray-400 shrink-0" />
                                            <code className="text-sm font-mono font-semibold text-gray-800 dark:text-gray-200 truncate">
                                                {route.path}
                                            </code>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
                                                ({route.routeId})
                                            </span>
                                        </div>
                                        {eff.hardDisabled && (
                                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                <LockIcon className="w-3 h-3" /> {t('routes.status.hardDisabled')}
                                            </span>
                                        )}
                                        {!eff.hardDisabled && eff.softDisabled && (
                                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                                <EyeOffIcon className="w-3 h-3" /> {t('routes.status.softDisabled')}
                                            </span>
                                        )}
                                    </div>

                                    {/* Controls */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        {/* Soft disable toggle */}
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={eff.softDisabled}
                                                disabled={eff.hardDisabled}
                                                onChange={e => setPending(route.routeId, { softDisabled: e.target.checked })}
                                                className="w-4 h-4 accent-amber-500 disabled:opacity-40"
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white flex items-center gap-1">
                                                <EyeOffIcon className="w-3.5 h-3.5 text-amber-500" />
                                                {t('routes.controls.soft')}
                                            </span>
                                        </label>

                                        {/* Hard disable toggle */}
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={eff.hardDisabled}
                                                onChange={e => setPending(route.routeId, {
                                                    hardDisabled: e.target.checked,
                                                    ...(e.target.checked ? { softDisabled: false } : {}),
                                                })}
                                                className="w-4 h-4 accent-red-500"
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white flex items-center gap-1">
                                                <LockIcon className="w-3.5 h-3.5 text-red-500" />
                                                {t('routes.controls.hard')}
                                            </span>
                                        </label>

                                        {/* User override toggle (only relevant when soft-disabled) */}
                                        <label className={`flex items-center gap-2 cursor-pointer group transition-opacity ${eff.softDisabled && !eff.hardDisabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                            <input
                                                type="checkbox"
                                                checked={eff.userCanOverride}
                                                disabled={!eff.softDisabled || eff.hardDisabled}
                                                onChange={e => setPending(route.routeId, { userCanOverride: e.target.checked })}
                                                className="w-4 h-4 accent-emerald-500"
                                            />
                                            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white flex items-center gap-1">
                                                <UserCheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                                                {t('routes.controls.override')}
                                            </span>
                                        </label>

                                        {/* Level visibility expander */}
                                        <button
                                            onClick={() => toggleLevels(route.routeId)}
                                            className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            {isExpanded ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
                                            {t('routes.controls.levels')}
                                        </button>

                                        {/* Save button */}
                                        {hasPending && (
                                            <button
                                                onClick={() => saveRoute(route.routeId)}
                                                disabled={isSaving}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {isSaving ? <RefreshCwIcon className="w-3.5 h-3.5 animate-spin" /> : <SaveIcon className="w-3.5 h-3.5" />}
                                                {t('routes.save')}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Per-level visibility panel */}
                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center gap-2 mb-3">
                                            <InfoIcon className="w-4 h-4 text-blue-500" />
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {t('routes.levelsPanel.description')}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                            {changemakerLevels.map(level => {
                                                const levelVis = eff.levelVisibility ?? {};
                                                const isVisible = levelVis[level.key] ?? !eff.softDisabled;
                                                const isOverridden = level.key in (eff.levelVisibility ?? {});

                                                const levelVisClass = isVisible ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30';
                                                const levelOverrideClass = isOverridden ? 'ring-1 ring-blue-400' : '';
                                                return (
                                                    <label
                                                        key={level.key}
                                                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${levelVisClass} ${levelOverrideClass}`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isVisible}
                                                            onChange={e => setPending(route.routeId, {
                                                                levelVisibility: { [level.key]: e.target.checked },
                                                            })}
                                                            className="w-3.5 h-3.5 accent-emerald-500"
                                                        />
                                                        <span className="text-xs leading-tight">
                                                            <span className="mr-0.5">{level.emoji}</span>
                                                            {level.key.replace('LEVEL_', 'L')}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                            {t('routes.levelsPanel.hint')}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {routes.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <RouteIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>{t('routes.empty')}</p>
                </div>
            )}
        </div>
    );
}

export function AdminRoutesTabWrapper() {
    const { t } = useTranslation('admin');
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RouteIcon className="h-5 w-5 text-indigo-500" />
                        {t('routes.title')}
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('routes.description')}
                    </p>
                </CardHeader>
                <CardContent>
                    <AdminRoutesTab />
                </CardContent>
            </Card>
        </div>
    );
}
