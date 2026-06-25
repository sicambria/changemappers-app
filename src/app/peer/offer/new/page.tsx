import Link from 'next/link';
import PeerSupportOfferFormClient from '@/components/features/peer/PeerSupportOfferFormClient';
import ProfessionalSupportBanner from '@/components/features/peer/ProfessionalSupportBanner';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('common');
  return { title: `${t('peerSupport.offerPage.title')} | Changemappers` };
}

export default async function NewPeerSupportOfferPage() {
  const { t } = await getServerTranslation('common');

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <ProfessionalSupportBanner />

        <div className="space-y-2">
          <Link href="/peer" className="text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-700 dark:hover:text-emerald-300">
            {t('peerSupport.back')}
          </Link>
          <h1 className="text-3xl font-bold">{t('peerSupport.offerPage.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('peerSupport.offerPage.description')}</p>
        </div>

        <PeerSupportOfferFormClient />
      </div>
    </main>
  );
}
