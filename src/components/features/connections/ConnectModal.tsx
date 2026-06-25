'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sendConnectionRequestAction } from '@/app/actions/connection';
import { Button, Modal } from '@/components/ui';
import { ConnectionType } from '@/lib/prisma-shared';
import { XIcon, HeartHandshakeIcon, GraduationCapIcon, RouteIcon, UserPlusIcon } from 'lucide-react';

interface ConnectModalProps {
    targetId: string;
    targetName: string;
    connectionType: ConnectionType;
    isOpen: boolean;
    onClose: () => void;
}

export function ConnectModal({ targetId, targetName, connectionType, isOpen, onClose }: Readonly<ConnectModalProps>) {
    const { t } = useTranslation(['profiles', 'common']);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current);
            }
        };
    }, []);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await sendConnectionRequestAction({
                targetUserId: targetId,
                message: message.trim() || undefined,
                type: connectionType
            });

            if (result.success) {
                setSuccessMessage(t('individual.connections.modal.successMessage'));
                if (closeTimeoutRef.current) {
                    clearTimeout(closeTimeoutRef.current);
                }

                closeTimeoutRef.current = setTimeout(() => {
                    onClose();
                    setSuccessMessage(null);
                    setMessage('');
                    closeTimeoutRef.current = null;
                }, 2000);
            } else {
                setError(result.error || t('individual.connections.modal.errorMessage'));
            }
        } catch {
            setError(t('individual.connections.modal.unexpectedError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const getConfig = () => {
        const typeKey = connectionType as string;
        const validKeys = ['MENTORING', 'PEER_LEARNING', 'SUPPORT'];
        const key = validKeys.includes(typeKey) ? typeKey : 'default';
        const base = `individual.connections.modal.types.${key}`;

        const iconMap: Record<string, React.ReactNode> = {
            MENTORING: <GraduationCapIcon className="w-6 h-6 text-indigo-500" />,
            PEER_LEARNING: <RouteIcon className="w-6 h-6 text-blue-500" />,
            SUPPORT: <HeartHandshakeIcon className="w-6 h-6 text-rose-500" />,
            default: <UserPlusIcon className="w-6 h-6 text-emerald-500" />,
        };

        const rawRules = t(`${base}.rules`, { returnObjects: true });
        const rules: string[] = Array.isArray(rawRules) ? rawRules : [];

        return {
            icon: iconMap[key],
            title: t(`${base}.title`),
            subtitle: t(`${base}.subtitle`),
            rules,
            buttonText: t(`${base}.buttonText`),
        };
    };

    const config = getConfig();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            ariaLabelledBy="connect-modal-title"
            closeOnBackdropClick={!isSubmitting}
            closeOnEscape={!isSubmitting}
            className="max-w-lg"
        >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex gap-4 items-center">
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-full">
                            {config.icon}
                        </div>
                        <div>
                            <h2 id="connect-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">
                                {config.title}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('individual.connections.modal.forRecipient', { name: targetName })}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={isSubmitting} aria-label={t('common:actions.close')} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {successMessage ? (
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center font-medium">
                            {successMessage}
                        </div>
                    ) : (
                        <>
                            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                                    {t('individual.connections.modal.miniTrainingTitle')}
                                </h3>
                                <ul className="space-y-3">
                                    {config.rules.map((rule) => {
                                        const [boldPart, rest] = rule.split(':');
                                        return (
                                            <li key={rule} className="text-sm text-gray-600 dark:text-gray-400 flex gap-2">
                                                <span className="text-emerald-500 mt-1">•</span>
                                                <span>
                                                    <strong className="text-gray-800 dark:text-gray-200">{boldPart}:</strong>
                                                    {rest}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('individual.connections.modal.messageLabel')}
                                </label>
                                <textarea
                                    className="w-full text-sm p-3 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                                    rows={4}
                                    placeholder={t('individual.connections.modal.messagePlaceholder')}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    maxLength={500}
                                />
                                <div className="text-right text-xs text-gray-400">
                                    {message.length} / 500
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800">
                                    {error}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!successMessage && (
                    <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-end gap-3">
                        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                            {t('common:actions.cancel')}
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? t('individual.connections.modal.sending') : config.buttonText}
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
