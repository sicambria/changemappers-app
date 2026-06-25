'use client';

// Event Card
// Displays an event with basic information and RSVP functionality

import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/components/providers/LanguageProvider';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';
import { EventRSVPButton } from './EventRSVPButton';
import {
    CalendarIcon,
    MapPinIcon,
    UsersIcon,
    ClockIcon,
    GlobeIcon,
    CalendarPlusIcon,
    FacebookIcon
} from 'lucide-react';

import { generateGoogleCalendarUrl } from '@/lib/calendarUtils';

interface EventCardProps {
    event: {
        id: string;
        title: string;
        description: string | null;
        type: string;
        startDate: string | Date;
        startTime?: string;
        endDate?: string | Date | null;
        location?: string | null;
        isOnline: boolean;
        onlineLink?: string | null;
        host: {
            id: string;
            name: string;
            displayName: string | null;
            profilePhoto: string | null;
        };
        _count: {
            rsvps: number;
        };
        capacity?: number | null;
        facebookEventUrl?: string | null;
    };

    currentUserRSVP?: 'NONE' | 'GOING' | 'MAYBE' | 'NOT_GOING';
    compact?: boolean;
}

const eventTypeIcons: Record<string, string> = {
    WORKSHOP: '🛠️',
    GATHERING: '🤝',
    WORKDAY: '👷',
    CELEBRATION: '🎉',
    TRAINING: '📚',
    OTHER: '📌',
};


export function EventCard({ event, currentUserRSVP = 'NONE', compact = false }: Readonly<EventCardProps>) {
  const { t } = useTranslation(['events', 'common']);
  const { language } = useLanguage();

  const formatDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (timeStr?: string) => {
        if (!timeStr) return '';
        return timeStr.slice(0, 5);
    };

    const isUpcoming = new Date(event.startDate) >= new Date();
    const isPast = new Date(event.startDate) < new Date();

    if (compact) {
        return (
            <Card className={`hover:shadow-md transition-shadow ${isPast ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                            {eventTypeIcons[event.type] || '📅'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <Link
                                href={`/events/${event.id}`}
                                className="font-medium text-gray-900 dark:text-white hover:text-emerald-600 transition-colors block truncate"
                            >
                                {event.title}
                            </Link>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                <CalendarIcon className="h-3 w-3" />
                                {formatDate(event.startDate)}
                                {event.startTime && ` · ${formatTime(event.startTime)}`}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`hover:shadow-lg transition-shadow ${isPast ? 'opacity-75' : ''}`}>
            <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                        {eventTypeIcons[event.type] || '📅'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400">
                                {t(`eventTypes.${event.type}`, { defaultValue: event.type })}
                            </span>
                            {isPast && (
                                <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-500">
                                    {t('status.past', 'Past')}
                                </span>
                            )}
                        </div>
                        <Link
                            href={`/events/${event.id}`}
                            className="font-semibold text-lg text-gray-900 dark:text-white hover:text-emerald-600 transition-colors block"
                        >
                            {event.title}
                        </Link>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {event.description}
                </p>

                {/* Meta info */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <CalendarIcon className="h-4 w-4 text-emerald-600" />
                        <span>{formatDate(event.startDate)}</span>
                        {event.startTime && (
                            <>
                                <ClockIcon className="h-4 w-4 ml-2" />
                                <span>{formatTime(event.startTime)}</span>
                            </>
                        )}
                    </div>

                    {event.isOnline ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <GlobeIcon className="h-4 w-4 text-emerald-600" />
                            <span>{t('labels.onlineEvent', 'Online event')}</span>
                        </div>
                    ) : event.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <MapPinIcon className="h-4 w-4 text-emerald-600" />
                            <span className="truncate">{event.location}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <UsersIcon className="h-4 w-4" />
                        <span>
                            {t('labels.attendeeCount', { count: event._count.rsvps, defaultValue: '{{count}} attendees' })}
                            {event.capacity && ` / ${event.capacity} max`}
                        </span>
                    </div>
                </div>

                {/* Organizer */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    {t('labels.organizer', 'Organizer')}: <Link href={`/profile/${event.host.id}`} className="hover:text-emerald-600">{event.host.displayName || event.host.name}</Link>
                </p>

                {/* RSVP */}
                {isUpcoming && (
                    <div className="flex gap-2">
                        <EventRSVPButton
                            eventId={event.id}
                            currentStatus={currentUserRSVP}
                            attendeeCount={event._count.rsvps}
                            maxAttendees={event.capacity || undefined}
                        />
                        {event.facebookEventUrl && (
                            <a
                                href={event.facebookEventUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-[#1877F2] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title={t('labels.facebookEvent', 'Facebook event')}
                            >
                                <FacebookIcon className="h-5 w-5" />
                            </a>
                        )}
                        <a
                            href={generateGoogleCalendarUrl({
                                title: event.title,
                                description: event.description ?? '',
                                location: event.isOnline ? (event.onlineLink || 'Online') : (event.location ?? undefined),
                                startDate: event.startDate,
                                endDate: event.endDate ?? undefined
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            title={t('addToCalendar', 'Add to Google Calendar')}
                        >
                            <CalendarPlusIcon className="h-5 w-5" />
                        </a>

                    </div>
                )}
            </CardContent>
        </Card>
    );
}
