import type { Metadata } from 'next';
import { HelpSearchClient, type HelpSection } from '@/components/help/HelpSearchClient';
import { getServerTranslation } from '@/lib/server-i18n';

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isHelpSection(value: unknown): value is HelpSection {
  if (typeof value !== 'object' || value === null) return false;

  const section = value as Record<string, unknown>;
  return (
    typeof section.id === 'string'
    && typeof section.title === 'string'
    && typeof section.summary === 'string'
    && isStringArray(section.items)
  );
}

function getHelpSections(value: unknown): HelpSection[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isHelpSection);
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation('common');
  return {
    title: `${t('helpPage.metadataTitle')} | Changemappers`,
    description: t('helpPage.intro'),
  };
}

export default async function HelpPage() {
  const { t } = await getServerTranslation('common');
  const sections = getHelpSections(t('helpPage.sections', { returnObjects: true }));

  return (
    <main className="min-h-[calc(100vh-8rem)] overflow-hidden bg-[radial-gradient(circle_at_top_left,#dcfce7,transparent_34%),linear-gradient(135deg,#f8fafc_0%,#eef6f0_48%,#f8fafc_100%)] px-4 py-12 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <section className="relative mb-10 overflow-hidden rounded-[2rem] border border-emerald-100 bg-white/80 p-8 shadow-sm backdrop-blur md:p-12">
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-emerald-200/50 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-20 left-24 h-52 w-52 rounded-full bg-amber-100/70 blur-3xl" aria-hidden="true" />
          <div className="relative max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-700">{t('helpPage.eyebrow')}</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">{t('helpPage.title')}</h1>
            <p className="mt-5 text-lg leading-8 text-slate-600 md:text-xl">{t('helpPage.intro')}</p>
          </div>
        </section>

        <HelpSearchClient
          sections={sections}
          searchLabel={t('helpPage.searchLabel')}
          searchPlaceholder={t('helpPage.searchPlaceholder')}
          resultsLabel={t('helpPage.resultsLabel', { count: sections.length })}
          noResultsTitle={t('helpPage.noResultsTitle')}
          noResultsBody={t('helpPage.noResultsBody')}
          tocLabel={t('helpPage.tocLabel')}
          filterLabel={t('helpPage.filterLabel')}
          clearFilterLabel={t('helpPage.clearFilterLabel')}
        />
      </div>
    </main>
  );
}
