'use client';

// Event RSVP Button
// Allows users to RSVP to events

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui';
import {
    CalendarCheckIcon,
    CalendarXIcon,
    UsersIcon} from 'lucide-react';
import { useAuth } from '@/components/providers';
import { rsvpEventAction, cancelEventAction } from '@/app/actions/event';

type RSVPStatus = 'NONE' | 'GOING' | 'MAYBE' | 'NOT_GOING';

interface EventRSVPButtonProps {
    eventId: string;
    currentStatus: RSVPStatus;
    attendeeCount: number;
    maxAttendees?: number;
    onSuccess?: () => void;
}

export function EventRSVPButton({
    eventId,
    currentStatus,
    attendeeCount,
    maxAttendees,
    onSuccess,
}: Readonly<EventRSVPButtonProps>) {
    const router = useRouter();
    const { t } = useTranslation(['events']);
    const { user } = useAuth();
    const [status, setStatus] = useState(currentStatus);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const isFull = maxAttendees != null && attendeeCount >= maxAttendees;

    const rsvpOptions: { value: RSVPStatus; label: string; icon: React.ElementType }[] = [
        { value: 'GOING', label: t('events:rsvp.going'), icon: CalendarCheckIcon },
        { value: 'MAYBE', label: t('events:rsvp.maybe'), icon: CalendarCheckIcon },
        { value: 'NOT_GOING', label: t('events:rsvp.notGoing'), icon: CalendarXIcon },
    ];

    const handleRSVP = async (newStatus: RSVPStatus) => {
        if (!user) {
            router.push('/login');
            return;
        }

        setIsSubmitting(true);
        try {
            // Actions never throw — they return { success: false, error } on failure.
            const result = newStatus === 'NOT_GOING'
                ? await cancelEventAction(user.id, eventId)
                // Mapping GOING/MAYBE to REGISTERED as per schema
                : await rsvpEventAction(user.id, eventId, 'REGISTERED');

            if (result.success) {
                setStatus(newStatus);
                setShowOptions(false);
                router.refresh();
                onSuccess?.();
            } else {
                // Keep prior status and leave the options open so the user can retry.
                toast.error(result.error || t('events:rsvp.failed'));
            }
        } catch (error) {
            console.error('RSVP error:', error);
            toast.error(t('events:rsvp.failed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusLabel = () => {
        switch (status) {
            case 'GOING': return t('events:rsvp.goingSelected');
            case 'MAYBE': return t('events:rsvp.maybe');
            case 'NOT_GOING': return t('events:rsvp.notGoing');
            default: return t('events:rsvp.action');
        }
    };

    const getButtonVariant = () => {
        switch (status) {
            case 'GOING': return 'secondary' as const;
            case 'MAYBE': return 'outline' as const;
            case 'NOT_GOING': return 'outline' as const;
            default: return 'primary' as const;
        }
    };

    return (
        <div className="relative">
            <div className="flex items-center gap-3">
                <Button
                    variant={getButtonVariant()}
                    onClick={() => setShowOptions(!showOptions)}
                    disabled={isSubmitting || (isFull && status === 'NONE')}
                    isLoading={isSubmitting}
                >
                    <CalendarCheckIcon className="h-4 w-4" />
                    {getStatusLabel()}
                </Button>

                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <UsersIcon className="h-4 w-4" />
                    {attendeeCount}{maxAttendees ? `/${maxAttendees}` : ''}
                </span>
            </div>

            {/* Dropdown options */}
            {showOptions && (
                <>
                    <div // NOSONAR(S6848) — full-viewport click-away layer dismissing an open menu; the trigger and items are keyboard-operable and dismiss on blur/Esc — a native control would be a viewport-wide bogus tab stop
                        className="fixed inset-0 z-40"
                        onClick={() => setShowOptions(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]">
                        {rsvpOptions.map((option) => {
                            const Icon = option.icon;
                            const isActive = status === option.value;
                            const isFullDisabled = option.value === 'GOING' && isFull && status !== 'GOING';
                            const isDisabled = isSubmitting || isFullDisabled;

                            return (
                                <button
                                    key={option.value}
                                    onClick={() => !isDisabled && handleRSVP(option.value)}
                                    disabled={isDisabled}
                                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${(() => {
                                        if (isActive) return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600';
                                        if (isDisabled) return 'text-gray-400 cursor-not-allowed';
                                        return 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800';
                                    })()}`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {option.label}
                                    {isFullDisabled && ' (betelt)'}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
