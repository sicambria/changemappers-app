import { getEventAction } from '@/app/actions/event';
import { getCurrentUser } from '@/app/actions/auth';
import PublicEvent from '@/components/event/PublicEvent';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { canEditEvent } from '@/lib/permissions';
import { getServerTranslation } from '@/lib/server-i18n';

interface EventPageProps {
    params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: Readonly<EventPageProps>) {
    const { id } = await params;
    const { t } = await getServerTranslation('events');

    // Fetch data
    const [eventRes, userRes] = await Promise.all([
        getEventAction(id),
        getCurrentUser()
    ]);

    if (!eventRes.success || !eventRes.data) {
        notFound();
    }

    const user = userRes.data?.user;
    const isOwner = user ? await canEditEvent(user, id) : false;
    const community = eventRes.data.community as { id: string; name: string } | null | undefined;
    const organizers = (eventRes.data.organizers as Array<{ role: string; user: { id: string; name: string; displayName: string | null } }> | undefined) ?? [];
    const causes = (eventRes.data.causes as Array<{ id: string; slug: string; title: string }> | undefined) ?? [];
    const rdgTags = (eventRes.data.rdgTags as Array<{ id: string; title: string }> | undefined) ?? [];

    // Check RSVP status
    let rsvpStatus: 'INTERESTED' | 'GOING' | 'NOT_GOING' | 'WAITLIST' | null = null;
    if (user) {
const rsvp = await prisma.eventRsvp.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId: user.id
        }
      },
      select: { status: true }
    });

        // Map DB status to Frontend status
        if (rsvp) {
            if (rsvp.status === 'REGISTERED') rsvpStatus = 'GOING'; // Assuming REGISTERED means GOING
            else if (rsvp.status === 'WAITLISTED') rsvpStatus = 'WAITLIST';
            // CANCELLED -> null or NOT_GOING? usually null if not attending
        }
    }

    return (
        <>
            <PublicEvent
                event={eventRes.data}
                isOwner={isOwner}
                rsvpStatus={rsvpStatus}
            />
            <section className="mx-auto max-w-4xl px-4 py-8 space-y-6">
                {community && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('details.hostedBy')}</h2>
                        <Link href={'/communities/' + community.id} className="text-emerald-700 hover:underline dark:text-emerald-300">
                            {community.name}
                        </Link>
                    </div>
                )}
                {organizers.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('relations.organizers')}</h2>
                        <ul className="mt-2 flex flex-wrap gap-2">
                            {organizers.map((organizer) => (
                                <li key={organizer.user.id} className="rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-800">
                                    <Link href={'/profile/' + organizer.user.id} className="font-medium hover:underline">
                                        {organizer.user.displayName || organizer.user.name}
                                    </Link>
                                    <span className="ml-2 text-gray-500">{organizer.role}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                {(causes.length > 0 || rdgTags.length > 0) && (
                    <div className="space-y-3">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('relations.linkedFocus')}</h2>
                        <div className="flex flex-wrap gap-2">
                            {causes.map((cause) => (
                                <Link key={cause.id} href={'/causes/' + cause.slug} className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-100">
                                    {cause.title}
                                </Link>
                            ))}
                            {rdgTags.map((rdg) => (
                                <span key={rdg.id} className="rounded-full bg-sky-50 px-3 py-1 text-sm text-sky-800 dark:bg-sky-950 dark:text-sky-100">
                                    {rdg.title}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </section>
            {user?.isAdmin && (
                <AdminToolbar
                    type="event"
                    id={eventRes.data.id}
                    currentStatus={eventRes.data.moderationStatus ?? undefined}
                />
            )}
        </>
    );
}

import AdminToolbar from '@/components/admin/AdminToolbar';
