import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/get-current-user';
import { getServerTranslation } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const { t } = await getServerTranslation('common');
  return {
    title: `${t('favoritesPage.title')} | Changemappers`,
    description: t('favoritesPage.description'),
  };
}

export default async function FavoritesPage() {
  const authResult = await getCurrentUser();
  if (!authResult.success || !authResult.data) {
    redirect('/login?redirect=/favorites');
  }

  const { t } = await getServerTranslation('common');

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-4xl flex-col px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-gray-200 pb-6 dark:border-gray-800">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          {t('favoritesPage.eyebrow')}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-950 dark:text-gray-50">
          {t('favoritesPage.title')}
        </h1>
        <p className="mt-3 max-w-2xl text-gray-600 dark:text-gray-300">
          {t('favoritesPage.description')}
        </p>
      </div>

      <section className="flex flex-1 flex-col items-start justify-center py-12">
        <h2 className="text-xl font-semibold text-gray-950 dark:text-gray-50">
          {t('favoritesPage.emptyTitle')}
        </h2>
        <p className="mt-2 max-w-xl text-gray-600 dark:text-gray-300">
          {t('favoritesPage.emptyDescription')}
        </p>
        <Link
          href="/feed"
          className="mt-6 inline-flex items-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:bg-emerald-500 dark:hover:bg-emerald-600"
        >
          {t('favoritesPage.exploreFeed')}
        </Link>
      </section>
    </main>
  );
}
