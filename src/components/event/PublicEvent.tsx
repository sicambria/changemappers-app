'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button,
    Badge,
    InPlaceImageEditor
} from '@/components/ui';
import { toast } from 'sonner';
import {
    ShieldIcon,
    MapPinIcon,
    UsersIcon,
    CalendarIcon,
    EditIcon,
    ArrowLeftIcon,
    CheckCircleIcon,
    ClockIcon,
    TagIcon,
} from 'lucide-react';
import { cancelEventAction, rsvpEventAction, updateEventAction } from '@/app/actions/event';
import { requestClaimAction } from '@/app/actions/claim';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/providers';

interface Event {
    id: string;
    title: string;
    description?: string;
    type: string;
    category?: string;
    location?: string;
    isOnline: boolean;
    startDateTime: string | Date;
    endDateTime?: string | Date;
    coverImageUrl?: string;
    hostName?: string; // Derived or direct
    costType: string;
    costAmount?: string;
    status: string;
    createdAt: Date;
    registrationType?: string;

    // Claim info
    source?: 'USER' | 'IMPORT';
    claimStatus?: 'UNCLAIMED' | 'PENDING' | 'CLAIMED' | 'REJECTED';
}

interface PublicEventProps {
    event: Event;
    isOwner: boolean;
    rsvpStatus?: 'INTERESTED' | 'GOING' | 'NOT_GOING' | 'WAITLIST' | null;
}

export default function PublicEvent({ event, isOwner, rsvpStatus: initialRsvp }: Readonly<PublicEventProps>) {
    const { t, i18n } = useTranslation(['events', 'common']);
    const dateLocale = i18n.resolvedLanguage || 'en';
    const { user } = useAuth();
    const router = useRouter();
    const [rsvpStatus, setRsvpStatus] = useState(initialRsvp);
    const [isLoading, setIsLoading] = useState(false);
    const [claimLoading, setClaimLoading] = useState(false);

    const handleCoverUpload = async (base64: string) => {
        if (!user) return;
        try {
            const result = await updateEventAction(user.id, event.id, {
                coverImage: base64
            });

            if (result.success) {
                toast.success(t('common:messages.saveSuccess'));
                router.refresh();
            } else {
                toast.error(result.error || t('common:errors.saveFailed'));
            }
        } catch {
            toast.error(t('common:errors.saveFailed'));
        }
    };

    const handleRsvp = async (status: 'GOING' | 'INTERESTED' | 'NOT_GOING') => {
        if (!user) return;
        setIsLoading(true);
        try {
            const result = status === 'NOT_GOING' ? await cancelEventAction(user.id, event.id) : await rsvpEventAction(user.id, event.id, 'REGISTERED');
            if (result.success) {
                setRsvpStatus(status === 'NOT_GOING' ? null : status);
            } else {
                toast.error(result.error || t('rsvp.failed'));
            }
        } catch {
            toast.error(t('rsvp.failed'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleClaim = async () => {
        if (!user) return;
        setClaimLoading(true);
        const result = await requestClaimAction('EVENT', event.id);
        if (result.success) {
            toast.success(t('claims.success'));
            router.refresh();
        } else {
            toast.error(result.error);
        }
        setClaimLoading(false);
    };

    const startDate = new Date(event.startDateTime);
    const endDate = event.endDateTime ? new Date(event.endDateTime) : null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Link href="/map" className="inline-flex items-center text-sm text-gray-500 hover:text-emerald-600 mb-6 transition-colors">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                {t('common:actions.backToMap')}
            </Link>

            {/* Header */}
            <div className="relative rounded-2xl overflow-hidden h-64 mb-8 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800">
                <InPlaceImageEditor
                    type="cover"
                    currentImage={event.coverImageUrl}
                    isEditable={isOwner}
                    onUpload={handleCoverUpload}
                    className="absolute inset-0 w-full h-full"
                    alt={event.title}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-8 pointer-events-none">
                    <div className="flex-1 text-white pointer-events-auto">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-white border-white/30 bg-black/20 backdrop-blur-sm">
                                {event.category || event.type}
                            </Badge>
                            <Badge className={`${event.isOnline ? 'bg-blue-500' : 'bg-orange-500'} text-white border-none`}>
                                {event.isOnline ? t('details.online') : t('details.inPerson')}
                            </Badge>
                        </div>
                        <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
                        <div className="flex items-center gap-4 text-white/90">
                            <span className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                                {startDate.toLocaleDateString(dateLocale)} {startDate.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {event.location && (
                                <span className="flex items-center gap-1">
                                    <MapPinIcon className="h-4 w-4" />
                                    {event.location}
                                </span>
                            )}
                        </div>
                    </div>

                    {isOwner && (
                        <Link href={`/events/${event.id}/edit`}>
                            <Button variant="secondary" className="shadow-lg">
                                <EditIcon className="h-4 w-4 mr-2" />
                                {t('common:actions.edit')}
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-2 space-y-8">
                    {/* About */}
                    <div className="prose dark:prose-invert max-w-none">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            {t('details.description')}
                        </h2>
                        <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
                            {event.description || t('details.noDescription')}
                        </p>
                    </div>

                    {/* Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('details.sectionTitle')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <ClockIcon className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium">{t('details.date')}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {startDate.toLocaleDateString(dateLocale)} {startDate.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}
                                        {endDate && ` - ${endDate.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <UsersIcon className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium">{t('details.hostedBy')}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {event.hostName || t('details.unknownHost')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <TagIcon className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium">{t('details.admission')}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {event.costType === 'FREE' ? t('details.free') : `${event.costAmount || ''} HUF`}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Claim Card (Only for IMPORTED & (UNCLAIMED or PENDING)) */}
                    {event.source === 'IMPORT' && (event.claimStatus === 'UNCLAIMED' || event.claimStatus === 'PENDING') && (
                        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800/30">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-500">
                                    <ShieldIcon className="h-4 w-4" />
                                    {t('claims.title')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                                    {t('claims.description')}
                                </p>
                                {event.claimStatus === 'PENDING' ? (
                                    <Button disabled variant="outline" className="w-full bg-amber-100 text-amber-700 border-amber-200">
                                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                                        {t('claims.pending')}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleClaim}
                                        disabled={!user || claimLoading}
                                        isLoading={claimLoading}
                                        className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                                    >
                                        {t('claims.submit')}
                                    </Button>
                                )}
                                {!user && (
                                    <p className="text-xs text-center mt-2 text-gray-500">{t('claims.loginRequired')}</p>
                                )}
                            </CardContent>
                        </Card>
                    )}



                    {/* RSVP Card */}
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle className="text-base">{t('rsvp.sectionTitle')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {rsvpStatus === 'GOING' ? (
                                <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                                    <CheckCircleIcon className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                                    <p className="font-medium text-emerald-800 dark:text-emerald-300">{t('rsvp.confirmed')}</p>
                                    <Button variant="ghost" size="sm" onClick={() => handleRsvp('NOT_GOING')} data-testid="event-rsvp-cancel-button" isLoading={isLoading} disabled={isLoading} className="mt-2 text-red-500 hover:text-red-600 hover:bg-red-50">
                                        {t('rsvp.cancel')}
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Button
                                        className="w-full"
                                        onClick={() => handleRsvp('GOING')}
                                        data-testid="event-rsvp-attending-button"
                                        isLoading={isLoading}
                                        disabled={!user || isLoading}
                                    >
                                        {t('rsvp.attending')}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleRsvp('INTERESTED')}
                                        data-testid="event-rsvp-interested-button"
                                        isLoading={isLoading}
                                        disabled={!user || isLoading}
                                    >
                                        {t('rsvp.interested')}
                                    </Button>
                                </>
                            )}

                            {!user && (
                                <div className="text-xs text-center text-gray-500">
                                    {t('rsvp.loginPrompt')} <Link href="/login" className="text-emerald-600 underline">{t('rsvp.loginLink')}</Link>.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

