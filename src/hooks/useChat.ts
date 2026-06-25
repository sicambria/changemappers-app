import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { socket, SOCKET_CHAT_ENABLED } from '@/lib/socket';
import { useAuth } from '@/components/providers';
import { sendMessageAction } from '@/app/actions/message';

interface Message {
    id?: string;
    senderId: string;
    receiverId?: string;
    content: string;
    timestamp: Date;
    isSelf?: boolean;
}

function addSentMessageIfNew(
    prev: Message[],
    data: { id: string; senderId: string; receiverId: string; content: string; createdAt: string },
): Message[] {
    if (prev.some(m => m.id === data.id)) return prev;
    return [...prev, {
        id: data.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
        timestamp: new Date(data.createdAt),
        isSelf: true,
    }];
}

export function useChat() {
    const { t } = useTranslation('common');
    const tRef = useRef(t);
    useEffect(() => { tRef.current = t; });
    const { user } = useAuth();
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [messages, setMessages] = useState<Message[]>([]);

    useEffect(() => {
        if (!user || !SOCKET_CHAT_ENABLED) {
            setIsConnected(false);
            return;
        }

        function onConnect() {
            setIsConnected(true);
        }

        function onDisconnect() {
            setIsConnected(false);
        }

        function onConnectError() {
            setIsConnected(false);
        }

        function onReceiveMessage(data: { id: string, senderId: string, receiverId: string, content: string, timestamp: string }) {
            setMessages(prev => [...prev, {
                id: data.id,
                senderId: data.senderId,
                receiverId: data.receiverId,
                content: data.content,
                timestamp: new Date(data.timestamp),
                isSelf: false
            }]);
        }

        function onMessageSent(data: { id: string, senderId: string, receiverId: string, content: string, createdAt: string }) {
            // This event comes from server after successful save.
            // We can use it to replace the optimistic message or just ignore if we trust optimistic.
            // But better to update ID if possible, or for other tabs.
            // For now, let's just add it if it's not from "us" (other tab) or if we want to sync.
            // But simplistic approach: unique ID check.
            setMessages(prev => addSentMessageIfNew(prev, data));
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);
        socket.on('receive-message', onReceiveMessage);
        socket.on('message-sent', onMessageSent);

        if (!socket.connected) {
            socket.connect();
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onConnectError);
            socket.off('receive-message', onReceiveMessage);
            socket.off('message-sent', onMessageSent);
        };
    }, [user]);

    const sendMessage = useCallback(async (receiverId: string, content: string) => {
        // Optimistic update
        if (user) {
            const tempId = `temp-${Date.now()}`;
            setMessages(prev => [...prev, {
                id: tempId,
                senderId: user.id,
                receiverId: receiverId,
                content,
                timestamp: new Date(),
                isSelf: true
            }]);

            if (socket.connected) {
                socket.emit('send-message', { receiverId, content });
            } else {
                // Use Server Action as fallback when the socket is disconnected
                try {
                    const result = await sendMessageAction(receiverId, content);
                    if (result.success && result.data) {
                        // Update the temp message with the real ID from DB
                        setMessages(prev => prev.map(m => m.id === tempId ? {
                            ...m,
                            id: result.data.id,
                            timestamp: new Date(result.data.createdAt)
                        } : m));
                    } else {
                        console.error('Failed to send message via Server Action:', result.error);
                        setMessages(prev => prev.filter(m => m.id !== tempId));
                        toast.error(tRef.current('errors.sendFailed'));
                    }
                } catch (error) {
                    console.error('Error in sendMessage fallback:', error);
                    setMessages(prev => prev.filter(m => m.id !== tempId));
                    toast.error(tRef.current('errors.sendFailed'));
                }
            }
        }
    }, [user]);

    return {
        isConnected: SOCKET_CHAT_ENABLED ? isConnected : false,
        messages,
        sendMessage
    };
}
