'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { EditIcon, DownloadIcon, UploadIcon, SaveIcon, XIcon, PlusIcon, TrashIcon, AlertTriangleIcon } from 'lucide-react';
import { adminExportData, adminImportData, adminCreateData, adminDeleteData, type AdminListFilters, PaginatedResponse } from '@/app/actions/admin/manage';
import { toast } from 'sonner';

interface AdminEntityManagerProps {
    title: string;
    type: 'USER' | 'COMMUNITY' | 'EVENT';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetchData: (page: number, pageSize: number, filters?: AdminListFilters) => Promise<PaginatedResponse<any>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateData: (id: string, data: any) => Promise<{ success: boolean; message?: string; error?: string }>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: { key: string; label: string; render?: (item: any) => React.ReactNode }[];
    filterOptions?: {
        status?: { value: string; label: string }[];
        type?: { value: string; label: string }[];
    };
    defaultFilters?: AdminListFilters;
}

export function AdminEntityManager({ title, type, fetchData, updateData, columns, filterOptions: _filterOptions, defaultFilters }: Readonly<AdminEntityManagerProps>) {
    const { t } = useTranslation(['admin', 'common']);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingItem, setEditingItem] = useState<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editForm, setEditForm] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState<number | undefined>(undefined);
    const pageSize = 50;

    const loadData = async () => {
        setLoading(true);
        setErrorMsg(null);
        setSelectedIds(new Set()); // Clear selection on reload
        try {
            const res = await fetchData(page, pageSize, defaultFilters);
            if (res.success && res.data) {
                setItems(res.data);
                if (res.totalPages) setTotalPages(res.totalPages);
                if (res.totalCount !== undefined) setTotalCount(res.totalCount);
            } else {
                setErrorMsg(res.error || t('manage.unknownError'));
                toast.error(t('manage.fetchError') + ' ' + res.error);
            }
        } catch (err) {
            setErrorMsg(err instanceof Error ? err.message : t('manage.renderError'));
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const handleExport = async () => {
        const res = await adminExportData(type);
        if (res.success && res.data) {
            const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type.toLowerCase()}_export.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            toast.success(t('manage.exportSuccess'));
        } else {
            toast.error(t('manage.exportError'));
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (!Array.isArray(json)) {
                    toast.error(t('manage.importFormatError'));
                    return;
                }
                const res = await adminImportData(type, json);
                if (res.success) {
                    toast.success(res.message);
                    loadData();
                } else {
                    toast.error(t('manage.importError') + ' ' + res.error);
                }
            } catch {
                toast.error(t('manage.importJsonError'));
            }
        };
        reader.readAsText(file);
    };

    const handleSave = async () => {
        setIsSaving(true);

        if (isCreating) {
            const res = await adminCreateData(type, editForm);
            if (res.success) {
                setIsCreating(false);
                setEditingItem(null);
                loadData();
            } else {
                toast.error(t('manage.createError') + ' ' + res.error);
            }
        } else {
            const res = await updateData(editingItem.id, editForm);
            if (res.success) {
                toast.success(res.message);
                setEditingItem(null);
                loadData();
            } else {
                toast.error(t('manage.updateError') + ' ' + res.error);
            }
        }
        setIsSaving(false);
    };

    const handleDelete = async (ids: string[]) => {
        if (!confirm(t('manage.deleteConfirm', { count: ids.length }))) return;

        setIsDeleting(true);
        const res = await adminDeleteData(type, ids);
        if (res.success) {
            toast.success(res.message);
            loadData();
        } else {
            toast.error(t('manage.deleteError') + ' ' + res.error);
        }
        setIsDeleting(false);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === items.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(items.map(i => i.id)));
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    return (
        <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                    <CardTitle>{title}</CardTitle>
                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                            <AlertTriangleIcon className="h-4 w-4" />
                            <span>{t('manage.selected', { count: selectedIds.size })}</span>
                            <Button
                                variant="danger"
                                size="sm"
                                className="h-6 px-2 text-xs ml-2 rounded-full"
                                onClick={() => handleDelete(Array.from(selectedIds))}
                                disabled={isDeleting}
                            >
                                <TrashIcon className="h-3 w-3 mr-1" />
                                {t('manage.delete')}
                            </Button>
                        </div>
                    )}
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={() => {
                            setIsCreating(true);
                            setEditForm({});
                            setEditingItem({ id: 'new', name: t('manage.newItem') });
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" /> {t('manage.new')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <DownloadIcon className="h-4 w-4 mr-2" /> {t('manage.exportJson')}
                    </Button>
                    <label className="cursor-pointer inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3">
                        <UploadIcon className="h-4 w-4 mr-2" /> {t('manage.importJson')}
                        <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                    </label>
                </div>
            </CardHeader>
            <CardContent>
                {(() => {
                if (loading) return <div className="text-center py-8">{t('common:actions.loading')}</div>;
                if (items.length === 0) return (
                    <div className="text-center py-8 text-gray-500">
                        {t('manage.noData')}
                        {errorMsg && (
                            <div className="mt-4 text-red-500 text-sm max-w-lg mx-auto overflow-auto break-all bg-red-50 p-4 rounded text-left">
                                {errorMsg}
                            </div>
                        )}
                    </div>
                );
                return (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 dark:text-gray-400">
                                <tr>
                                    <th className="px-4 py-3 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                            checked={items.length > 0 && selectedIds.size === items.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    {columns.map(col => (
                                        <th key={col.key} className="px-6 py-3">{col.label}</th>
                                    ))}
                                    <th className="px-6 py-3 text-right">{t('manage.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.id} className="bg-white border-b dark:bg-gray-900 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-4 w-12 text-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                checked={selectedIds.has(item.id)}
                                                onChange={() => toggleSelect(item.id)}
                                            />
                                        </td>
                                        {columns.map(col => (
                                            <td key={col.key} className="px-6 py-4">
                                                {col.render ? col.render(item) : String(item[col.key] || '')}
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center justify-center"
                                                    onClick={() => {
                                                        setIsCreating(false);
                                                        setEditingItem(item);
                                                        setEditForm(item);
                                                    }}
                                                >
                                                    <EditIcon className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center justify-center"
                                                    onClick={() => handleDelete([item.id])}
                                                    disabled={isDeleting}
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                                <div className="text-sm text-gray-500">
                                    {t('manage.totalResults', { count: totalCount ?? 0 })}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1 || loading}
                                    >
                                        {t('manage.prev')}
                                    </Button>
                                    <span className="text-sm font-medium px-4">
                                        {page} / {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages || loading}
                                    >
                                        {t('manage.next')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                );
                })()}
            </CardContent>

            {/* Edit/Create Modal */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 sticky top-0 bg-white dark:bg-gray-950 z-10 border-b">
                            <CardTitle>{isCreating ? t('manage.createTitle') : t('manage.editTitle', { name: editingItem.name || editingItem.title || t('manage.newItem') })}</CardTitle>
                            <button onClick={() => { setEditingItem(null); setIsCreating(false); }} className="p-2 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800">
                                <XIcon className="h-5 w-5" />
                            </button>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {type === 'USER' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">{t('manage.userName')}</label>
                                        <Input
                                            value={editForm.name || ''}
                                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">{t('manage.userEmail')}</label>
                                        <Input
                                            value={editForm.email || ''}
                                            onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                        />
                                    </div>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(editForm.isModerator)}
                                            onChange={e => setEditForm({ ...editForm, isModerator: e.target.checked })}
                                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        {t('manage.contentModerator')}
                                    </label>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">{t('manage.userRole')}</label>
                                        <select
                                            className="w-full rounded-md border p-2 bg-transparent"
                                            value={editForm.profileType || ''}
                                            onChange={e => setEditForm({ ...editForm, profileType: e.target.value })}
                                        >
                                            <option value="GUEST">GUEST</option>
                                            <option value="COMMUNITY_SEEKER">COMMUNITY_SEEKER</option>
                                            <option value="CHANGEMAPPER">CHANGEMAPPER</option>
                                        </select>
                                    </div>
                                </>
                            )}
                            {type === 'COMMUNITY' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">{t('manage.communityName')}</label>
                                    <Input
                                        value={editForm.name || ''}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    />
                                </div>
                            )}
                            {type === 'EVENT' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">{t('manage.eventTitle')}</label>
                                        <Input
                                            value={editForm.title || ''}
                                            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">{t('manage.eventType')}</label>
                                        <Input
                                            value={editForm.type || ''}
                                            onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                                    <SaveIcon className="h-4 w-4 mr-2" />
                                    {isSaving ? t('manage.saving') : t('manage.save')}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </Card>
    );
}
