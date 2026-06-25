import Link from 'next/link';
import { MailIcon } from 'lucide-react';
import { getServerTranslation } from '@/lib/server-i18n';

export async function generateMetadata() {
  const { t } = await getServerTranslation('common');
  return { title: `${t('pendingApproval.metadataTitle')} | Changemappers` };
}

export default async function PendingApprovalPage() {
  const { t } = await getServerTranslation('common');

  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-2xl flex-col justify-center px-4 py-12">
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-950 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="rounded-full bg-amber-100 p-2 text-amber-700">
            <MailIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold text-amber-950">{t('pendingApproval.title')}</h1>
              <p className="mt-2 text-sm leading-6 text-amber-900">{t('pendingApproval.body')}</p>
            </div>
            <p className="text-sm leading-6 text-amber-900">
              {t('pendingApproval.contactPrefix')}{' '}
              <a className="font-semibold underline" href="mailto:changemappers@pm.me">changemappers@pm.me</a>{' '}
              {t('pendingApproval.contactSuffix')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/login" className="rounded-md bg-amber-900 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800">
                {t('pendingApproval.backToLogin')}
              </Link>
              <Link href="/help/email-not-arriving" className="rounded-md border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100">
                {t('pendingApproval.emailHelp')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
