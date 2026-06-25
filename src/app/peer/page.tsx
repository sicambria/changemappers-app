import { Metadata } from 'next';
import Link from 'next/link';
import ProfessionalSupportBanner from '@/components/features/peer/ProfessionalSupportBanner';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslation('common');
  return {
    title: `${t('peerSupport.title')} | Changemappers`,
    description: t('peerSupport.metaDescription'),
  };
}

function NavCard({ href, title, body }: Readonly<{ href: string; title: string; body: string }>) {
  return (
    <Link href={href}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group">
      <h3 className="text-lg font-semibold mb-1 group-hover:text-emerald-400 transition-colors">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{body}</p>
    </Link>
  );
}

export default async function PeerSupportOverviewPage() {
  const { t } = await getServerTranslation('common');

  const navCards = [
    { href: '/peer/find', title: t('peerSupport.browseTitle'), body: t('peerSupport.browseBody') },
    { href: '/peer/connections', title: t('peerSupport.connectionsTitle'), body: t('peerSupport.connectionsBody') },
    { href: '/peer/my-requests', title: t('peerSupport.myRequestsTitle'), body: t('peerSupport.myRequestsBody') },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <ProfessionalSupportBanner />

        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">{t('peerSupport.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl">{t('peerSupport.description')}</p>
        </div>

        <section className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">{t('peerSupport.offerTitle')}</h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm">{t('peerSupport.offerBody')}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/peer/offer/new"
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              {t('peerSupport.offerCta')}
            </Link>
            <Link href="/peer/request/new"
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              {t('peerSupport.seekCta')}
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {navCards.map((c) => <NavCard key={c.href} {...c} />)}
        </section>

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-2">
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">{t('peerSupport.boundariesTitle')}</h3>
          <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-1 list-disc list-inside">
            <li>{t('peerSupport.boundaries.boundaryStatements')}</li>
            <li>{t('peerSupport.boundaries.noRatings')}</li>
            <li>{t('peerSupport.boundaries.pauseAnytime')}</li>
            <li>{t('peerSupport.boundaries.notCrisis')}</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
