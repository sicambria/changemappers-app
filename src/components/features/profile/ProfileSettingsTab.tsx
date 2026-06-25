'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui';
import {
    ShieldCheckIcon,
    DownloadIcon,
    Trash2Icon,
    LinkIcon,
    Settings2Icon,
    BellIcon,
} from 'lucide-react';
import { FediverseSettingsCard } from './FediverseSettingsCard';
import { createSignedExportBundlePayloadAction } from '@/app/actions/export';
import { updateEmailNotificationsAction } from '@/app/actions/profile';
import { ensureLocalIdentitySidecar } from '@/lib/p2p/local-identity';
import { signJsonPayload } from '@/lib/p2p/identity';
import type { AuthUserProfile } from './profile-page-types';

type LocalPeer = { id: string; name: string; host: string; port: number; addresses: string[] };

export function ProfileSettingsTab({
    user,
    onFediverseSaved,
    onDeleteClick,
}: Readonly<{
    user: AuthUserProfile;
    onFediverseSaved: () => void;
    onDeleteClick: () => void;
}>) {
    const { t } = useTranslation(['profiles', 'common']);
    const [localPeers, setLocalPeers] = useState<LocalPeer[]>([]);
    const [exportError, setExportError] = useState<string | null>(null);
    const [isExportingBundle, setIsExportingBundle] = useState(false);
    const [emailNotif, setEmailNotif] = useState(user.emailNotificationsEnabled ?? true);
    const [emailNotifSaving, setEmailNotifSaving] = useState(false);

    useEffect(() => {
        let isMounted = true;
        fetch('/api/discovery')
            .then((response) => response.json())
            .then((data: { peers?: LocalPeer[] }) => {
                if (isMounted) setLocalPeers(data.peers ?? []);
            })
            .catch(() => {
                if (isMounted) setLocalPeers([]);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSignedExport = async () => {
        setIsExportingBundle(true);
        setExportError(null);
        try {
            const [identity, payloadResult] = await Promise.all([
                ensureLocalIdentitySidecar(),
                createSignedExportBundlePayloadAction(),
            ]);

            if (!payloadResult.success) {
                setExportError(payloadResult.error);
                return;
            }

            const bundle = signJsonPayload(payloadResult.data, identity);
            const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `changemappers-signed-export-${user.id}.json`;
            anchor.click();
            URL.revokeObjectURL(url);
        } catch (e: unknown) {
            setExportError(e instanceof Error ? e.message : t('profile.page.signedExportError'));
        } finally {
            setIsExportingBundle(false);
        }
    };

    const handleEmailNotifToggle = async () => {
        setEmailNotifSaving(true);
        const next = !emailNotif;
        setEmailNotif(next);
        await updateEmailNotificationsAction(next);
        setEmailNotifSaving(false);
    };

    return (
        <div className="space-y-6">
            <section id="notifications">
                <div className="flex items-center gap-2 mb-3">
                    <BellIcon className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('profile.settings.notificationsTitle')}</h2>
                </div>
                <Card>
                    <CardContent className="p-5">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('profile.settings.notificationsDesc')}</p>
                        <button
                            type="button"
                            disabled={emailNotifSaving}
                            onClick={() => { void handleEmailNotifToggle(); }}
                            className="inline-flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all disabled:opacity-60"
                        >
                            <span className={`w-9 h-5 rounded-full transition-colors ${emailNotif ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                <span className={`block w-3 h-3 mt-1 ml-1 rounded-full bg-white transition-transform ${emailNotif ? 'translate-x-4' : ''}`} />
                            </span>
                            {(() => {
                              if (emailNotifSaving) return t('profile.settings.notificationsSaving');
                              if (emailNotif) return t('profile.settings.notificationsEnabled');
                              return t('profile.settings.notificationsDisabled');
                            })()}
                        </button>
                    </CardContent>
                </Card>
            </section>

            <section id="fediverse">
                <div className="flex items-center gap-2 mb-3">
                    <Settings2Icon className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('profile.page.fediverseSectionTitle')}</h2>
                </div>
                <FediverseSettingsCard
                    settings={user.federationSettings}
                    consentAt={user.federationConsentAt}
                    profileVisibility={user.profileVisibility}
                    onSaved={onFediverseSaved}
                />
            </section>

            {/* GDPR */}
            <section id="gdpr">
                <div className="flex items-center gap-2 mb-3">
                    <ShieldCheckIcon className="w-4 h-4 text-gray-400" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('profile.settings.gdprTitle')}</h2>
                </div>
                <Card>
                    <CardContent className="p-5 space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('profile.page.gdprDesc')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <a
                                href="/api/gdpr/export"
                                className="inline-flex items-center justify-center px-5 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all gap-2 shadow-sm"
                            >
                                <DownloadIcon className="h-4 w-4" />
                                {t('individual.exportData')}
                            </a>
                            <button
                                onClick={handleSignedExport}
                                disabled={isExportingBundle}
                                className="inline-flex items-center justify-center px-5 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all gap-2 shadow-sm disabled:opacity-60"
                            >
                                <DownloadIcon className="h-4 w-4" />
                                {isExportingBundle ? t('profile.page.signedExportLoading') : t('profile.page.signedExportBtn')}
                            </button>
                            <button
                                onClick={onDeleteClick}
                                className="inline-flex items-center justify-center px-5 py-2.5 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/50 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all gap-2 shadow-sm"
                            >
                                <Trash2Icon className="h-4 w-4" />
                                {t('profile.page.deleteAccountBtn')}
                            </button>
                        </div>
                        {exportError && <p className="text-sm text-red-600 dark:text-red-400">{exportError}</p>}
                    </CardContent>
                </Card>
            </section>

            <section id="local-network">
                <div className="flex items-center gap-2 mb-3">
                    <LinkIcon className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('profile.page.localNetworkTitle')}</h2>
                </div>
                <Card>
                    <CardContent className="p-5 space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {t('profile.page.localNetworkDesc')}
                        </p>
                        {localPeers.length === 0 ? (
                            <p className="text-sm text-gray-400">{t('profile.page.localNetworkEmpty')}</p>
                        ) : (
                            <div className="space-y-2">
                                {localPeers.map((peer) => (
                                    <div key={peer.id} className="rounded-lg border border-gray-200 dark:border-gray-800 p-3">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{peer.name}</p>
                                        <p className="text-xs text-gray-500">{peer.host}:{peer.port}</p>
                                        {peer.addresses.length > 0 && (
                                            <p className="text-xs text-gray-400">{peer.addresses.join(', ')}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}
