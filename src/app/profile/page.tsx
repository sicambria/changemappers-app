'use client';

// User profile page — tabbed layout with section navigation
// Tabs: Profile | Invite | Security | Activity | Settings | Advanced

import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useAuth } from '@/components/providers';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Button, Modal } from '@/components/ui';
import {
    UserIcon,
    EditIcon,
    AlertTriangleIcon,
    LockIcon,
    ChevronRightIcon,
    Settings2Icon,
    ActivityIcon,
    SlidersIcon,
    SendIcon,
} from 'lucide-react';
import { ActionRequirements } from '@/components/ui/ActionRequirements';
import { ProfileEditForm } from '@/components/features/profile/ProfileEditForm';
import { GenericQuestionnaire } from '@/components/shared/GenericQuestionnaire';
import { saveQuizArchetypesAction, updateChangemakerLevelAction } from '@/app/actions/profile';
import { changePasswordAction } from '@/app/actions/auth';
import { deleteAccountAction } from '@/app/actions/user';
import { changemakerLevelTest, archetypeTest } from '@/config/questionnaires';
import { useProfileCompleteness } from '@/hooks/useProfileCompleteness';
import { ProfileCompletenessModal } from '@/components/features/profile/ProfileCompletenessModal';
import { InviteManager } from '@/components/profile/InviteManager';
import { ProfileInfoTab } from '@/components/features/profile/ProfileInfoTab';
import { ProfileActivityTab } from '@/components/features/profile/ProfileActivityTab';
import { ProfileSecurityTab } from '@/components/features/profile/ProfileSecurityTab';
import { ProfileSettingsTab } from '@/components/features/profile/ProfileSettingsTab';
import { ProfileAdvancedTab } from '@/components/features/profile/ProfileAdvancedTab';
import type { ProfileTab, AuthUserProfile } from '@/components/features/profile/profile-page-types';

const getTabConfig = (t: TFunction): { id: ProfileTab; label: string; icon: React.ElementType }[] => [
    { id: 'profile', label: t('profile.tabs.profile'), icon: UserIcon },
    { id: 'invite', label: t('profile.tabs.invite'), icon: SendIcon },
    { id: 'security', label: t('profile.tabs.security'), icon: LockIcon },
    { id: 'settings', label: t('profile.tabs.settings'), icon: Settings2Icon },
    { id: 'activity', label: t('profile.tabs.activity'), icon: ActivityIcon },
    { id: 'advanced', label: t('profile.tabs.advanced'), icon: SlidersIcon },
];

export default function ProfilePage() {
    return (
        <Suspense fallback={<ProfilePageFallback />}>
            <ProfilePageContent />
        </Suspense>
    );
}

function ProfilePageContent() {
    const { t } = useTranslation(['profiles', 'common']);
    const { user: authUser, isAuthenticated, isLoading, logout, refreshUser } = useAuth();
    const user = authUser as AuthUserProfile;
    const router = useRouter();
    const searchParams = useSearchParams();

    const [activeTab, setActiveTab] = useState<ProfileTab>(() => {
        const tab = searchParams.get('tab');
        const valid: ProfileTab[] = ['profile', 'invite', 'security', 'activity', 'settings', 'advanced'];
        return valid.includes(tab as ProfileTab) ? (tab as ProfileTab) : 'profile';
    });
    const TAB_CONFIG = getTabConfig(t);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTest, setActiveTest] = useState<'CHANGEMAKER' | 'ARCHETYPE' | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const deleteKeyword = t('profile.settings.deleteConfirmKeyword');
    const profileDeleteRequirementsId = 'profile-delete-requirements';
    const profileDeleteRequirements = [
        deleteConfirmation.toUpperCase() !== deleteKeyword.toUpperCase() ? t('common:actionRequirements.typeDeleteKeyword', { keyword: deleteKeyword }) : null,
    ];
    const [isCompletenessModalOpen, setIsCompletenessModalOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordChangePending, setPasswordChangePending] = useState(false);
    const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
    const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

    const { percentage, items } = useProfileCompleteness(user);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
                <div className="animate-pulse text-gray-400">{t('common:status.loading')}...</div>
            </div>
        );
    }

    if (!user) return null;

    const connectionCount = user.connectionCount ?? 0;

    const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setPasswordChangeError(null);
        setPasswordChangeSuccess(false);

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordChangeError(t('profile.security.mismatch'));
            return;
        }

        setPasswordChangePending(true);
        try {
            const result = await changePasswordAction(passwordForm.currentPassword, passwordForm.newPassword);
            if (!result.success) {
                setPasswordChangeError(result.error || t('profile.security.genericError'));
                return;
            }
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPasswordChangeSuccess(true);
        } catch {
            setPasswordChangeError(t('profile.security.genericError'));
        } finally {
            setPasswordChangePending(false);
        }
    };

    const handleDeleteAccount = async () => {
        const expected = t('profile.settings.deleteConfirmKeyword');
        if (deleteConfirmation.toUpperCase() !== expected.toUpperCase()) {
            setDeleteError(t('profile.settings.deleteConfirmError'));
            return;
        }
        setIsDeleting(true);
        setDeleteError(null);
        try {
            const result = await deleteAccountAction(user.id, deleteConfirmation);
            if (result.success) {
                await logout();
                router.push('/');
            } else {
                setDeleteError(result.error || t('profile.settings.deleteAccountTitle'));
            }
        } catch {
            setDeleteError(t('profile.settings.deleteAccountTitle'));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            {isEditing && (
                <ProfileEditForm
                    user={user}
                    onClose={() => setIsEditing(false)}
                    onSave={() => { setIsEditing(false); router.refresh(); void refreshUser(); }}
                />
            )}

            {activeTest === 'CHANGEMAKER' && (
                <GenericQuestionnaire
                    config={changemakerLevelTest}
                    onSave={async (result) => updateChangemakerLevelAction(user.id, result)}
                    onClose={() => setActiveTest(null)}
                    onComplete={() => { setActiveTest(null); router.refresh(); void refreshUser(); }}
                />
            )}
            {activeTest === 'ARCHETYPE' && (
                <GenericQuestionnaire
                    config={archetypeTest}
                    onSave={async (result) => saveQuizArchetypesAction(user.id, result)}
                    onClose={() => setActiveTest(null)}
                    onComplete={() => { setActiveTest(null); router.refresh(); void refreshUser(); }}
                />
            )}
            {/* Delete Account Dialog */}
            <Modal
                isOpen={showDeleteDialog}
                onClose={() => { setShowDeleteDialog(false); setDeleteConfirmation(''); setDeleteError(null); }}
                ariaLabelledBy="delete-account-dialog-title"
                closeOnEscape={!isDeleting}
                closeOnBackdropClick={!isDeleting}
                className="max-w-md"
            >
                    <div className="w-full bg-white dark:bg-gray-950 rounded-2xl shadow-2xl border border-red-200 dark:border-red-900/50 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                <AlertTriangleIcon className="h-5 w-5 text-red-600" />
                            </div>
                            <h2 id="delete-account-dialog-title" className="text-lg font-bold text-gray-900 dark:text-white">{t('profile.settings.deleteAccountTitle')}</h2>
                        </div>
                        <div className="space-y-3 mb-6 text-sm text-gray-700 dark:text-gray-300">
                            {/* SAFE: static locale string with only <strong> tags */}
                            <p className="font-medium" dangerouslySetInnerHTML={{ __html: t('profile.page.deleteIrreversible') }} />
                            <ul className="list-disc list-inside space-y-1 text-red-700 dark:text-red-400 pl-2">
                                <li>{t('profile.page.deleteBullet1')}</li>
                                <li>{t('profile.page.deleteBullet2')}</li>
                                <li>{t('profile.page.deleteBullet3')}</li>
                            </ul>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('profile.settings.deleteConfirmLabel')} <strong className="text-red-600">{deleteKeyword}</strong>
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                                placeholder={deleteKeyword}
                            />
                            {deleteError && <p className="mt-1 text-xs text-red-600">{deleteError}</p>}
                        </div>
                        <ActionRequirements id={profileDeleteRequirementsId} requirements={profileDeleteRequirements} className="mb-4" />
                        <div className="flex gap-3">
                             <Button variant="outline" className="flex-1" onClick={() => { setShowDeleteDialog(false); setDeleteConfirmation(''); setDeleteError(null); }} disabled={isDeleting}>
                                {t('common:actions.cancel')}
                            </Button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={isDeleting || deleteConfirmation.toUpperCase() !== deleteKeyword.toUpperCase()}
                                aria-describedby={profileDeleteRequirements.some(Boolean) ? profileDeleteRequirementsId : undefined}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900/40 text-white rounded-lg font-medium text-sm transition-colors disabled:cursor-not-allowed"
                            >
                                {isDeleting ? t('common:status.deleting') : t('profile.settings.deleteAccountConfirmButton')}
                            </button>
                        </div>
                    </div>
            </Modal>

            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Cover + Avatar */}
                <div className="mb-6">
                    {/* Wrapper: relative so avatar can escape the overflow-hidden cover */}
                    <div className="relative mb-16">
                        {/* Cover image — overflow-hidden stays here to clip to rounded corners */}
                        <div className="relative rounded-2xl h-40 overflow-hidden">
                            {user.coverImage ? (
                                <Image src={user.coverImage} alt="Cover" fill className="object-cover" unoptimized />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100 dark:from-gray-800 dark:via-emerald-900/20 dark:to-gray-800" />
                            )}
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 via-black/20 to-transparent"
                            />
                            <div className="absolute top-4 right-4">
                                <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                                    <EditIcon className="h-4 w-4 mr-2" />
                                    {t('common:actions.edit')}
                                </Button>
                            </div>
                        </div>

                        {/* Avatar + name — outside overflow-hidden so the full circle is visible */}
                        <div className="absolute -bottom-12 left-8 flex items-end gap-4">
                            <div className="relative w-24 h-24 bg-white dark:bg-gray-900 rounded-full border-4 border-white dark:border-gray-900 flex items-center justify-center shadow-lg shrink-0">
                                {user.profilePhoto ? (
                                    <Image src={user.profilePhoto} alt={user.name} fill className="rounded-full object-cover" unoptimized />
                                ) : (
                                    <UserIcon className="h-12 w-12 text-gray-400" />
                                )}
                            </div>
                            <div
                                data-testid="profile-name-plate"
                                className="mb-1 max-w-[calc(100vw-10rem)] rounded-xl border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur-md dark:border-gray-700/70 dark:bg-gray-950/85 sm:max-w-xl"
                            >
                                <h1 className="break-words text-2xl font-bold leading-tight text-gray-950 dark:text-white">{user.displayName || user.name}</h1>
                            </div>
                        </div>
                    </div>

                    {/* Profile completeness — clearly clickable */}
                    {percentage < 100 && (
                        <button
                            type="button"
                            onClick={() => setIsCompletenessModalOpen(true)}
                            className="w-full flex items-center justify-between gap-3 mb-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-colors group cursor-pointer text-left"
                            title={t('profile.page.completenessTooltip')}
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                                        {t('profile.page.completenessTitle', { percentage })}
                                    </p>
                                    <p className="text-xs text-amber-600 dark:text-amber-400">
                                        {t('profile.page.completenessHint')}
                                    </p>
                                </div>
                            </div>
                            <ChevronRightIcon className="h-4 w-4 text-amber-500 group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </button>
                    )}
                </div>

                {/* Tab Navigation */}
                <div className="mb-6">
                    <div className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700 pb-0">
                        {TAB_CONFIG.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px ${isActive
                                        ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {activeTab === 'profile' && (
                    <ProfileInfoTab user={user} onTakeTest={setActiveTest} />
                )}

                {activeTab === 'activity' && (
                    <ProfileActivityTab connectionCount={connectionCount} />
                )}

                {activeTab === 'security' && (
                    <ProfileSecurityTab
                        passwordForm={passwordForm}
                        setPasswordForm={setPasswordForm}
                        passwordChangePending={passwordChangePending}
                        passwordChangeError={passwordChangeError}
                        passwordChangeSuccess={passwordChangeSuccess}
                        onSubmit={handlePasswordChange}
                    />
                )}

                {activeTab === 'settings' && (
                    <ProfileSettingsTab
                        user={user}
                        onFediverseSaved={() => router.refresh()}
                        onDeleteClick={() => setShowDeleteDialog(true)}
                    />
                )}

                {activeTab === 'advanced' && (
                    <ProfileAdvancedTab user={user} />
                )}

                {activeTab === 'invite' && (
                    <div className="max-w-2xl mx-auto">
                        <InviteManager />
                    </div>
                )}
            </div>

            <ProfileCompletenessModal
                isOpen={isCompletenessModalOpen}
                onClose={() => setIsCompletenessModalOpen(false)}
                percentage={percentage}
                items={items}
                onEditProfile={() => setIsEditing(true)}
            />
        </>
    );
}

function ProfilePageFallback() {
    const { t } = useTranslation('common');
    return (
        <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center py-12 px-4">
            {t('actions.loading')}
        </div>
    );
}
