'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const navLinks = [
  { href: '/mentor/find', titleKey: 'browseMentors', descKey: 'overview.browseDescription' },
  { href: '/mentor/relationships', titleKey: 'nav.relationships', descKey: 'overview.relationshipsDescription' },
  { href: '/mentor/my-requests', titleKey: 'overview.myRequests', descKey: 'overview.myRequestsDescription' },
  { href: '/mentor/requests', titleKey: 'overview.incomingRequests', descKey: 'overview.incomingRequestsDescription' },
];

function NavCard({ href, titleKey, descKey }: Readonly<{ href: string; titleKey: string; descKey: string }>) {
  const { t } = useTranslation('mentor');
  return (
    <Link href={href}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group">
      <h3 className="text-lg font-semibold mb-1 group-hover:text-emerald-400 transition-colors">{t(titleKey)}</h3>
      <p className="text-gray-600 dark:text-gray-400 text-sm">{t(descKey)}</p>
    </Link>
  );
}

export default function MentorOverviewClient() {
  const { t } = useTranslation('mentor');

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl">{t('distinction')}</p>
        </div>

        <section className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">{t('overview.carryTitle')}</h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm">{t('overview.carryBody')}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/mentor/offer/new"
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              {t('becomeMentor')}
            </Link>
            <Link href="/mentor/request/new"
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              {t('requestMentor')}
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {navLinks.map((l) => <NavCard key={l.href} {...l} />)}
        </section>

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 space-y-2">
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">{t('overview.howTitle')}</h3>
          <ul className="text-gray-600 dark:text-gray-400 text-sm space-y-1 list-disc list-inside">
            <li>{t('overview.howItems.0')}</li>
            <li>{t('overview.howItems.1')}</li>
            <li>{t('overview.howItems.2')}</li>
            <li>{t('overview.howItems.3')}</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
