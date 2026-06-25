'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthProvider';
import { socket } from '@/lib/socket';
import { getUnreadMessageCountAction } from '@/app/actions/message';
import { checkProximityNotificationsAction } from '@/app/actions/proximity';


const NOTIFICATION_SYNC_CHANNEL = 'changemappers-notifications';

type NotificationSyncMessage = {
    type: 'unread-count';
    userId: string;
    count: number;
};

interface NotificationContextType {
    unreadCount: number;
    refreshUnreadCount: () => Promise<void>;
    decrementUnreadCount: (amount?: number) => void;
}

const NotificationContext = createContext<NotificationContextType>({
    unreadCount: 0,
    refreshUnreadCount: async () => { },
    decrementUnreadCount: () => { },
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const syncChannelRef = useRef<BroadcastChannel | null>(null);

    const broadcastUnreadCount = useCallback((count: number) => {
        if (!user) return;
        syncChannelRef.current?.postMessage({
            type: 'unread-count',
            userId: user.id,
            count,
        } satisfies NotificationSyncMessage);
    }, [user]);

    const refreshUnreadCount = useCallback(async () => {
        if (!user) return;
        const result = await getUnreadMessageCountAction(user.id);
        if (result.success && typeof result.data === 'number') {
            setUnreadCount(result.data);
            broadcastUnreadCount(result.data);
        }
    }, [user, broadcastUnreadCount]);

    const decrementUnreadCount = useCallback((amount = 1) => {
        setUnreadCount(prev => {
            const nextCount = Math.max(0, prev - amount);
            broadcastUnreadCount(nextCount);
            return nextCount;
        });
    }, [broadcastUnreadCount]);

    useEffect(() => {
        if (!user || typeof BroadcastChannel === 'undefined') return;

        const channel = new BroadcastChannel(NOTIFICATION_SYNC_CHANNEL);
        syncChannelRef.current = channel;

        const handleMessage = (event: MessageEvent<NotificationSyncMessage>) => {
            if (
                event.data?.type === 'unread-count' &&
                event.data.userId === user.id &&
                typeof event.data.count === 'number'
            ) {
                setUnreadCount(Math.max(0, event.data.count));
            }
        };

        channel.addEventListener('message', handleMessage);

        return () => {
            channel.removeEventListener('message', handleMessage);
            channel.close();
            syncChannelRef.current = null;
        };
    }, [user]);

    useEffect(() => {
        if (user) {
            refreshUnreadCount();
            // Trigger proximity check on login/user change
            checkProximityNotificationsAction();
        } else {
            setUnreadCount(0);
        }
    }, [user, refreshUnreadCount]);

    useEffect(() => {
        if (!user) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void refreshUnreadCount();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user, refreshUnreadCount]);


    useEffect(() => {
        if (!user) return;

        const handleReceiveMessage = () => {
            // Increment unread count on new message
            // Ideally we check if we are on the messaging page for this sender, 
            // but for now simplistic approach: always increment, accessing chat clears it.
            // Actually, if the chat window is open and focused, we might not want to increment.
            // But coordinating that global state is complex. 
            // Better strategy: increment here, and the ChatInterface will clear it when viewed.
            // Or better: refreshing count is safer source of truth.

            // Simple optimistic update:
            setUnreadCount(prev => {
                const nextCount = prev + 1;
                broadcastUnreadCount(nextCount);
                return nextCount;
            });
        };

        socket.on('receive-message', handleReceiveMessage);

        return () => {
            socket.off('receive-message', handleReceiveMessage);
        };
    }, [user, broadcastUnreadCount]);

    const contextValue = useMemo(
        () => ({ unreadCount, refreshUnreadCount, decrementUnreadCount }),
        [unreadCount, refreshUnreadCount, decrementUnreadCount],
    );

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}
        </NotificationContext.Provider>
    );
}
