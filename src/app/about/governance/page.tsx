import Link from 'next/link';
import { governanceIndex, localizeGovernancePage } from '@/lib/governance-content';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('common');
  return {
    title: `${t('governance.title')} | Changemappers`,
    description: t('governance.description'),
  };
}

export default async function GovernanceIndexPage() {
  const { t } = await getServerTranslation('common');
  const sections = ['refusal', 'challenge', 'power', 'limits'] as const;
  const localizedCards = governanceIndex.map((page) => ({
    ...page,
    ...localizeGovernancePage(page.slug, page, t),
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header className="space-y-4 border-b border-slate-200 pb-6 dark:border-slate-800">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            {t('governance.eyebrow')}
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('governance.title')}</h1>
          <p className="max-w-3xl text-base leading-7 text-slate-700 dark:text-slate-300">
            {t('governance.description')}
          </p>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-semibold">{t('governance.charterTitle')}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            {t('governance.charterBody')}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800" href="/about">
              {t('governance.aboutLink')}
            </Link>
            <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" href="/privacy">
              {t('governance.privacyLink')}
            </Link>
            <Link className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" href="/cases">
              {t('governance.casesLink')}
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold">{t(`governance.sections.${section}.title`)}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                {t(`governance.sections.${section}.body`)}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-950 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-100">
          <h2 className="text-lg font-semibold">{t('governance.openWorkTitle')}</h2>
          <p className="mt-2 text-sm leading-6">{t('governance.openWorkBody')}</p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {localizedCards.map((page) => (
            <Link key={page.slug} href={`/about/governance/${page.slug}`} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-700">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{page.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">{page.summary}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
