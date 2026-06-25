'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';

interface Offer {
  id: string;
  domain: string;
}

interface TrainingPageClientProps {
  offers: Offer[];
}

export default function TrainingPageClient({ offers }: Readonly<TrainingPageClientProps>) {
  const { t } = useTranslation('training');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{t('peerTraining')}</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-xl">
            {t('overviewSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-6">
            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{offers.length}</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('activeOffers')}</p>
          </div>
          <div className="rounded-2xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/30 p-6">
            <p className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">{t('requestOpen')}</p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('requestPrompt')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/training/find"
            className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-emerald-900/30 hover:border-emerald-600/50 p-6 transition-all duration-200"
          >
            <div className="mb-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true">Training</div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{t('browseOffers')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
              {t('findTrainersDescription')}
            </p>
          </Link>

          <Link
            href="/training/offer/new"
            className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 hover:border-cyan-300 dark:hover:border-cyan-700 p-6 transition-all duration-200"
          >
            <div className="mb-3 text-teal-600 dark:text-teal-400" aria-hidden="true">Offer</div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{t('createOffer')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
              {t('describeWhatYouCanTeach')}
            </p>
          </Link>

          <Link
            href="/training/request/new"
            className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:border-teal-300 dark:hover:border-teal-700 p-6 transition-all duration-200"
          >
            <div className="mb-3 text-cyan-600 dark:text-cyan-400" aria-hidden="true">Request</div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{t('postRequest')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
              {t('describeSkillsToDevelop')}
            </p>
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-6">
          <Link
            href="/training/connections"
            className="inline-text text-sm text-emerald-400 hover:text-emerald-700 dark:text-emerald-300 underline underline-offset-4 transition-colors"
          >
            {t('viewConnections')}
          </Link>
          <Link
            href="/training/my-requests"
            className="inline-text text-sm text-emerald-400 hover:text-emerald-700 dark:text-emerald-300 underline underline-offset-4 transition-colors"
          >
            {t('viewMyRequests')}
          </Link>
        </div>
      </div>
    </div>
  );
}
