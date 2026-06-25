'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { LockIcon } from 'lucide-react';
import { TwoFactorSection } from './TwoFactorSection';

interface PasswordForm {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export function ProfileSecurityTab({
    passwordForm,
    setPasswordForm,
    passwordChangePending,
    passwordChangeError,
    passwordChangeSuccess,
    onSubmit,
}: Readonly<{
    passwordForm: PasswordForm;
    setPasswordForm: Dispatch<SetStateAction<PasswordForm>>;
    passwordChangePending: boolean;
    passwordChangeError: string | null;
    passwordChangeSuccess: boolean;
    onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}>) {
    const { t } = useTranslation(['profiles', 'common']);
    return (
        <div className="space-y-6">
            <section id="security-password">
                <div className="flex items-center gap-2 mb-3">
                    <LockIcon className="w-4 h-4 text-emerald-500" />
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{t('profile.security.title')}</h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <LockIcon className="w-4 h-4 text-emerald-500" />
                            {t('profile.security.passwordTitle')}
                        </CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('profile.security.passwordDescription')}
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="currentPassword">
                                    {t('profile.security.currentPassword')}
                                </label>
                                <input
                                    id="currentPassword"
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(event) => setPasswordForm(prev => ({ ...prev, currentPassword: event.target.value }))}
                                    placeholder={t('profile.security.currentPasswordPlaceholder')}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="newPassword">
                                    {t('profile.security.newPassword')}
                                </label>
                                <input
                                    id="newPassword"
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(event) => setPasswordForm(prev => ({ ...prev, newPassword: event.target.value }))}
                                    placeholder={t('profile.security.newPasswordPlaceholder')}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="confirmPassword">
                                    {t('profile.security.confirmPassword')}
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(event) => setPasswordForm(prev => ({ ...prev, confirmPassword: event.target.value }))}
                                    placeholder={t('profile.security.confirmPasswordPlaceholder')}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    required
                                />
                            </div>
                            {passwordChangeError && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{passwordChangeError}</p>}
                            {passwordChangeSuccess && <output className="block text-sm text-emerald-600 dark:text-emerald-400">{t('profile.security.success')}</output>}
                            <Button type="submit" disabled={passwordChangePending}>
                                {passwordChangePending ? t('profile.security.saving') : t('profile.security.submit')}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </section>
            <TwoFactorSection />
        </div>
    );
}
