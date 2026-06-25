'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { BellIcon} from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/components/providers';
import { markAsReadAction, markAllAsReadAction, getNotificationsAction } from '@/app/actions/notification';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

interface Notification {
    id: string;
    type: string;
    title: string;
    message?: string;
    link?: string;
    isRead: boolean;
    createdAt: Date;
    sender?: {
        displayName: string | null;
        profilePhoto: string | null;
    };
}

export function NotificationList() {
    const { t } = useTranslation('common');
    const { user } = useAuth();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useOnClickOutside(containerRef as React.RefObject<HTMLElement>, () => setIsOpen(false));

    const fetchNotifications = async () => {
        if (!user) return;
        setIsLoading(true);
        const result = await getNotificationsAction(user.id);
        if (result.success && result.data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setNotifications(result.data as any); // Type assertion for now
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setUnreadCount(result.data.filter((n: any) => !n.isRead).length);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, user]);

    // Initial fetch for count
    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleMarkAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        await markAsReadAction(id);
    };

    const handleMarkAllRead = async () => {
        if (!user) return;
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        await markAllAsReadAction(user.id);
    };

    const handleClick = (notification: Notification) => {
        if (!notification.isRead) {
            handleMarkAsRead(notification.id);
        }
        setIsOpen(false);
        if (notification.link) {
            router.push(notification.link);
        }
    };

    if (!user) return null;

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={t('notifications.title')}
            >
                <BellIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 z-50 overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('notifications.title')}</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                                {t('notifications.markAllRead')}
                            </button>
                        )}
                    </div>

                    <div className="max-h-[70vh] overflow-y-auto">
                        {(() => {
                        if (isLoading && notifications.length === 0) return (
                            <div className="p-4 text-center text-gray-500">{t('notifications.loading')}</div>
                        );
                        if (notifications.length > 0) return (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {notifications.map((notification) => (
                                    <button
                                        type="button"
                                        key={notification.id}
                                        onClick={() => handleClick(notification)}
                                        className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            {/* Avatar or Icon based on type */}
                                            <div className="flex-shrink-0 mt-1">
                                                {notification.sender?.profilePhoto ? (
                                                    <div className="relative h-8 w-8">
                                                    <Image
                                                        src={notification.sender.profilePhoto}
                                                        alt=""
                                                        fill
                                                        className="rounded-full object-cover"
                                                        unoptimized
                                                    />
                                                    </div>
                                                ) : (
                                                    <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                                        <BellIcon className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 space-y-1">
                                                <p className={`text-sm ${notification.isRead ? 'text-gray-600 dark:text-gray-300' : 'font-medium text-gray-900 dark:text-white'}`}>
                                                    {notification.title}
                                                </p>
                                                {notification.message && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-400">
                                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>

                                            {!notification.isRead && (
                                                <div className="flex-shrink-0 self-center">
                                                    <div className="h-2 w-2 bg-emerald-500 rounded-full" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        );
                        return (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                <BellIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p>{t('notifications.empty')}</p>
                            </div>
                        );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
