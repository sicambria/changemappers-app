
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useChat } from '@/hooks/useChat';
import { getConnectionsAction } from '@/app/actions/connection';
import { markMessagesAsReadAction, getMessagesAction, deleteMessageAction } from '@/app/actions/message';
import { useAuth, useNotifications } from '@/components/providers';
import { ActionRequirements } from '@/components/ui/ActionRequirements';
import { Button, Input, Card, Avatar, AvatarFallback, AvatarImage, ScrollArea } from '@/components/ui';
import { ArrowLeft, Send, User as UserIcon, Loader2, Video, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

// Define Friend type matching getConnectionsAction return
interface Friend {
    id: string; // Connection ID
    userId: string; // User ID
    name: string;
    profilePhoto: string | null;
    archetypes: string[] | null;
    city: string | null;
}

interface ChatInterfaceProps {
    initialUserId?: string;
    initialUserName?: string;
}

export default function ChatInterface({ initialUserId, initialUserName = 'Contribution partner' }: Readonly<ChatInterfaceProps>) {
    const { t, i18n } = useTranslation('common');
    const tRef = useRef(t);
    useEffect(() => { tRef.current = t; }); // §1B: mirror latest t for effects/callbacks below; no deps array on purpose
    const timeLocale = i18n.resolvedLanguage || 'en';
    const { user } = useAuth();
    const { isConnected, messages, sendMessage } = useChat();
    const { refreshUnreadCount } = useNotifications();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [history, setHistory] = useState<any[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const markedReadKeysRef = useRef<Set<string>>(new Set());
    const [isSending, setIsSending] = useState(false);
    // AUDIT-20260613-037: per-message soft-delete (sender's own messages only),
    // with an inline confirm so a mis-tap can't retract a message silently.
    const [confirmingDeleteMsgId, setConfirmingDeleteMsgId] = useState<string | null>(null);
    const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);

    const handleDeleteMessage = useCallback(async (messageId: string) => {
        setDeletingMsgId(messageId);
        try {
            const result = await deleteMessageAction(messageId);
            if (result.success) {
                setHistory((prev) => prev.filter((m) => m.id !== messageId));
                toast.success(tRef.current('chat.messageDeleted'));
            } else {
                toast.error(result.error || tRef.current('chat.messageDeleteFailed'));
            }
        } catch {
            toast.error(tRef.current('chat.messageDeleteFailed'));
        } finally {
            setDeletingMsgId(null);
            setConfirmingDeleteMsgId(null);
        }
    }, []);

    // Fetch friends on mount
    useEffect(() => {
        async function fetchFriends() {
            try {
                const result = await getConnectionsAction('ACCEPTED');
                if (result.success && result.data) {
                    const nextFriends = [...result.data];
                    if (initialUserId && !nextFriends.some(friend => friend.userId === initialUserId)) {
                        nextFriends.push({
                            id: `direct-${initialUserId}`,
                            userId: initialUserId,
                            name: initialUserName,
                            profilePhoto: null,
                            archetypes: null,
                            city: null,
                        });
                    }
                    setFriends(nextFriends);
                    if (initialUserId) {
                        setSelectedFriendId(initialUserId);
                    }
                } else {
                    setError(t('errors.generic'));
                }
            } catch {
                setError(t('errors.generic'));
            } finally {
                setIsLoading(false);
            }
        }
        fetchFriends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch history when friend selected
    useEffect(() => {
        if (!selectedFriendId) {
            setHistory([]);
            return;
        }

        async function fetchHistory() {
            setIsHistoryLoading(true);
            try {
                const result = await getMessagesAction(selectedFriendId!);
                if (result.success && result.data) {
                    // Map Prisma messages to UI format if needed, or just use them
                    // Prisma: { id, senderId, receiverId, content, createdAt, ... }
                    // UI needs: content, isSelf (derived), timestamp
                    setHistory(result.data);
                }
            } catch (error) {
                console.error("Failed to load history", error);
            } finally {
                setIsHistoryLoading(false);
            }
        }
        fetchHistory();
    }, [selectedFriendId]);

    // Filter messages for the selected conversation
    // We combine History + New Messages from Socket (that are NOT already in history)
    const conversationMessages = useMemo(() => {
        const historyIds = new Set(history.map(msg => msg.id).filter(Boolean));

        return [
            ...history.map(msg => ({
                id: msg.id,
                senderId: msg.senderId,
                receiverId: msg.receiverId,
                content: msg.content,
                timestamp: new Date(msg.createdAt),
                isSelf: msg.senderId === user?.id
            })),
            ...messages.filter(msg => {
                if (!selectedFriendId || !user) return false;

                // Check if this message is already in history (deduplication)
                if (msg.id && historyIds.has(msg.id)) return false;

                // Otherwise check connection
                const isFromFriend = msg.senderId === selectedFriendId;
                const isToFriend = msg.receiverId === selectedFriendId;

                return isFromFriend || isToFriend;
            })
        ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }, [history, messages, selectedFriendId, user]);

    const unreadIncomingMessageCount = useMemo(() => {
        if (!selectedFriendId || !user) return 0;
        return conversationMessages.filter(msg => msg.senderId === selectedFriendId && msg.receiverId === user.id).length;
    }, [conversationMessages, selectedFriendId, user]);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversationMessages, isHistoryLoading]);

    // Mark messages as read when conversation is active
    useEffect(() => {
        if (!selectedFriendId || !user) {
            return;
        }

        const markKey = `${user.id}:${selectedFriendId}:${unreadIncomingMessageCount}`;
        if (markedReadKeysRef.current.has(markKey)) {
            return;
        }

        markedReadKeysRef.current.add(markKey);
        markMessagesAsReadAction(user.id, selectedFriendId).then(() => {
            refreshUnreadCount();
        });
    }, [selectedFriendId, user, unreadIncomingMessageCount, refreshUnreadCount]);

    const handleSend = useCallback(async () => {
        const trimmedText = inputText.trim();
        if (!trimmedText || !selectedFriendId || isSending) return;

        setIsSending(true);
        try {
            await sendMessage(selectedFriendId, trimmedText);
            setInputText('');

        } finally {
            setIsSending(false);
        }
    }, [inputText, isSending, selectedFriendId, sendMessage]);
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
    }

    if (error) {
        return <div className="text-center text-red-500 p-8">{error}</div>;
    }

    const selectedFriend = friends.find(f => f.userId === selectedFriendId);
    const messageRequirementsId = 'chat-message-requirements';
    const messageRequirements = [!inputText.trim() ? t('actionRequirements.enterMessage') : null];

    return (
        <div className="flex h-[calc(100vh-140px)] gap-4">
            {/* Sidebar: Friends List — on mobile (< md) it is the primary view while no conversation is selected (master-detail pattern) */}
            <div
                data-testid="chat-friends-list"
                className={cn(
                    "w-full md:w-1/4 md:border-r md:pr-4",
                    selectedFriendId ? "hidden md:block" : "block"
                )}
            >
                <h2 className="text-xl font-bold mb-4">{t('nav.messages')}</h2>
                <div className="space-y-2">
                    {friends.length === 0 ? (
                        <p className="text-muted-foreground text-sm">{t('chat.noConnections')}</p>
                    ) : (
                        friends.map(friend => (
                            <button
                                type="button"
                                key={friend.userId}
                                onClick={() => setSelectedFriendId(friend.userId)}
                                className={cn(
                                    "w-full text-left flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                                    selectedFriendId === friend.userId ? "bg-primary/10" : "hover:bg-muted"
                                )}
                            >
                                <Avatar>
                                    <AvatarImage src={friend.profilePhoto || undefined} />
                                    <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                                </Avatar>
                                <div className="overflow-hidden">
                                    <p className="font-medium truncate">{friend.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {/* Last message preview could go here if persistent */}
                                        {friend.city || 'Changemaker'}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area — hidden on mobile until a conversation is selected; the friends list above takes its place */}
            <Card
                data-testid="chat-thread-pane"
                className={cn(
                    "flex-1 flex-col h-full overflow-hidden",
                    selectedFriendId ? "flex" : "hidden md:flex"
                )}
            >
                {selectedFriendId ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b flex items-center gap-3 bg-muted/20">
                            <span className="md:hidden">
                                {/* Mobile back button: returns to the conversations list */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedFriendId(null)}
                                    aria-label={t('chat.backToConversations')}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </span>
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={selectedFriend?.profilePhoto || undefined} />
                                <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
                            </Avatar>
                            <span className="font-semibold">{selectedFriend?.name}</span>
                            <span className={`ml-auto text-xs ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                                {isConnected ? t('chat.online') : t('chat.connecting')}
                            </span>
                            <Link
                                href={`/video?partnerId=${encodeURIComponent(selectedFriendId)}`}
                                className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:text-gray-300 dark:hover:bg-gray-800"
                                aria-label={t('chat.startVideoCall')}
                                title={t('chat.startVideoCall')}
                            >
                                <Video className="h-4 w-4" />
                                <span className="sr-only">{t('chat.startVideoCall')}</span>
                            </Link>
                        </div>

                        {/* Messages */}
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                                {conversationMessages.length === 0 ? (
                                    <p className="text-center text-sm text-muted-foreground py-8">
                                        {t('chat.startConversation')}
                                    </p>
                                ) : (
                                    conversationMessages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                "flex w-full mb-2",
                                                msg.isSelf ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "max-w-[80%] rounded-lg p-3 text-sm",
                                                    msg.isSelf
                                                        ? "bg-primary text-primary-foreground rounded-br-none"
                                                        : "bg-muted rounded-bl-none"
                                                )}
                                            >
                                                <p>{msg.content}</p>
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <span className="text-[10px] opacity-70">
                                                        {msg.timestamp.toLocaleTimeString(timeLocale, { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {msg.isSelf && msg.id && (
                                                        confirmingDeleteMsgId === msg.id ? (
                                                            <span className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteMessage(msg.id)}
                                                                    disabled={deletingMsgId === msg.id}
                                                                    className="text-[10px] underline opacity-90 hover:opacity-100 disabled:opacity-50"
                                                                    aria-label={t('chat.confirmDeleteMessage')}
                                                                >
                                                                    {t('actions.yes')}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setConfirmingDeleteMsgId(null)}
                                                                    disabled={deletingMsgId === msg.id}
                                                                    className="text-[10px] underline opacity-70 hover:opacity-100"
                                                                >
                                                                    {t('actions.cancel')}
                                                                </button>
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => setConfirmingDeleteMsgId(msg.id)}
                                                                className="opacity-50 hover:opacity-100 transition-opacity"
                                                                aria-label={t('chat.deleteMessage')}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

                        {/* Input */}
                        <div className="p-4 border-t space-y-2">
                            <ActionRequirements id={messageRequirementsId} requirements={messageRequirements} />
                            <div className="flex gap-2">
                            <Input
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder={t('chat.messagePlaceholder')}
                                className="flex-1"
                            />
                            <Button onClick={handleSend} disabled={!inputText.trim() || isSending} disabledReasonId={messageRequirements.some(Boolean) ? messageRequirementsId : undefined}>
                                <Send className="h-4 w-4" />
                            </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        {t('chat.selectConversation')}
                    </div>
                )}
            </Card>
        </div>
    );
}
