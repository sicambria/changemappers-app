'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

const navLinks = [
  { href: '/coach/find', titleKey: 'overview.browseCoaches', descKey: 'overview.browseDescription' },
  { href: '/coach/connections', titleKey: 'overview.myEngagements', descKey: 'overview.engagementsDescription' },
  { href: '/coach/my-requests', titleKey: 'overview.myRequests', descKey: 'overview.myRequestsDescription' },
  { href: '/coach/requests', titleKey: 'overview.incomingRequests', descKey: 'overview.incomingRequestsDescription' },
];

function NavCard({ href, titleKey, descKey }: Readonly<{ href: string; titleKey: string; descKey: string }>) {
  const { t } = useTranslation('coaching');
  return (
    <Link href={href}
      className="bg-slate-900 border border-slate-700 rounded-xl p-5 hover:border-slate-500 transition-colors group">
      <h3 className="text-lg font-semibold mb-1 group-hover:text-emerald-400 transition-colors">{t(titleKey)}</h3>
      <p className="text-slate-400 text-sm">{t(descKey)}</p>
    </Link>
  );
}

export function CoachOverviewClient() {
  const { t } = useTranslation('coaching');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-10">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-slate-400 text-lg max-w-2xl">{t('subtitle')}</p>
        </div>

        <section className="bg-emerald-950 border border-emerald-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-emerald-300">{t('overview.stylePrompt')}</h2>
          <p className="text-slate-300 text-sm">{t('overview.styleDescription')}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/coach/offer/new"
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              {t('overview.offerButton')}
            </Link>
            <Link href="/coach/request/new"
              className="bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
              {t('overview.requestButton')}
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {navLinks.map((l) => <NavCard key={l.href} {...l} />)}
        </section>

        <section className="bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-2">
          <h3 className="text-base font-semibold text-slate-300">{t('overview.howItWorks')}</h3>
          <ul className="text-slate-400 text-sm space-y-1 list-disc list-inside">
            <li>{t('overview.howItWorksItems.matching')}</li>
            <li>{t('overview.howItWorksItems.accept')}</li>
            <li>{t('overview.howItWorksItems.noRatings')}</li>
            <li>{t('overview.howItWorksItems.availability')}</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
