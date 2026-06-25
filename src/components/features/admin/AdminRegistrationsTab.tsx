'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ActionRequirements } from '@/components/ui/ActionRequirements';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { useTranslation } from 'react-i18next';
import { approveRegistrationAction, changeProfileTypeAction } from '@/app/actions/admin';
import { adminDeleteRegistrationUserAction, adminGetRegistrationsAction, adminGetSiteConfigAction, adminSetSiteConfigAction } from '@/app/actions/admin/settings';
import { adminCreateDirectInvitesAction } from '@/app/actions/admin/invite';
import type { RegistrationRow } from '@/app/actions/admin/settings';
import { UsersIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon, ToggleLeftIcon, ToggleRightIcon, ShieldCheckIcon, MailCheckIcon, MailXIcon, UserCheckIcon, MailPlusIcon, SendIcon, Trash2Icon } from 'lucide-react';

// ──────────────────────────────────────────────
// Invite-code toggle
// ──────────────────────────────────────────────

function InviteCodeToggle() {
    const { t } = useTranslation('admin');
    const [required, setRequired] = useState<boolean | null>(null);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    useEffect(() => {
        adminGetSiteConfigAction('requireInviteCode').then((res) => {
            if (res.success) {
                setRequired(res.value !== 'false');
            }
        });
    }, []);

    const toggle = async () => {
        if (required === null) return;
        setSaving(true);
        setMsg(null);
        const next = !required;
        const res = await adminSetSiteConfigAction('requireInviteCode', next ? 'true' : 'false');
        if (res.success) {
            setRequired(next);
            setMsg(next ? t('registrations.msgRequired') : t('registrations.msgNotRequired'));
        } else {
            setMsg(res.error ?? t('registrations.saveError'));
        }
        setSaving(false);
    };

    if (required === null) {
        return <div className="h-10 w-56 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />;
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <button
                    onClick={toggle}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50
                        border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    aria-pressed={required}
                >
                    {required
                        ? <ToggleRightIcon className="w-5 h-5 text-emerald-500" />
                        : <ToggleLeftIcon className="w-5 h-5 text-gray-400" />}
                    <span className={required ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-500'}>
                        {required ? t('registrations.inviteCodeRequired') : t('registrations.inviteCodeNotRequired')}
                    </span>
                </button>
            </div>
            {msg && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{msg}</p>
            )}
        </div>
    );
}

function DirectInviteCard() {
    const { t } = useTranslation('admin');
    const [emails, setEmails] = useState('');
    const [profileType, setProfileType] = useState<'COMMUNITY_SEEKER' | 'CHANGEMAPPER'>('COMMUNITY_SEEKER');
    const [subject, setSubject] = useState('You are invited to Changemappers');
    const [comment, setComment] = useState('');
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const parseEmails = () => emails
        .split(/[\s,;]+/)
        .map((email) => email.trim())
        .filter(Boolean);

    const directInviteRequirementsId = 'admin-direct-invite-requirements';
    const directInviteRequirements = [
        parseEmails().length === 0 ? t('common:actionRequirements.enterInviteEmail') : null,
        subject.trim().length < 3 ? t('common:actionRequirements.enterInviteSubject') : null,
    ];

    const sendDirectInvites = async () => {
        setSending(true);
        setMessage(null);
        setError(null);
        const result = await adminCreateDirectInvitesAction({
            emails: parseEmails(),
            profileType,
            subject,
            comment: comment.trim() || undefined,
        });
        if (result.success && result.data) {
            setMessage(t('registrations.directInviteSuccess', {
                created: result.data.created,
                skipped: result.data.skipped.length,
            }));
            if (result.data.created > 0) {
                setEmails('');
            }
        } else {
            setError(result.error ?? t('registrations.directInviteError'));
        }
        setSending(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <MailPlusIcon className="w-4 h-4 text-emerald-500" />
                    {t('registrations.directInviteTitle')}
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('registrations.directInviteDesc')}
                </p>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                    <div className="space-y-2">
                        <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            {t('registrations.directInviteEmails')}
                        </label>
                        <textarea
                            value={emails}
                            onChange={(event) => setEmails(event.target.value)}
                            rows={4}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            placeholder={t('registrations.directInviteEmailsPlaceholder')}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            {t('registrations.directInviteProfileType')}
                        </label>
                        <select
                            value={profileType}
                            onChange={(event) => setProfileType(event.target.value as 'COMMUNITY_SEEKER' | 'CHANGEMAPPER')}
                            className="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        >
                            <option value="COMMUNITY_SEEKER">COMMUNITY_SEEKER</option>
                            <option value="CHANGEMAPPER">CHANGEMAPPER</option>
                        </select>
                    </div>
                    <div className="space-y-2 lg:col-span-2">
                        <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            {t('registrations.directInviteSubject')}
                        </label>
                        <Input
                            value={subject}
                            onChange={(event) => setSubject(event.target.value)}
                            placeholder={t('registrations.directInviteSubjectPlaceholder')}
                        />
                    </div>
                    <div className="space-y-2 lg:col-span-2">
                        <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            {t('registrations.directInviteComment')}
                        </label>
                        <textarea
                            value={comment}
                            onChange={(event) => setComment(event.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            placeholder={t('registrations.directInviteCommentPlaceholder')}
                        />
                    </div>
                </div>
                {message && <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
                {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
                <div className="mt-4 space-y-2">
                    <ActionRequirements id={directInviteRequirementsId} requirements={directInviteRequirements} />
                    <div className="flex justify-end">
                    <Button
                        type="button"
                        onClick={sendDirectInvites}
                        disabled={sending || parseEmails().length === 0 || subject.trim().length < 3}
                        disabledReasonId={directInviteRequirements.some(Boolean) ? directInviteRequirementsId : undefined}
                        isLoading={sending}
                    >
                        <SendIcon className="w-4 h-4 mr-2" />
                        {t('registrations.directInviteSend')}
                    </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
// ──────────────────────────────────────────────
// Registration table
// ──────────────────────────────────────────────

export function AdminRegistrationsTab() {
    const { t, i18n } = useTranslation('admin');
    const translateRef = useRef(t);
    useEffect(() => { translateRef.current = t; }); // §1B: mirror latest t for effects/callbacks below; no deps array on purpose
    const [rows, setRows] = useState<RegistrationRow[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [approvingUserId, setApprovingUserId] = useState<string | null>(null);
    const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
    const [changingProfileTypeUserId, setChangingProfileTypeUserId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    const fetchData = useCallback(async (p: number, q: string) => {
        setLoading(true);
        setError(null);
        const res = await adminGetRegistrationsAction({ page: p, limit: 25, search: q || undefined });
        if (res.success && res.data) {
            setRows(res.data.registrations);
            setTotal(res.data.total);
            setPage(res.data.page);
            setTotalPages(res.data.totalPages);
        } else {
            setError(res.error ?? translateRef.current('registrations.loadingError'));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        setPage(1);
        fetchData(1, debouncedSearch);
    }, [debouncedSearch, fetchData]);

    const approveRegistration = async (userId: string) => {
        setApprovingUserId(userId);
        setError(null);
        const res = await approveRegistrationAction(userId);
        if (res.success) {
            await fetchData(page, debouncedSearch);
        } else {
            setError(res.error ?? translateRef.current('registrations.approveError'));
        }
        setApprovingUserId(null);
    };

    const changeProfileType = async (userId: string, profileType: string) => {
        setChangingProfileTypeUserId(userId);
        setError(null);
        const res = await changeProfileTypeAction(userId, profileType as 'GUEST' | 'COMMUNITY_SEEKER' | 'CHANGEMAPPER');
        if (res.success) {
            await fetchData(page, debouncedSearch);
        } else {
            setError(res.error ?? translateRef.current('registrations.changeProfileTypeError'));
        }
        setChangingProfileTypeUserId(null);
    };

    const deleteRegistrationUser = async (row: RegistrationRow) => {
        const confirmed = globalThis.confirm(
            translateRef.current('registrations.deleteConfirm', { email: row.email })
        );
        if (!confirmed) return;

        setDeletingUserId(row.id);
        setError(null);
        const res = await adminDeleteRegistrationUserAction(row.id);
        if (res.success) {
            await fetchData(page, debouncedSearch);
        } else {
            setError(res.error ?? translateRef.current('registrations.deleteError'));
        }
        setDeletingUserId(null);
    };

    return (
        <div className="space-y-6">
            {/* Invite code toggle card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldCheckIcon className="w-4 h-4 text-emerald-500" />
                        {t('registrations.inviteCodeTitle')}
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('registrations.inviteCodeDesc')}
                    </p>
                </CardHeader>
                <CardContent>
                    <InviteCodeToggle />
                </CardContent>
            </Card>

            <DirectInviteCard />

            {/* Registrations table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <UsersIcon className="w-4 h-4 text-blue-500" />
                            {t('registrations.title')}
                            {!loading && (
                                <span className="ml-1 text-xs font-normal text-gray-400">({t('manage.totalResults', { count: total })})</span>
                            )}
                        </CardTitle>
                        <div className="relative w-full sm:w-64">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder={t('registrations.searchPlaceholder')}
                                className="pl-8 h-8 text-sm"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {error && (
                        <div className="p-4 text-sm text-red-600 dark:text-red-400">{error}</div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="px-4 py-3 text-left font-medium">{t('registrations.email')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('registrations.name')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('registrations.registeredAt')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('registrations.inviteCode')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('registrations.type')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('registrations.emailStatus')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('registrations.approvalStatus')}</th>
                                    <th className="px-4 py-3 text-left font-medium">{t('registrations.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className={loading ? 'opacity-50 pointer-events-none' : ''}>
                                {rows.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                                            {debouncedSearch ? t('registrations.noResults') : t('registrations.empty')}
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                        >
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">
                                                <div className="flex items-center gap-1.5">
                                                    {row.isAdmin && (
                                                        <ShieldCheckIcon className="w-3 h-3 text-amber-500 shrink-0" aria-label="Admin" />
                                                    )}
                                                    <span className="truncate">{row.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                {row.name === '_pending_' ? (
                                                    <span className="text-xs text-amber-500 italic">{t('registrations.pending')}</span>
                                                ) : (
                                                    row.name
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                {new Date(row.createdAt).toLocaleString(i18n.resolvedLanguage, {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.usedInviteCode ? (
                                                    <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-gray-700 dark:text-gray-300">
                                                        {row.usedInviteCode}
                                                    </code>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={row.profileType}
                                                    onChange={(e) => changeProfileType(row.id, e.target.value)}
                                                    disabled={changingProfileTypeUserId === row.id || loading}
                                                    aria-label={t('registrations.changeProfileType')}
                                                    className="h-7 rounded border border-gray-200 bg-white px-1 text-xs text-gray-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white disabled:opacity-50"
                                                >
                                                    <option value="GUEST">GUEST</option>
                                                    <option value="COMMUNITY_SEEKER">COMMUNITY_SEEKER</option>
                                                    <option value="CHANGEMAPPER">CHANGEMAPPER</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.isEmailVerified ? (
                                                    <MailCheckIcon className="w-4 h-4 text-emerald-500" aria-label={t('registrations.verified')} />
                                                ) : (
                                                    <MailXIcon className="w-4 h-4 text-gray-300 dark:text-gray-600" aria-label={t('registrations.unverified')} />
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.isSuspended ? (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => approveRegistration(row.id)}
                                                        disabled={approvingUserId === row.id || loading}
                                                        className="h-7 px-2 text-xs"
                                                    >
                                                        <UserCheckIcon className="w-3.5 h-3.5 mr-1" />
                                                        {t('registrations.approve')}
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                        {t('registrations.approved')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => deleteRegistrationUser(row)}
                                                    disabled={row.isAdmin || deletingUserId === row.id || loading}
                                                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700 dark:text-red-400"
                                                    aria-label={t('registrations.deleteUserAria', { email: row.email })}
                                                >
                                                    <Trash2Icon className="w-3.5 h-3.5 mr-1" />
                                                    {t('registrations.delete')}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
                            <span className="text-xs text-gray-500">
                                {t('manage.pagination', { current: page, total: totalPages })}
                            </span>
                            <div className="flex items-center gap-1">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => { const p = page - 1; setPage(p); fetchData(p, debouncedSearch); }}
                                    disabled={page <= 1 || loading}
                                    className="h-7 w-7 p-0"
                                >
                                    <ChevronLeftIcon className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => { const p = page + 1; setPage(p); fetchData(p, debouncedSearch); }}
                                    disabled={page >= totalPages || loading}
                                    className="h-7 w-7 p-0"
                                >
                                    <ChevronRightIcon className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
