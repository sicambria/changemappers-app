import { prisma } from '@/lib/prisma';
import { AdminClaimsContent } from '@/components/features/admin/AdminClaimsContent';
import { getServerTranslation } from '@/lib/server-i18n';
import type { ClaimStatus } from '@/lib/prisma-shared';

export async function generateMetadata() {
  const { t } = await getServerTranslation('admin');
  return {
    title: t('claims.metaTitle'),
    description: t('claims.metaDescription'),
  };
}

export const dynamic = 'force-dynamic';

async function fetchClaimsByStatus(status: ClaimStatus | undefined) {
  const where = status ? { claimStatus: status } : {};
  const [communitySettled, eventSettled] = await Promise.allSettled([
    prisma.community.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: {
        claimRequestBy: {
          select: { id: true, name: true, email: true }
        }
      }
    }),
    prisma.event.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 100,
      include: {
        claimRequestBy: {
          select: { id: true, name: true, email: true }
        }
      }
    })
  ]);
  const communityClaims = communitySettled.status === 'fulfilled' ? communitySettled.value : [];
  const eventClaims = eventSettled.status === 'fulfilled' ? eventSettled.value : [];
  return { communityClaims, eventClaims };
}

export default async function AdminClaimsPage({ searchParams }: Readonly<{ searchParams: Promise<{ status?: string }> }>) {
  const params = await searchParams;
  const statusParam = params.status as ClaimStatus | undefined;
  const { communityClaims, eventClaims } = await fetchClaimsByStatus(statusParam);

  const [pendingCounts] = await Promise.all([
    Promise.all([
      prisma.community.count({ where: { claimStatus: 'PENDING' } }),
      prisma.event.count({ where: { claimStatus: 'PENDING' } }),
      prisma.community.count({ where: { claimStatus: 'CLAIMED' } }),
      prisma.event.count({ where: { claimStatus: 'CLAIMED' } }),
      prisma.community.count({ where: { claimStatus: 'REJECTED' } }),
      prisma.event.count({ where: { claimStatus: 'REJECTED' } }),
    ])
  ]);

  const counts = {
    pending: pendingCounts[0] + pendingCounts[1],
    claimed: pendingCounts[2] + pendingCounts[3],
    rejected: pendingCounts[4] + pendingCounts[5],
  };

  return (
    <AdminClaimsContent
      communityClaims={communityClaims.map(c => ({
        id: c.id,
        name: c.name,
        updatedAt: c.updatedAt,
        claimStatus: c.claimStatus,
        claimRequestBy: c.claimRequestBy ? {
          id: c.claimRequestBy.id,
          name: c.claimRequestBy.name,
          email: c.claimRequestBy.email
        } : null
      }))}
      eventClaims={eventClaims.map(e => ({
        id: e.id,
        title: e.title,
        updatedAt: e.updatedAt,
        claimStatus: e.claimStatus,
        claimRequestBy: e.claimRequestBy ? {
          id: e.claimRequestBy.id,
          name: e.claimRequestBy.name,
          email: e.claimRequestBy.email
        } : null
      }))}
      currentStatus={statusParam || 'PENDING'}
      counts={counts}
    />
  );
}
