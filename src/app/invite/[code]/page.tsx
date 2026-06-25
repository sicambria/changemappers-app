import { redirect } from 'next/navigation';
import prisma, { InviteStatus } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface Props {
    params: Promise<{ code: string }>;
}

export default async function InviteCodePage({ params }: Props) {
    const { code } = await params;
    const normalizedCode = decodeURIComponent(code || '').trim();

    if (!normalizedCode) {
        redirect('/register');
    }

    const invite = await prisma.invite.findUnique({
        where: { code: normalizedCode },
        select: { id: true, status: true, expiresAt: true },
    });

    if (
        invite &&
        invite.expiresAt >= new Date() &&
        (invite.status === InviteStatus.CREATED || invite.status === InviteStatus.SENT || invite.status === InviteStatus.OPENED)
    ) {
        if (invite.status === InviteStatus.SENT) {
            await prisma.invite.update({
                where: { id: invite.id },
                data: { status: InviteStatus.OPENED, openedAt: new Date(), lastActivityAt: new Date() },
                select: { id: true },
            });
        }

        redirect(`/register?inviteCode=${encodeURIComponent(normalizedCode)}`);
    }

    redirect('/register?error=invalid-invite');
}
