'use client';

// Two-factor (TOTP) management for the profile Security tab (AUDIT-20260613-041 #9).
// Self-contained state machine: disabled → enrolling (QR + verify) → enabled
// (disable / regenerate backup codes). All mutations go through the twofa actions.

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { ShieldCheckIcon } from 'lucide-react';
import {
    getTwoFactorStatusAction,
    startTotpEnrollmentAction,
    confirmTotpEnrollmentAction,
    disableTotpAction,
    regenerateBackupCodesAction,
} from '@/app/actions/twofa';

type View = 'loading' | 'disabled' | 'enrolling' | 'enabled';

const inputClass =
    'w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500';

function BackupCodes({ codes, label }: Readonly<{ codes: string[]; label: string }>) {
    return (
        <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</p>
            <ul
                data-testid="twofa-backup-codes"
                className="grid grid-cols-2 gap-2 font-mono text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
            >
                {codes.map((code) => (
                    <li key={code}>{code}</li>
                ))}
            </ul>
        </div>
    );
}

export function TwoFactorSection() {
    const { t } = useTranslation('auth');
    const [view, setView] = useState<View>('loading');
    const [available, setAvailable] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    // Enrollment artifacts
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [enrollCode, setEnrollCode] = useState('');

    // Codes for disable / regenerate re-auth
    const [manageCode, setManageCode] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

    const loadStatus = useCallback(async () => {
        const result = await getTwoFactorStatusAction();
        if (result.success) {
            setAvailable(result.data.available);
            setView(result.data.isTotpEnabled ? 'enabled' : 'disabled');
        } else {
            setView('disabled');
        }
    }, []);

    useEffect(() => {
        void loadStatus();
    }, [loadStatus]);

    const beginEnrollment = async () => {
        setError(null);
        setPending(true);
        try {
            const result = await startTotpEnrollmentAction();
            if (result.success) {
                setQrDataUrl(result.data.qrDataUrl);
                setSecret(result.data.secret);
                setBackupCodes(null);
                setEnrollCode('');
                setView('enrolling');
            } else {
                setError(result.error || t('twoFactor.errors.generic'));
            }
        } finally {
            setPending(false);
        }
    };

    const confirmEnrollment = async () => {
        setError(null);
        setPending(true);
        try {
            const result = await confirmTotpEnrollmentAction({ code: enrollCode });
            if (result.success) {
                setBackupCodes(result.data.backupCodes);
                setSecret(null);
                setQrDataUrl(null);
                setView('enabled');
            } else {
                setError(result.error || t('twoFactor.errors.invalidCode'));
            }
        } finally {
            setPending(false);
        }
    };

    const disable = async () => {
        setError(null);
        setPending(true);
        try {
            const result = await disableTotpAction({ code: manageCode });
            if (result.success) {
                setManageCode('');
                setBackupCodes(null);
                setView('disabled');
            } else {
                setError(result.error || t('twoFactor.errors.invalidCode'));
            }
        } finally {
            setPending(false);
        }
    };

    const regenerate = async () => {
        setError(null);
        setPending(true);
        try {
            const result = await regenerateBackupCodesAction({ code: manageCode });
            if (result.success) {
                setManageCode('');
                setBackupCodes(result.data.backupCodes);
            } else {
                setError(result.error || t('twoFactor.errors.invalidCode'));
            }
        } finally {
            setPending(false);
        }
    };

    return (
        <section id="security-2fa">
            <div className="flex items-center gap-2 mb-3">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                    {t('twoFactor.title')}
                </h2>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                        {t('twoFactor.cardTitle')}
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('twoFactor.description')}
                    </p>
                </CardHeader>
                <CardContent>
                    {!available && view !== 'loading' && (
                        <output className="block text-sm text-amber-600 dark:text-amber-400">
                            {t('twoFactor.unavailable')}
                        </output>
                    )}

                    {error && (
                        <p role="alert" data-testid="twofa-manage-error" className="text-sm text-red-600 dark:text-red-400 mb-3">
                            {error}
                        </p>
                    )}

                    {view === 'loading' && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t('twoFactor.loading')}</p>
                    )}

                    {view === 'disabled' && available && (
                        <Button
                            type="button"
                            data-testid="twofa-enable"
                            onClick={beginEnrollment}
                            disabled={pending}
                        >
                            {pending ? t('twoFactor.working') : t('twoFactor.enable')}
                        </Button>
                    )}

                    {view === 'enrolling' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-300">{t('twoFactor.enroll.step1')}</p>
                            {qrDataUrl && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                    src={qrDataUrl}
                                    alt={t('twoFactor.enroll.qrAlt')}
                                    width={200}
                                    height={200}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg"
                                />
                            )}
                            {secret && (
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {t('twoFactor.enroll.manualKey')}{' '}
                                    <code data-testid="twofa-secret" className="font-mono break-all">{secret}</code>
                                </p>
                            )}
                            <div>
                                <label htmlFor="twofa-enroll-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('twoFactor.enroll.codeLabel')}
                                </label>
                                <input
                                    id="twofa-enroll-code"
                                    data-testid="twofa-enroll-code"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    value={enrollCode}
                                    onChange={(event) => setEnrollCode(event.target.value)}
                                    placeholder={t('twoFactor.enroll.codePlaceholder')}
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" data-testid="twofa-confirm" onClick={confirmEnrollment} disabled={pending}>
                                    {pending ? t('twoFactor.working') : t('twoFactor.enroll.confirm')}
                                </Button>
                                <Button type="button" variant="secondary" onClick={() => setView('disabled')} disabled={pending}>
                                    {t('twoFactor.cancel')}
                                </Button>
                            </div>
                        </div>
                    )}

                    {view === 'enabled' && (
                        <div className="space-y-4">
                            <output className="block text-sm text-emerald-600 dark:text-emerald-400">
                                {t('twoFactor.enabledStatus')}
                            </output>

                            {backupCodes && (
                                <BackupCodes codes={backupCodes} label={t('twoFactor.backupCodesLabel')} />
                            )}

                            <div>
                                <label htmlFor="twofa-manage-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('twoFactor.manage.codeLabel')}
                                </label>
                                <input
                                    id="twofa-manage-code"
                                    data-testid="twofa-manage-code"
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    value={manageCode}
                                    onChange={(event) => setManageCode(event.target.value)}
                                    placeholder={t('twoFactor.manage.codePlaceholder')}
                                    className={inputClass}
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t('twoFactor.manage.hint')}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button type="button" variant="secondary" data-testid="twofa-regenerate" onClick={regenerate} disabled={pending}>
                                    {t('twoFactor.manage.regenerate')}
                                </Button>
                                <Button type="button" variant="danger" data-testid="twofa-disable" onClick={disable} disabled={pending}>
                                    {pending ? t('twoFactor.working') : t('twoFactor.manage.disable')}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </section>
    );
}
