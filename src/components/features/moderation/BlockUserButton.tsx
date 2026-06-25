'use client';

// BlockUserButton - Reusable button for blocking/unblocking users
// Uses blockUserAction and unblockUserAction server actions

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { blockUserAction } from '@/app/actions/user';
import { unblockUserAction, isUserBlockedAction } from '@/app/actions/report';
import { Button } from '@/components/ui';
import { ShieldOffIcon, ShieldIcon, Loader2Icon } from 'lucide-react';

interface BlockUserButtonProps {
    currentUserId: string;
    targetUserId: string;
    targetUserName?: string;
    variant?: 'button' | 'icon' | 'menu-item';
    onBlockChange?: (isBlocked: boolean) => void;
}

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

// Shared toggle icon: spinner while processing, otherwise the block/unblock shield.
// Module-scope so the variant sub-components don't each carry the nested ternary (S3776).
function BlockToggleIcon({ isProcessing, isBlocked, sizeClass }: Readonly<{ isProcessing: boolean; isBlocked: boolean; sizeClass: string }>) {
    if (isProcessing) return <Loader2Icon className={`${sizeClass} animate-spin`} />;
    return isBlocked ? <ShieldOffIcon className={sizeClass} /> : <ShieldIcon className={sizeClass} />;
}

function BlockConfirmBar({ targetUserName, isProcessing, onConfirm, onCancel, t }: Readonly<{ targetUserName?: string; isProcessing: boolean; onConfirm: () => void; onCancel: () => void; t: TranslateFn }>) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
                {targetUserName
                    ? t('moderation.confirmBlock', { name: targetUserName })
                    : t('moderation.confirmBlockGeneric')}
            </span>
            <Button variant="danger" size="sm" onClick={onConfirm} disabled={isProcessing}>
                {isProcessing ? <Loader2Icon className="h-4 w-4 animate-spin" /> : t('actions.yes')}
            </Button>
            <Button variant="outline" size="sm" onClick={onCancel} disabled={isProcessing}>
                {t('actions.cancel')}
            </Button>
        </div>
    );
}

function BlockIconButton({ isProcessing, isBlocked, onToggle, t }: Readonly<{ isProcessing: boolean; isBlocked: boolean; onToggle: () => void; t: TranslateFn }>) {
    return (
        <button
            onClick={onToggle}
            disabled={isProcessing}
            className={`p-2 rounded-lg transition-colors ${isBlocked
                ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            title={isBlocked ? t('moderation.unblockUser') : t('moderation.blockUser')}
        >
            <BlockToggleIcon isProcessing={isProcessing} isBlocked={isBlocked} sizeClass="h-5 w-5" />
        </button>
    );
}

function BlockMenuItem({ isProcessing, isBlocked, onToggle, t }: Readonly<{ isProcessing: boolean; isBlocked: boolean; onToggle: () => void; t: TranslateFn }>) {
    return (
        <button
            onClick={onToggle}
            disabled={isProcessing}
            className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${isBlocked
                ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
        >
            <BlockToggleIcon isProcessing={isProcessing} isBlocked={isBlocked} sizeClass="h-4 w-4" />
            {isBlocked ? t('moderation.unblockUser') : t('moderation.blockUser')}
        </button>
    );
}

function BlockDefaultButton({ isProcessing, isBlocked, onToggle, t }: Readonly<{ isProcessing: boolean; isBlocked: boolean; onToggle: () => void; t: TranslateFn }>) {
    return (
        <Button variant={isBlocked ? 'outline' : 'danger'} onClick={onToggle} disabled={isProcessing}>
            {isProcessing
                ? <Loader2Icon className="h-4 w-4 animate-spin" />
                : <><BlockToggleIcon isProcessing={false} isBlocked={isBlocked} sizeClass="h-4 w-4" />{isBlocked ? t('moderation.unblockUser') : t('moderation.blockUser')}</>}
        </Button>
    );
}

export function BlockUserButton({
    currentUserId,
    targetUserId,
    targetUserName,
    variant = 'button',
    onBlockChange
}: Readonly<BlockUserButtonProps>) {
    const { t } = useTranslation(['common']);
    const [isBlocked, setIsBlocked] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Check initial block status
    useEffect(() => {
        async function checkBlockStatus() {
            const result = await isUserBlockedAction(targetUserId);
            if (result.success && result.data) {
                setIsBlocked(result.data.blockedByMe);
            }
            setIsLoading(false);
        }
        checkBlockStatus();
    }, [targetUserId]);

    const executeToggleBlock = async () => {
        const result = isBlocked
            ? await unblockUserAction(targetUserId)
            : await blockUserAction(currentUserId, targetUserId);
        if (!result.success) return;
        const next = !isBlocked;
        setIsBlocked(next);
        onBlockChange?.(next);
    };

    const handleToggleBlock = async () => {
        if (!showConfirm && !isBlocked) {
            setShowConfirm(true);
            return;
        }
        setIsProcessing(true);
        try {
            await executeToggleBlock();
        } catch (error) {
            console.error('Block/unblock error:', error);
        } finally {
            setIsProcessing(false);
            setShowConfirm(false);
        }
    };

    const handleCancel = () => setShowConfirm(false);

    if (isLoading) {
        return (
            <Button variant="outline" disabled>
                <Loader2Icon className="h-4 w-4 animate-spin" />
            </Button>
        );
    }
    if (showConfirm) {
        return <BlockConfirmBar targetUserName={targetUserName} isProcessing={isProcessing} onConfirm={handleToggleBlock} onCancel={handleCancel} t={t} />;
    }
    if (variant === 'icon') {
        return <BlockIconButton isProcessing={isProcessing} isBlocked={isBlocked} onToggle={handleToggleBlock} t={t} />;
    }
    if (variant === 'menu-item') {
        return <BlockMenuItem isProcessing={isProcessing} isBlocked={isBlocked} onToggle={handleToggleBlock} t={t} />;
    }
    return <BlockDefaultButton isProcessing={isProcessing} isBlocked={isBlocked} onToggle={handleToggleBlock} t={t} />;
}
