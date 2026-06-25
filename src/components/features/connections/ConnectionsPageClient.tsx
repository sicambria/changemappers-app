'use client';

// Connections page client component
// Tabs for connections and pending requests

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers';
import { ConnectionsList } from './ConnectionsList';
import { ConnectionRequestsList } from './ConnectionRequestsList';
import { RecommendedUsersList } from './RecommendedUsersList';
import { getConnectionsAction, getConnectionRequestsAction, acceptConnectionRequestAction, rejectConnectionRequestAction, removeConnectionAction } from '@/app/actions/connection';
import { Button } from '@/components/ui';
import {
    UsersIcon,
    InboxIcon,
    HeartIcon,
    UserPlusIcon,
    AlertTriangleIcon
} from 'lucide-react';
import { toast } from 'sonner';

type TabType = 'connections' | 'requests' | 'find';

export function ConnectionsPageClient() {
    const { t } = useTranslation(['profiles', 'common']);
    const router = useRouter();
    const { user: _user, isAuthenticated, isLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('connections');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [connections, setConnections] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [requests, setRequests] = useState<any[]>([]);
    const [isFetching, setIsFetching] = useState(true);
    const [fetchError, setFetchError] = useState(false);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [isLoading, isAuthenticated, router]);

    const fetchData = async () => {
        setIsFetching(true);
        setFetchError(false);
        const [connResult, reqResult] = await Promise.all([
            getConnectionsAction(),
            getConnectionRequestsAction()
        ]);

        // Surface a real error state instead of rendering the "no connections"
        // empty state on failure (a failed fetch is not an empty list).
        if (!connResult.success || !reqResult.success) {
            setFetchError(true);
            setIsFetching(false);
            return;
        }

        if (connResult.data) {
            setConnections(connResult.data);
        }
        if (reqResult.data) {
            setRequests(reqResult.data);
        }
        setIsFetching(false);
    };

    const handleRemove = async (userId: string) => {
        const result = await removeConnectionAction(userId);
        if (result.success) {
            toast.success(result.message ?? t('common:connections.removeSuccess'));
            await fetchData();
        } else {
            toast.error(result.error ?? t('common:connections.removeFailed'));
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated]);


    if (isLoading || !isAuthenticated) {
        return null;
    }

    const tabs: { id: TabType; label: string; icon: React.ElementType; count?: number }[] = [
        { id: 'connections', label: t('individual.connections.title'), icon: UsersIcon, count: connections.length },
        { id: 'requests', label: t('connections.requests'), icon: InboxIcon, count: requests.length },
        { id: 'find', label: t('common:connections.allyFinder'), icon: UserPlusIcon },
    ];

    const handleAccept = async (id: string) => {
        const result = await acceptConnectionRequestAction(id);
        if (result.success) {
            toast.success(result.message);
            fetchData(); // Refresh all
        } else {
            toast.error(result.error);
        }
    };

    const handleDecline = async (id: string) => {
        const result = await rejectConnectionRequestAction(id);
        if (result.success) {
            toast.info(result.message);
            fetchData();
        } else {
            toast.error(result.error);
        }
    };

    const handleMessage = (userId: string) => {
        router.push(`/messages?userId=${userId}`);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                    <HeartIcon className="h-8 w-8 text-emerald-600" />
                    {t('individual.connections.title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    {t('common:connections.manageSubtitle')}
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                if (tab.id === 'connections' || tab.id === 'requests') {
                                    void fetchData();
                                }
                            }}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                                ? 'border-emerald-500 text-emerald-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {tab.label}
                            {tab.count != null && tab.count > 0 && (
                                <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${isActive
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            {(() => {
            if (isFetching) return (
                <div className="p-12 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">{t('common:actions.loading')}</p>
                </div>
            );
            if (fetchError) return (
                <div className="p-12 text-center" role="alert">
                    <AlertTriangleIcon className="h-10 w-10 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {t('common:connections.loadError')}
                    </p>
                    <Button onClick={() => void fetchData()}>
                        {t('common:actions.retry')}
                    </Button>
                </div>
            );
            return (
                <>
                    {activeTab === 'connections' && (
                        <ConnectionsList
                            connections={connections.map(c => ({
                                id: c.id,
                                userId: c.userId,
                                userName: c.name,
                                userPhoto: c.profilePhoto,
                                userArchetype: c.senderArchetypes?.[0], // Mapper naming quirk

                                connectedAt: c.createdAt,
                                verificationLevel: 'SELF_DECLARED' // Default
                            }))}
                            onMessage={handleMessage}
                            onRemove={handleRemove}
                        />
                    )}

                    {activeTab === 'requests' && (
                        <ConnectionRequestsList
                            requests={requests}
                            onAccept={handleAccept}
                            onDecline={handleDecline}
                        />
                    )}

                    {activeTab === 'find' && (
                        <RecommendedUsersList />
                    )}
                </>
            );
            })()}
        </div>
    );
}
