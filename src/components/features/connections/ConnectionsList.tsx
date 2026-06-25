'use client';

// Connections List
// Shows existing connections with messaging and profile links

import Image from 'next/image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Card, CardContent, Button, Input } from '@/components/ui';
import {
    UserIcon,
    MessageCircleIcon,
    SearchIcon,
    HeartIcon,
    UserMinusIcon,
    Loader2Icon} from 'lucide-react';
import { VerificationBadge } from '@/components/profile/VerificationBadge';

interface Connection {
    id: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    userArchetype?: string;

    connectedAt: string;
    verificationLevel?: string;
}

interface ConnectionsListProps {
    connections: Connection[];
    onMessage?: (userId: string) => void;
    // Called with the connection's friend userId; the parent performs the
    // removal (removeConnectionAction) and refreshes the list.
    onRemove?: (userId: string) => Promise<void> | void;
}

// Single connection card with inline destructive-confirm removal
// (BlockUserButton precedent — inline confirm, no modal).
function ConnectionCard({
    connection,
    onMessage,
    onRemove,
}: Readonly<{
    connection: Connection;
    onMessage?: (userId: string) => void;
    onRemove?: (userId: string) => Promise<void> | void;
}>) {
    const { t } = useTranslation(['profiles', 'common']);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleConfirm = async () => {
        if (!onRemove) return;
        setIsProcessing(true);
        try {
            await onRemove(connection.userId);
        } finally {
            setIsProcessing(false);
            setShowConfirm(false);
        }
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <Link href={`/profile/${connection.userId}`}>
                        <div className="relative w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                            {connection.userPhoto ? (
                                <Image
                                    src={connection.userPhoto}
                                    alt={connection.userName}
                                    fill
                                    className="rounded-full object-cover"
                                    unoptimized
                                />
                            ) : (
                                <UserIcon className="h-6 w-6 text-gray-400" />
                            )}
                        </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                            <Link
                                href={`/profile/${connection.userId}`}
                                className="font-medium text-gray-900 dark:text-white hover:text-emerald-600 transition-colors block truncate"
                            >
                                {connection.userName}
                            </Link>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            <VerificationBadge level={connection.verificationLevel as any || 'SELF_DECLARED'} size={14} />
                        </div>
                    </div>

                    {/* Actions */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMessage?.(connection.userId)}
                        className="flex-shrink-0"
                        aria-label={t('connections.message')}
                    >
                        <MessageCircleIcon className="h-4 w-4" />
                    </Button>
                    {onRemove && !showConfirm && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowConfirm(true)}
                            className="flex-shrink-0 text-gray-500 hover:text-red-600"
                            aria-label={t('common:connections.remove')}
                            title={t('common:connections.remove')}
                        >
                            <UserMinusIcon className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {/* Inline remove confirmation */}
                {onRemove && showConfirm && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                        <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 min-w-0">
                            {t('common:connections.confirmRemove', { name: connection.userName })}
                        </span>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={handleConfirm}
                            disabled={isProcessing}
                        >
                            {isProcessing ? <Loader2Icon className="h-4 w-4 animate-spin" /> : t('common:actions.yes')}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowConfirm(false)}
                            disabled={isProcessing}
                        >
                            {t('common:actions.cancel')}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function ConnectionsList({ connections, onMessage, onRemove }: Readonly<ConnectionsListProps>) {
    const { t } = useTranslation(['profiles', 'common']);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredConnections = connections.filter(conn =>
        conn.userName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (connections.length === 0) {
        return (
            <div className="text-center py-12">
                <HeartIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                    {t('common:connections.noConnections')}
                </p>
                <Link href="/map">
                    <Button>
                        {t('common:connections.exploreMap')}
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                    placeholder={t('common:connections.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Connections Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredConnections.map((connection) => (
                    <ConnectionCard
                        key={connection.id}
                        connection={connection}
                        onMessage={onMessage}
                        onRemove={onRemove}
                    />
                ))}
            </div>

            {filteredConnections.length === 0 && searchQuery && (
                <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                        {t('common:connections.noResults', { query: searchQuery })}
                    </p>
                </div>
            )}
        </div>
    );
}
