'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Shield, Eye, EyeOff, Ban, CheckCircle, Edit } from 'lucide-react';
import { toggleEntityStatusAction, toggleUserSuspensionAction } from '@/app/actions/admin';
import { ModerationStatus } from '@/lib/prisma-shared';

interface AdminToolbarProps {
    type: 'community' | 'event' | 'user';
    id: string;
    currentStatus?: ModerationStatus;
    isSuspended?: boolean;
    onEdit?: () => void;
}

type AdminTranslateFn = (key: string) => string;

// Status pill — extracted module-scope so its nested user/entity ternary does not
// count toward AdminToolbar's cognitive complexity (S3776).
function AdminStatusIndicator({ type, suspended, status, t }: Readonly<{ type: AdminToolbarProps['type']; suspended?: boolean; status?: ModerationStatus; t: AdminTranslateFn }>) {
    if (type === 'user') {
        return (
            <span className={suspended ? 'text-red-400' : 'text-green-400'}>
                {suspended ? `● ${t('toolbar.statusSuspended')}` : `● ${t('toolbar.statusActive')}`}
            </span>
        );
    }
    return (
        <span className={status === 'HIDDEN' ? 'text-red-400' : 'text-green-400'}>
            {status === 'HIDDEN' ? `● ${t('toolbar.statusHidden')}` : `● ${t('toolbar.statusPublic')}`}
        </span>
    );
}

// Action buttons row — extracted module-scope so the per-button conditionals and
// ternaries do not count toward AdminToolbar's cognitive complexity (S3776).
function AdminActionButtons({ type, status, suspended, isLoading, onEdit, onToggleStatus, onToggleSuspension, t }: Readonly<{
    type: AdminToolbarProps['type']; status?: ModerationStatus; suspended?: boolean; isLoading: boolean;
    onEdit?: () => void; onToggleStatus: () => void; onToggleSuspension: () => void; t: AdminTranslateFn;
}>) {
    return (
        <div className="flex gap-2">
            {onEdit && (
                <button
                    onClick={onEdit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                >
                    <Edit className="w-3 h-3" />
                    {t('toolbar.edit')}
                </button>
            )}

            {type !== 'user' && (
                <button
                    onClick={onToggleStatus}
                    disabled={isLoading}
                    className={`flex-1 ${status === 'HIDDEN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors`}
                >
                    {status === 'HIDDEN' ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {status === 'HIDDEN' ? t('toolbar.show') : t('toolbar.hide')}
                </button>
            )}

            {type === 'user' && (
                <button
                    onClick={onToggleSuspension}
                    disabled={isLoading}
                    className={`flex-1 ${suspended ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors`}
                >
                    {suspended ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                    {suspended ? t('toolbar.restore') : t('toolbar.suspend')}
                </button>
            )}
        </div>
    );
}

async function runAdminAction<T>(
    action: () => Promise<{ success: boolean; error?: string | null; data?: T }>,
    onSuccess: () => void,
    onError: (msg: string) => void,
    setIsLoading: (v: boolean) => void,
): Promise<void> {
    setIsLoading(true);
    try {
        const result = await action();
        if (result.success) {
            onSuccess();
        } else {
            onError(result.error ?? '');
        }
    } catch (e) {
        console.error(e);
        onError('');
    } finally {
        setIsLoading(false);
    }
}

export default function AdminToolbar({ type, id, currentStatus, isSuspended, onEdit }: Readonly<AdminToolbarProps>) {
  const { t } = useTranslation('admin');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(currentStatus);
  const [suspended, setSuspended] = useState(isSuspended);

    // Sync state if props change (though usually page reload handles this)
    useEffect(() => {
        setStatus(currentStatus);
        setSuspended(isSuspended);
    }, [currentStatus, isSuspended]);

    const handleToggleStatus = async () => {
        if (type === 'user') return;
        const newStatus = status === 'HIDDEN' ? 'APPROVED' : 'HIDDEN';
        await runAdminAction(
            () => toggleEntityStatusAction(type, id, newStatus),
            () => { setStatus(newStatus); router.refresh(); },
            (msg) => alert(msg || t('toolbar.errorOccurred')),
            setIsLoading,
        );
    };

    const handleToggleSuspension = async () => {
        if (type !== 'user') return;
        await runAdminAction(
            () => toggleUserSuspensionAction(id, !suspended),
            () => { setSuspended(!suspended); router.refresh(); },
            (msg) => alert(msg || t('toolbar.errorOccurred')),
            setIsLoading,
        );
    };

  if (type === 'user' && suspended === undefined) { return null; }
  if (type !== 'user' && !status) { return null; }

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900/90 text-white p-4 rounded-lg shadow-xl border border-slate-700 backdrop-blur-sm flex flex-col gap-3 min-w-[200px] transition-all hover:opacity-100 opacity-90">
<div className="flex items-center gap-2 border-b border-slate-700 pb-2 mb-1">
        <Shield className="w-4 h-4 text-amber-400" />
        <span className="font-bold text-sm uppercase tracking-wider">{t('toolbar.title')}</span>
      </div>

      <div className="flex flex-col gap-2">
        {/* Status Indicator */}
        <div className="text-xs font-mono mb-1">
          <AdminStatusIndicator type={type} suspended={suspended} status={status} t={t} />
        </div>

        <AdminActionButtons
          type={type}
          status={status}
          suspended={suspended}
          isLoading={isLoading}
          onEdit={onEdit}
          onToggleStatus={handleToggleStatus}
          onToggleSuspension={handleToggleSuspension}
          t={t}
        />
      </div>
        </div>
    );
}
