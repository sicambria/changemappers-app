import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getServerTranslation } from '@/lib/server-i18n';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const { t } = await getServerTranslation('common');
  return { title: `${t('casesPage.metadataTitle')} | Changemappers`, description: t('casesPage.metadataDescription') };
}

export default async function CasesIndexPage() {
  const { t } = await getServerTranslation('common');
  const cases = await prisma.caseWithProvenance.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: { id: true, slug: true, title: true, summary: true, place: true, temporalClass: true, attribution: true },
  });
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 border-b border-gray-200 pb-6 dark:border-gray-800">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{t('casesPage.eyebrow')}</p>
        <h1 className="mt-2 text-4xl font-semibold text-gray-950 dark:text-gray-50">{t('casesPage.title')}</h1>
        <p className="mt-3 max-w-3xl text-gray-600 dark:text-gray-300">{t('casesPage.description')}</p>
      </header>
      {cases.length === 0 ? <p className="rounded-lg border border-gray-200 p-6 text-gray-600 dark:border-gray-800 dark:text-gray-300">{t('casesPage.empty')}</p> : (
        <div className="grid gap-4 sm:grid-cols-2">
          {cases.map((item) => (
            <Link key={item.id} href={`/cases/${item.slug}`} className="rounded-lg border border-gray-200 p-5 hover:border-emerald-400 dark:border-gray-800 dark:hover:border-emerald-700">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500"><span>{item.temporalClass}</span><span>{item.place}</span></div>
              <h2 className="mt-2 text-lg font-semibold text-gray-950 dark:text-gray-50">{item.title}</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{item.summary}</p>
              <p className="mt-3 text-xs text-gray-500">{item.attribution}</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
