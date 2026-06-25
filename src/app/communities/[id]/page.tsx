import { getCommunityAction, getCommunityRelationsAction } from '@/app/actions/community';
import { getCurrentUser } from '@/app/actions/auth';
import PublicCommunity from '@/components/community/PublicCommunity';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import type { MemberStatus, ModerationStatus } from '@/lib/prisma';
import AdminToolbar from '@/components/admin/AdminToolbar';
import CommunityAdminPanel from '@/components/community/CommunityAdminPanel';
import Link from 'next/link';
import { canModerateCommunity } from '@/lib/permissions';
import { getServerTranslation } from '@/lib/server-i18n';

interface CommunityPageProps {
    params: Promise<{ id: string }>;
}

export default async function CommunityPage({ params }: Readonly<CommunityPageProps>) {
    const { id } = await params;
    const { t, lang } = await getServerTranslation('communities');

    // Fetch data
    const [communityRes, userRes] = await Promise.all([
        getCommunityAction(id),
        getCurrentUser()
    ]);

    if (!communityRes.success || !communityRes.data) {
        notFound();
    }

    const user = userRes.data?.user;
    const isOwner = user?.id === communityRes.data.ownerId;
    const [relationsRes, canModerate] = await Promise.all([
        getCommunityRelationsAction(id),
        user ? canModerateCommunity(user, id) : Promise.resolve(false),
    ]);
    const relations = relationsRes.success ? relationsRes.data : undefined;
    const upcomingEvents = (relations?.upcomingEvents as Array<{ id: string; title: string; startDate: Date; location: string | null }> | undefined) ?? [];
    const pastEvents = (relations?.pastEvents as Array<{ id: string; title: string; startDate: Date; location: string | null }> | undefined) ?? [];
    const initiatives = (relations?.initiatives as Array<{ id: string; title: string; state: string }> | undefined) ?? [];
    const pitches = (relations?.pitches as Array<{ id: string; name: string; summary: string }> | undefined) ?? [];
    const socialIssues = (relations?.socialIssues as Array<{ id: string; title: string; category: string }> | undefined) ?? [];
    const weakSignals = (relations?.weakSignals as Array<{ id: string; title: string; domain: string }> | undefined) ?? [];
    const causes = (relations?.causes as Array<{ id: string; slug: string; title: string }> | undefined) ?? [];
    const members = (relations?.members as Array<{ role: string; user: { id: string; name: string; displayName: string | null } }> | undefined) ?? [];

    // Check membership
    let memberStatus: MemberStatus | null = null;

    if (user) {
const memberRecord = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId: user.id
        }
      },
      select: { status: true }
    });
        if (memberRecord) {
            memberStatus = memberRecord.status;
        }
    }


    const isMember = memberStatus === 'ACTIVE';
    const isPending = memberStatus === 'PENDING';

    return (
        <>
            <PublicCommunity
                community={communityRes.data}
                isOwner={isOwner}
                isMember={isMember}
                isPending={isPending}
                memberStatus={memberStatus}
            />
            <section className="mx-auto max-w-6xl px-4 py-8 space-y-8">
                <div className="grid gap-6 lg:grid-cols-2">
                    <CommunityLinkList title={t('relations.upcomingEvents')} emptyLabel={t('relations.empty')} items={upcomingEvents} hrefPrefix="/events" meta={(item) => new Date(item.startDate).toLocaleDateString(lang)} />
                    <CommunityLinkList title={t('relations.pastEvents')} emptyLabel={t('relations.empty')} items={pastEvents} hrefPrefix="/events" meta={(item) => new Date(item.startDate).toLocaleDateString(lang)} />
                </div>
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    <CommunityLinkList title={t('relations.initiatives')} emptyLabel={t('relations.empty')} items={initiatives} hrefPrefix="/coordinate/initiatives" meta={(item) => item.state} />
                    <CommunityLinkList title={t('relations.pitches')} emptyLabel={t('relations.empty')} items={pitches} hrefPrefix="/pitch" label={(item) => item.name} meta={(item) => item.summary} />
                    <CommunityLinkList title={t('relations.socialIssues')} emptyLabel={t('relations.empty')} items={socialIssues} hrefPrefix="/social-issues" meta={(item) => item.category} />
                    <CommunityLinkList title={t('relations.signals')} emptyLabel={t('relations.empty')} items={weakSignals} hrefPrefix="/signals" meta={(item) => item.domain} />
                    <CommunityLinkList title={t('relations.causes')} emptyLabel={t('relations.empty')} items={causes} hrefPrefix="/causes" id={(item) => item.slug} />
                    <CommunityLinkList title={t('relations.members')} emptyLabel={t('relations.empty')} items={members} hrefPrefix="/profile" id={(item) => item.user.id} label={(item) => item.user.displayName || item.user.name} meta={(item) => item.role} />
                </div>
            </section>
            {canModerate && (
                <div className="max-w-4xl mx-auto px-4 pb-8">
                    <CommunityAdminPanel communityId={communityRes.data.id} />
                </div>
            )}
            {user?.isAdmin && (
                <AdminToolbar
                    type="community"
                    id={communityRes.data.id}
                    currentStatus={communityRes.data.moderationStatus as ModerationStatus | undefined}
                />
            )}
        </>
    );
}




type LinkItem = Record<string, unknown> & { id?: string; title?: string };

function CommunityLinkList<T extends LinkItem>({
    title,
    emptyLabel,
    items,
    hrefPrefix,
    id = (item) => String(item.id),
    label = (item) => String(item.title ?? item.id),
    meta,
}: Readonly<{
    title: string;
    emptyLabel: string;
    items: T[];
    hrefPrefix: string;
    id?: (item: T) => string;
    label?: (item: T) => string;
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
