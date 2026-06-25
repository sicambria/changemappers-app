import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBoardAction, getBoardMetricsAction } from '@/app/actions/board';
import MetricsDashboard from '@/components/features/coordinate/MetricsDashboard';
import { getServerTranslation } from '@/lib/server-i18n';

type Props = {
  params: Promise<{ boardId: string }>;
};

export const revalidate = 60;

export default async function BoardMetricsPage({ params }: Readonly<Props>) {
  const { boardId } = await params;
  const { t } = await getServerTranslation('coordinate');

  const boardResult = await getBoardAction(boardId);
  if (!boardResult.success || !boardResult.data) {
    notFound();
  }

  const metricsResult = await getBoardMetricsAction(boardId);
  if (!metricsResult.success || !metricsResult.data) {
    notFound();
  }

  const board = boardResult.data;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {board.name} — {t('metrics.title')}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('metrics.subtitle')}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/tasks/${boardId}`}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              {t('metrics.backToBoard')}
            </Link>
          </div>
        </div>

        <MetricsDashboard boardId={boardId} metrics={metricsResult.data} />
      </div>
    </main>
  );
}
