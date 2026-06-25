import Link from 'next/link';
import { notFound } from 'next/navigation';
import { governancePages, localizeGovernancePage } from '@/lib/governance-content';
import { getServerTranslation } from '@/lib/server-i18n';

export const revalidate = 60;

export async function generateStaticParams() {
  return Object.keys(governancePages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { t } = await getServerTranslation('common');
  const page = governancePages[slug];
  if (!page) return {};
  const localizedPage = localizeGovernancePage(slug, page, t);
  return { title: `${localizedPage.title} | Changemappers`, description: localizedPage.summary };
}

export default async function GovernancePage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const { t } = await getServerTranslation('common');
  const page = governancePages[slug];
  if (!page) notFound();
  const localizedPage = localizeGovernancePage(slug, page, t);
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/about/governance" className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300">{t('governance.detailBack')}</Link>
      <h1 className="mt-5 text-4xl font-semibold text-gray-950 dark:text-gray-50">{localizedPage.title}</h1>
      <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">{localizedPage.summary}</p>
      <div className="mt-8 space-y-8">
        {localizedPage.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-semibold text-gray-950 dark:text-gray-50">{section.heading}</h2>
            <div className="mt-3 space-y-3 text-gray-700 dark:text-gray-300">
              {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
