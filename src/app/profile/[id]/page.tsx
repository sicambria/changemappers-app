import { getPublicProfile } from '@/app/actions/profile';
import { getConnectionStatusAction } from '@/app/actions/connection';
import { getCurrentUser } from '@/app/actions/auth'; // Reusing auth action to check owernship
import PublicProfile from '@/components/profile/PublicProfile';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getServerTranslation } from '@/lib/server-i18n';

interface ProfilePageProps {
    params: Promise<{ id: string }>; // Updated for Next.js 15
}

export default async function ProfilePage({ params }: Readonly<ProfilePageProps>) {
    const { id } = await params;
    const { t, lang } = await getServerTranslation('profiles');

    // Fetch profile data
    const profileResult = await getPublicProfile(id);

    if (!profileResult.success || !profileResult.data) {
        notFound();
    }

    // Check ownership
    const currentUserResult = await getCurrentUser();
    const currentUser = currentUserResult.success ? currentUserResult.data?.user : null;
    const isOwner = currentUser?.id === id;
    const isAdmin = currentUser?.isAdmin === true;

    const [communities, events, pitches, causes] = await Promise.all([
        prisma.community.findMany({
            where: { deletedAt: null, OR: [{ ownerId: id }, { members: { some: { userId: id, status: 'ACTIVE' } } }] },
            select: { id: true, name: true, city: true },
            take: 8,
            orderBy: { updatedAt: 'desc' },
        }),
        prisma.event.findMany({
            where: { deletedAt: null, OR: [{ hostId: id }, { organizers: { some: { userId: id } } }, { EventRsvp: { some: { userId: id } } }] },
            select: { id: true, title: true, startDate: true },
            take: 8,
            orderBy: { startDate: 'desc' },
        }),
        prisma.pitch.findMany({
            where: { authorId: id, archivedAt: null },
            select: { id: true, name: true, summary: true },
            take: 8,
            orderBy: { updatedAt: 'desc' },
        }),
        prisma.socialCause.findMany({
            where: { OR: [{ interestedUsers: { some: { id } } }, { mainCauseUsers: { some: { id } } }, { managers: { some: { id } } }] },
            select: { id: true, title: true, slug: true },
            take: 8,
            orderBy: { title: 'asc' },
        }),
    ]);

    // Fetch connection status
    const statusResult = await getConnectionStatusAction(id);
    const connectionData = statusResult.success && statusResult.data
        ? statusResult.data
        : { status: 'NONE' as const, isSender: false };

    return (
        <>
            <PublicProfile
                profile={profileResult.data}
                isOwner={isOwner}
                connectionData={connectionData}
            />
            <section className="mx-auto max-w-6xl px-4 py-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                <ProfileLinkList title={t('profileLinks.communities')} emptyLabel={t('profileLinks.empty')} items={communities} hrefPrefix="/communities" label={(item) => item.name} meta={(item) => item.city ?? ''} />
                <ProfileLinkList title={t('profileLinks.events')} emptyLabel={t('profileLinks.empty')} items={events} hrefPrefix="/events" label={(item) => item.title} meta={(item) => new Date(item.startDate).toLocaleDateString(lang)} />
                <ProfileLinkList title={t('profileLinks.pitches')} emptyLabel={t('profileLinks.empty')} items={pitches} hrefPrefix="/pitch" label={(item) => item.name} meta={(item) => item.summary} />
                <ProfileLinkList title={t('profileLinks.causes')} emptyLabel={t('profileLinks.empty')} items={causes} hrefPrefix="/causes" id={(item) => item.slug} label={(item) => item.title} />
            </section>
            {isAdmin && (
                <AdminToolbar
                    type="user"
                    id={profileResult.data.id}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    isSuspended={(profileResult.data as any).isSuspended}
                />
            )}
        </>
    );
}

import AdminToolbar from '@/components/admin/AdminToolbar';


type ProfileLinkItem = { id: string };

function ProfileLinkList<T extends ProfileLinkItem>({
    title,
    emptyLabel,
    items,
    hrefPrefix,
    id = (item) => item.id,
    label,
    meta,
}: Readonly<{
    title: string;
    emptyLabel: string;
    items: T[];
    hrefPrefix: string;
    id?: (item: T) => string;
    label: (item: T) => string;
    meta?: (item: T) => string;
}>) {
    return (
        <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            {items.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">{emptyLabel}</p>
            ) : (
                <ul className="space-y-2">
                    {items.map((item) => (
                        <li key={id(item)} className="rounded-md border border-gray-200 p-3 dark:border-gray-800">
                            <Link href={hrefPrefix + '/' + id(item)} className="font-medium text-emerald-700 hover:underline dark:text-emerald-300">
                                {label(item)}
                            </Link>
                            {meta && <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">{meta(item)}</p>}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
