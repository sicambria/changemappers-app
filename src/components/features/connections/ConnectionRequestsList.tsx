'use client';

// Connection Requests List
// Shows pending connection requests with accept/decline actions

import Image from 'next/image';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    acceptConnectionRequestAction,
    rejectConnectionRequestAction,
} from '@/app/actions/connection';
import { Card, CardContent, Button } from '@/components/ui';
import {
    UserIcon,
    CheckIcon,
    XIcon,
    ClockIcon,
    HeartIcon
} from 'lucide-react';

interface ConnectionRequest {
    id: string;
    senderId: string;
    senderName: string;
    senderPhoto?: string;
    senderArchetypes?: string[];
    type: string;
    message?: string;
    createdAt: string;
}

interface ConnectionRequestsListProps {
    requests: ConnectionRequest[];
    onAccept?: (id: string) => void | Promise<void>;
    onDecline?: (id: string) => void | Promise<void>;
}

export function ConnectionRequestsList({
    requests,
    onAccept,
    onDecline,
}: Readonly<ConnectionRequestsListProps>) {
    const { t } = useTranslation(['profiles', 'common']);
    const router = useRouter();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const processingRef = useRef<string | null>(null);
    // AUDIT-20260613-037: decline is destructive + irreversible — require an
    // inline confirm step (BlockUserButton / ConnectionsList precedent) so a
    // mis-tap cannot permanently reject a request.
    const [confirmingDeclineId, setConfirmingDeclineId] = useState<string | null>(null);

    const connectionTypeLabels: Record<string, { label: string; icon: string }> = {
        GENERAL: { label: t('individual.connections.connectionTypes.general'), icon: '🤝' },
        ROMANTIC: { label: t('individual.connections.connectionTypes.romantic'), icon: '💕' },
        COFOUNDER: { label: t('individual.connections.connectionTypes.coFounder'), icon: '🚀' },
        SUPPORT: { label: t('individual.connections.connectionTypes.support'), icon: '💪' },
        COMMUNITY_MEMBER: { label: t('individual.connections.connectionTypes.communityMember'), icon: '🏡' },
    };

    const handleAccept = async (requestId: string) => {
        if (processingRef.current) return;
        processingRef.current = requestId;
        setProcessingId(requestId);
        try {
            if (onAccept) {
                await onAccept(requestId);
            } else {
                const result = await acceptConnectionRequestAction(requestId);
                if (result.success) {
                    toast.success(result.message);
                } else {
                    toast.error(result.error);
                    return;
                }
            }
            router.refresh();
        } finally {
            setProcessingId(null);
            processingRef.current = null;
        }
    };

    const handleDecline = async (requestId: string) => {
        if (processingRef.current) return;
        processingRef.current = requestId;
        setProcessingId(requestId);
        try {
            if (onDecline) {
                await onDecline(requestId);
            } else {
                const result = await rejectConnectionRequestAction(requestId);
                if (result.success) {
                    toast.info(result.message);
                } else {
                    toast.error(result.error);
                    return;
                }
            }
            router.refresh();
        } finally {
            setProcessingId(null);
            processingRef.current = null;
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return t('common:time.today');
        if (diffDays === 1) return t('common:time.yesterday');
        if (diffDays < 7) return t('common:time.daysAgo', { count: diffDays });
        return t('common:time.weeksAgo', { count: Math.floor(diffDays / 7) });
    };

    if (requests.length === 0) {
        return (
            <div className="text-center py-12">
                <HeartIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                    {t('common:connections.noPendingRequests')}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {requests.map((request) => {
                const typeInfo = connectionTypeLabels[request.type] || connectionTypeLabels.GENERAL;
                const isProcessing = processingId === request.id;

                return (
                    <Card key={request.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <Link href={`/profile/${request.senderId}`}>
                                    <div className="relative w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                                        {request.senderPhoto ? (
                                            <Image
                                                src={request.senderPhoto}
                                                alt={request.senderName}
                                                fill
                                                className="rounded-full object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <UserIcon className="h-7 w-7 text-gray-400" />
                                        )}
                                    </div>
                                </Link>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Link
                                            href={`/profile/${request.senderId}`}
                                            className="font-medium text-gray-900 dark:text-white hover:text-emerald-600 transition-colors"
                                        >
                                            {request.senderName}
                                        </Link>
                                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full">
                                            {typeInfo.icon} {typeInfo.label}
                                        </span>
                                    </div>

                                    {(request.senderArchetypes?.length ?? 0) > 0 && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                            {request.senderArchetypes?.[0] ? t(`individual.archetypes.${request.senderArchetypes[0].toLowerCase().replaceAll('_', '')}`) : t('individual.archetypes.notSet')}
                                        </p>
                                    )}

                                    {request.message && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                                            &quot;{request.message}&quot;
                                        </p>
                                    )}

                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <ClockIcon className="h-3 w-3" />
                                        {formatTimeAgo(request.createdAt)}
                                    </div>
                                </div>

                                {/* Actions */}
                                {confirmingDeclineId === request.id ? (
                                    <div // NOSONAR(S6819) — role="group" labels a transient button cluster, not a form fieldset; fieldset would impose form semantics and layout
                                      className="flex items-center gap-2" role="group" aria-label={t('connections.confirmDecline')}>
                                        <span className="text-xs text-gray-600 dark:text-gray-300">{t('connections.confirmDecline')}</span>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => { setConfirmingDeclineId(null); handleDecline(request.id); }}
                                            disabled={isProcessing}
                                            aria-label={t('connections.confirmDecline')}
                                        >
                                            {t('actions.yes')}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setConfirmingDeclineId(null)}
                                            disabled={isProcessing}
                                        >
                                            {t('actions.cancel')}
                                        </Button>
                                    </div>
                                ) : (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setConfirmingDeclineId(request.id)}
                                        disabled={isProcessing}
                                        aria-label={t('connections.declineRequest')}
                                    >
                                        <XIcon className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleAccept(request.id)}
                                        disabled={isProcessing}
                                        isLoading={isProcessing}
                                        aria-label={t('connections.acceptRequest')}
                                    >
                                        <CheckIcon className="h-4 w-4" />
                                        {t('connections.acceptRequest')}
                                    </Button>
                                </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
