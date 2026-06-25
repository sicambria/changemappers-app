import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/get-current-user';
import { getBacklogAction } from '@/app/actions/coordinate';
import { getServerTranslation } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ boardId?: string; communityId?: string }>;
};

export default async function BacklogPage({ searchParams }: Readonly<Props>) {
  const { t } = await getServerTranslation('kanban');
  const auth = await getCurrentUser();
  if (!auth.success || !auth.data) {
    redirect('/login');
  }

  const { boardId, communityId } = await searchParams;

  const items = await getBacklogAction(communityId);

  const backLink = boardId ? `/tasks/${boardId}` : '/tasks';
  const scope = communityId ? 'community' : 'global';

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4 flex items-center gap-4">
          <Link href={backLink} className="text-xs text-emerald-600 hover:underline">
            &larr; {t('board')}
          </Link>
          {scope === 'community' ? (
            <Link
              href={boardId ? `/tasks/backlog?boardId=${boardId}` : '/tasks/backlog'}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              {t('showGlobalBacklog')}
            </Link>
          ) : communityId === undefined && (
            <span className="text-xs text-gray-400">{t('showingAllIdeas')}</span>
          )}
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('backlog')}</h1>
            <p className="text-gray-500 mt-1">
              {scope === 'community'
                ? t('communityBacklogSubtitle')
                : t('allBacklogSubtitle')}
            </p>
          </div>
          <Link
            href="/tasks/initiative/new"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            {t('startInitiative')}
          </Link>
        </div>

        {items.length === 0 && (
          <p className="text-gray-400 text-center py-16">
            {t('backlogEmpty')}
          </p>
        )}

        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
            >
              <div className="shrink-0 w-8 text-center">
                <span className="text-sm font-bold text-gray-400">
                  #{index + 1}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-gray-900 text-sm">
                  {item.title}
                </h2>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {t('backlogByPrefix')} {item.createdBy.name}
                </p>
              </div>

              <div className="shrink-0 flex flex-col items-center gap-0.5">
                <span className="text-lg font-bold text-emerald-600">
                  {item.communityResonance}
                </span>
                <span className="text-xs text-gray-400">{t('resonance')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
