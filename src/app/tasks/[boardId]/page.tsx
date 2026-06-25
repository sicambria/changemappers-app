import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBoardAction } from '@/app/actions/board';
import BoardKanbanClient from '@/components/features/coordinate/BoardKanbanClient';
import { getServerTranslation } from '@/lib/server-i18n';

type Props = {
  params: Promise<{ boardId: string }>;
};

export const dynamic = 'force-dynamic';

function KanbanSkeleton() {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4" style={{ minWidth: '1440px' }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="w-56 rounded-xl border border-gray-200 bg-white p-3 animate-pulse shadow-sm">
            <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
            <div className="space-y-2">
              <div className="h-24 bg-gray-100 rounded" />
              <div className="h-24 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function BoardPage({ params }: Readonly<Props>) {
  const { boardId } = await params;
  const { t } = await getServerTranslation('coordinate');

  const result = await getBoardAction(boardId);
  if (!result.success || !result.data) {
    notFound();
  }

  const board = result.data;
  const renderedAt = new Date().toISOString();

  const scopeLabel = () => {
    switch (board.scope) {
      case 'PERSONAL':
        return t('board.personal');
      case 'COMMUNITY_INTERNAL':
        return t('board.communityInternal');
      case 'COMMUNITY_PUBLIC':
        return t('board.communityPublic');
      case 'BIOREGIONAL':
        return `${t('board.bioregional')}: ${board.bioregion}`;
      case 'NATIONAL':
        return `${t('board.national')}: ${board.country}`;
      case 'INTERNATIONAL':
        return t('board.international');
      default:
        return '';
    }
  };

  const communityParam = board.communityId ? `&communityId=${board.communityId}` : '';
  const backlogHref = `/tasks/backlog?boardId=${boardId}${communityParam}`;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{board.name}</h1>
            <p className="text-sm text-gray-500 mt-1">{scopeLabel()}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/tasks/${boardId}/metrics`}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              {t('metrics.title')}
            </Link>
            <Link
              href="/tasks/personal"
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              {t('nav.myBoard')}
            </Link>
            <Link
              href={backlogHref}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              {t('nav.backlog')}
            </Link>
            <Link
              href="/tasks/initiative/new"
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >
              {t('initiative.create')}
            </Link>
          </div>
        </div>

        <Suspense fallback={<KanbanSkeleton />}>
          <BoardKanbanClient
            board={{
              id: board.id,
              name: board.name,
              wipLimits: board.wipLimits as Record<string, number | null> | null,
            }}
            initiatives={board.initiatives.map((i) => ({
              ...i,
              createdAt: new Date(i.createdAt),
              updatedAt: new Date(i.updatedAt),
              completedAt: i.completedAt ? new Date(i.completedAt) : null,
              retrospective: null,
            }))}
            renderedAt={renderedAt}
          />
        </Suspense>
      </div>
    </main>
  );
}
