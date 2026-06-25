import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyAccessToken, refreshAccessToken } from '@/lib/auth';
import { getSystemicGraphDataAction } from '@/app/actions/graph';
import SystemicGraphWrapper from '@/components/features/graph/SystemicGraphWrapper';
import { getServerTranslation } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const { t } = await getServerTranslation('graph');
  return {
    title: `${t('graph.title')} | Changemappers`,
    description: t('graph.description'),
  };
}

export default async function SystemicGraphPage() {
  const { t } = await getServerTranslation('graph');

  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const refreshTokenCookie = cookieStore.get('refreshToken')?.value;

  let payload = token ? verifyAccessToken(token) : null;

  if (!payload && refreshTokenCookie) {
    const newTokens = await refreshAccessToken(refreshTokenCookie);
    if (newTokens) {
      payload = verifyAccessToken(newTokens.accessToken);
    }
  }

  if (!payload) {
    redirect('/login');
  }

  const graphResponse = await getSystemicGraphDataAction();

  if (!graphResponse.success) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center bg-slate-950 p-6 text-white">
        <div className="bg-red-900/40 border border-red-500/50 rounded-xl p-8 max-w-lg w-full text-center">
          <h2 className="text-2xl font-semibold mb-4 text-red-100">{t('graph.errorLoading')}</h2>
          <p className="text-red-200/80 mb-6">{graphResponse.error}</p>
        </div>
      </div>
    );
  }

  const { nodes, links } = graphResponse.data;

  return (
    <main className="relative flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      <SystemicGraphWrapper
        initialNodes={nodes}
        initialLinks={links}
      />
    </main>
  );
}
