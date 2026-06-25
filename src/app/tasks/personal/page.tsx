import { getCurrentUser } from '@/lib/get-current-user';
import prisma, { Prisma } from '@/lib/prisma';
import { getDefaultWipLimitsForScope } from '@/lib/validations/board';
import ClientRedirect from '@/components/shared/ClientRedirect';

export const dynamic = 'force-dynamic';

export default async function PersonalBoardPage() {
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) {
    return <ClientRedirect href="/login?redirect=/tasks/personal" />;
  }

  let board = await prisma.board.findFirst({
    where: { scope: 'PERSONAL', ownerId: auth.data.id, deletedAt: null },
    select: { id: true },
  });

  board ??= await prisma.board.create({
    data: {
      name: 'My Tasks',
      scope: 'PERSONAL',
      visibility: 'PRIVATE',
      ownerId: auth.data.id,
      wipLimits: getDefaultWipLimitsForScope('PERSONAL') as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  return <ClientRedirect href={`/tasks/${board.id}`} />;
}
