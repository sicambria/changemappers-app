import ProfessionalSupportBanner from '@/components/features/peer/ProfessionalSupportBanner';
import { getServerTranslation } from '@/lib/server-i18n';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PeerSupportOfferDetailPage({ params }: Readonly<Props>) {
  const { id } = await params;
  const { t } = await getServerTranslation('common');

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <ProfessionalSupportBanner />

        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4 mt-6">
          {t('peerSupport.detailPage.title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-2">{t('peerSupport.detailPage.offerId')} {id}</p>
        <p className="text-gray-500 dark:text-gray-400">{t('peerSupport.detailPage.comingSoon')}</p>
      </div>
    </main>
  );
}
