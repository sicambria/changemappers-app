'use client';

// Connection Request Button
// Allows users to send connection requests to other users

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Button, Textarea } from '@/components/ui';
import { toast } from 'sonner';
import {
    HeartIcon,
    UserPlusIcon,
    Loader2Icon,
    CheckIcon,
    XIcon
} from 'lucide-react';
import { sendConnectionRequestAction } from '@/app/actions/connection';

export type ConnectionType = 'GENERAL' | 'ROMANTIC' | 'COFOUNDER' | 'SUPPORT' | 'COMMUNITY_MEMBER';

interface ConnectionRequestButtonProps {
    targetUserId: string;
    targetUserName: string;
    existingStatus?: 'none' | 'pending' | 'accepted' | 'declined';
    onSuccess?: () => void;
}

export function ConnectionRequestButton({
  targetUserId,
  targetUserName,
  existingStatus = 'none',
  onSuccess,
}: Readonly<ConnectionRequestButtonProps>) {
  const { t } = useTranslation(['profiles', 'common']);
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [connectionType, setConnectionType] = useState<ConnectionType>('GENERAL');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const connectionTypes: { value: ConnectionType; labelKey: string; icon: string }[] = [
    { value: 'GENERAL', labelKey: 'individual.connections.connectionTypes.general', icon: '🤝' },
    { value: 'ROMANTIC', labelKey: 'individual.connections.connectionTypes.romantic', icon: '💕' },
    { value: 'COFOUNDER', labelKey: 'individual.connections.connectionTypes.coFounder', icon: '🚀' },
    { value: 'SUPPORT', labelKey: 'individual.connections.connectionTypes.support', icon: '💪' },
    { value: 'COMMUNITY_MEMBER', labelKey: 'individual.connections.connectionTypes.communityMember', icon: '🏡' },
  ];

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const result = await sendConnectionRequestAction({
                targetUserId,
                type: connectionType,
                message: message.trim() || undefined,
            });

            if (result.success) {
              toast.success(result.message || t('individual.connections.requestSent'));
              router.refresh();
              onSuccess?.();
              setIsOpen(false);
              setMessage('');
            } else {
              toast.error(result.error || t('individual.connections.modal.errorMessage'));
            }
        } catch (err) {
            console.error('Connection request error:', err);
            toast.error(t('individual.connections.modal.unexpectedError'));
        } finally {
            setIsSubmitting(false);
        }
    };

  // Already connected
  if (existingStatus === 'accepted') {
    return (
      <Button variant="secondary" disabled>
        <CheckIcon className="h-4 w-4" />
        {t('individual.connections.accepted')}
      </Button>
    );
  }

  // Request pending
  if (existingStatus === 'pending') {
    return (
      <Button variant="outline" disabled>
        <Loader2Icon className="h-4 w-4 animate-spin" />
        {t('individual.connections.pending')}
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <UserPlusIcon className="h-4 w-4" />
        {t('individual.connections.connect')}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('individual.connections.sendRequest')}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                aria-label="Close"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('individual.connections.sendRequestTo')} <strong>{targetUserName}</strong>
            </p>

            {/* Connection Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('individual.connections.connectionTypeLabel')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {connectionTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setConnectionType(type.value)}
                    className={`p-3 rounded-lg border text-left transition-colors ${connectionType === type.value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-lg mr-2">{type.icon}</span>
                    <span className="text-sm">{t(type.labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('individual.connections.addMessage')}
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('individual.connections.messagePlaceholder')}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsOpen(false)}
              >
                {t('common:actions.cancel')}
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                data-testid="connection-request-submit-button"
              >
                <HeartIcon className="h-4 w-4" />
                {t('individual.connections.sendRequest')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
